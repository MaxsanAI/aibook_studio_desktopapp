import type { AISettings, AIProvider } from '@/types';

// ---------------------------------------------------------------------------
// AI Provider Abstraction — supports OpenAI, Anthropic, Gemini, OpenRouter, Cloudflare
// ---------------------------------------------------------------------------

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

export interface AIResponse {
  content: string;
  tokensUsed: number;
}

export interface AIProviderAdapter {
  name: string;
  models: string[];
  generate(request: AIRequest, settings: AISettings): Promise<AIResponse>;
}

// ---------------------------------------------------------------------------
// OpenAI Adapter (also used by OpenRouter with different base URL)
// ---------------------------------------------------------------------------

function createOpenAIAdapter(baseUrl: string, name: string, models: string[]): AIProviderAdapter {
  return {
    name,
    models,
    async generate(request: AIRequest, settings: AISettings): Promise<AIResponse> {
      const { messages, temperature = settings.temperature, maxTokens = settings.maxTokens, stream, signal, onToken } = request;

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: stream ?? false,
        }),
        signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${name} API error (${response.status}): ${errText}`);
      }

      if (stream && onToken && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content || '';
              if (token) {
                fullContent += token;
                onToken(token);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
        return { content: fullContent, tokensUsed: estimateTokens(fullContent) };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return { content, tokensUsed: data.usage?.total_tokens || estimateTokens(content) };
    },
  };
}

// ---------------------------------------------------------------------------
// Anthropic Adapter
// ---------------------------------------------------------------------------

const anthropicAdapter: AIProviderAdapter = {
  name: 'Anthropic',
  models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  async generate(request: AIRequest, settings: AISettings): Promise<AIResponse> {
    const { messages, temperature = settings.temperature, maxTokens = settings.maxTokens, stream, signal, onToken } = request;

    // Anthropic separates system from conversation messages
    const systemMsg = messages.find((m) => m.role === 'system');
    const convMessages = messages.filter((m) => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: settings.model,
        system: systemMsg?.content || '',
        messages: convMessages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: maxTokens,
        temperature,
        stream: stream ?? false,
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errText}`);
    }

    if (stream && onToken && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullContent += parsed.delta.text;
              onToken(parsed.delta.text);
            }
          } catch {
            // skip
          }
        }
      }
      return { content: fullContent, tokensUsed: estimateTokens(fullContent) };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    return { content, tokensUsed: data.usage?.output_tokens || estimateTokens(content) };
  },
};

// ---------------------------------------------------------------------------
// Google Gemini Adapter
// ---------------------------------------------------------------------------

const geminiAdapter: AIProviderAdapter = {
  name: 'Google Gemini',
  models: ['gemini-3.7-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
  async generate(request: AIRequest, settings: AISettings): Promise<AIResponse> {
    const { messages, temperature = settings.temperature, maxTokens = settings.maxTokens, signal } = request;

    // Gemini uses contents array with parts
    const systemMsg = messages.find((m) => m.role === 'system');
    const convMessages = messages.filter((m) => m.role !== 'system');

    const contents = convMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };
    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') || '';
    return { content, tokensUsed: data.usageMetadata?.totalTokenCount || estimateTokens(content) };
  },
};

// ---------------------------------------------------------------------------
// Cloudflare Workers AI Adapter — free tier, uses OpenAI-compatible endpoint
// The apiKey field stores the Cloudflare API token.
// The accountId is stored in the model field prefix (accountId/model) or
// user can set just the model and we use the Workers AI gateway URL.
// ---------------------------------------------------------------------------

const cloudflareAdapter: AIProviderAdapter = {
  name: 'Cloudflare AI (Free)',
  models: [
    '@cf/meta/llama-3.1-8b-instruct',
    '@cf/meta/llama-3.1-70b-instruct',
    '@cf/meta/llama-3-8b-instruct',
    '@hf/thebloke/mistral-7b-instruct-v0.1-awq',
    '@cf/qwen/qwen1.5-14b-chat-awq',
  ],
  async generate(request: AIRequest, settings: AISettings): Promise<AIResponse> {
    const { messages, temperature = settings.temperature, maxTokens = settings.maxTokens, stream, signal, onToken } = request;

    // The apiKey holds "accountId:apiToken" — user enters both separated by colon
    const [accountId, apiToken] = settings.apiKey.includes(':')
      ? settings.apiKey.split(':', 2)
      : ['', settings.apiKey];

    if (!accountId || !apiToken) {
      throw new Error('Cloudflare AI requires your Account ID and API Token. Enter them as "accountId:apiToken" in the API Key field.');
    }

    const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: stream ?? false,
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cloudflare AI error (${response.status}): ${errText}`);
    }

    if (stream && onToken && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content || '';
            if (token) {
              fullContent += token;
              onToken(token);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
      return { content: fullContent, tokensUsed: estimateTokens(fullContent) };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    return { content, tokensUsed: data.usage?.total_tokens || estimateTokens(content) };
  },
};

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------

const providers: Record<AIProvider, AIProviderAdapter> = {
  openai: createOpenAIAdapter('https://api.openai.com/v1', 'OpenAI', ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']),
  openrouter: createOpenAIAdapter('https://openrouter.ai/api/v1', 'OpenRouter', ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-3.7-flash']),
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
  cloudflare: cloudflareAdapter,
};

export function getProvider(name: AIProvider): AIProviderAdapter {
  return providers[name];
}

export function getAvailableProviders(): { id: AIProvider; name: string; models: string[] }[] {
  return (Object.entries(providers) as [AIProvider, AIProviderAdapter][]).map(([id, adapter]) => ({
    id,
    name: adapter.name,
    models: adapter.models,
  }));
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
