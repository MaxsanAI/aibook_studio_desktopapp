import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button, ErrorBanner } from '@/components/ui';

import { Sun, Moon, Monitor, Save, Key, Cpu, Sliders, Zap, Type, AlignLeft } from 'lucide-react';
import type { AIProvider, AppSettings, ThemeMode, ExportFormat } from '@/types';

export function Settings({ toastSuccess, toastError }: { toastSuccess: (m: string) => void; toastError: (m: string) => void }) {
  const { settings, updateSettings } = useApp();
  const [local, setLocal] = useState<AppSettings | null>(settings || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!local) return null;

  const update = (partial: Partial<AppSettings>) => setLocal({ ...local, ...partial });
  const updateAI = (partial: Partial<AppSettings['aiSettings']>) => setLocal({ ...local, aiSettings: { ...local.aiSettings, ...partial } });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateSettings(local);
      toastSuccess('Settings saved');
    } catch (err) {
      setError((err as Error).message);
      toastError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const providers: { id: AIProvider; label: string; models: string[] }[] = [
    { id: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { id: 'anthropic', label: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'] },
    { id: 'gemini', label: 'Google Gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'] },
    { id: 'openrouter', label: 'OpenRouter', models: ['auto', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash-exp'] },
  ];

  const currentProvider = providers.find((p) => p.id === local.aiSettings.provider)!;

  return (
    <div className="h-full overflow-y-auto bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-2xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">Settings</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">Configure AI, appearance, and editor preferences.</p>
          </div>
          <Button variant="primary" icon={<Save size={16} />} loading={saving} onClick={handleSave}>Save</Button>
        </div>

        {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

        {/* AI Settings */}
        <div className="card p-5 mb-4">
          <h3 className="flex items-center gap-2 mb-4 font-medium text-surface-800 dark:text-surface-100"><Key size={18} className="text-accent-500" /> AI Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="input-label">AI Provider</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => updateAI({ provider: p.id, model: p.models[0] })}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      local.aiSettings.provider === p.id ? 'border-accent-400 bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' : 'border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="input-label">API Key</label>
              <input type="password" className="input" value={local.aiSettings.apiKey} onChange={(e) => updateAI({ apiKey: e.target.value })} placeholder="Enter your API key..." />
              <p className="mt-1 text-xs text-surface-400">Your key is stored locally and never sent to our servers.</p>
            </div>
            <div>
              <label className="input-label">Model</label>
              <select className="select" value={local.aiSettings.model} onChange={(e) => updateAI({ model: e.target.value })}>
                {currentProvider.models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label flex items-center gap-1"><Sliders size={14} /> Temperature: {local.aiSettings.temperature}</label>
                <input type="range" min="0" max="2" step="0.1" value={local.aiSettings.temperature} onChange={(e) => updateAI({ temperature: Number(e.target.value) })} className="w-full accent-accent-500" />
                <p className="text-xs text-surface-400 mt-1">Lower = more focused, higher = more creative</p>
              </div>
              <div>
                <label className="input-label flex items-center gap-1"><Cpu size={14} /> Max Tokens</label>
                <input type="number" className="input" value={local.aiSettings.maxTokens} onChange={(e) => updateAI({ maxTokens: Number(e.target.value) })} step="100" />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded accent-accent-500" checked={local.aiSettings.streamingEnabled} onChange={(e) => updateAI({ streamingEnabled: e.target.checked })} />
              <div>
                <span className="text-sm font-medium">Stream responses</span>
                <p className="text-xs text-surface-400">Show AI-generated text in real-time as it writes.</p>
              </div>
            </label>
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-5 mb-4">
          <h3 className="flex items-center gap-2 mb-4 font-medium text-surface-800 dark:text-surface-100"><Zap size={18} className="text-accent-500" /> Appearance</h3>
          <div className="space-y-4">
            <div>
              <label className="input-label">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {([['light', Sun, 'Light'], ['dark', Moon, 'Dark'], ['system', Monitor, 'System']] as const).map(([mode, Icon, label]) => (
                  <button
                    key={mode}
                    onClick={() => update({ theme: mode as ThemeMode })}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      local.theme === mode ? 'border-accent-400 bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' : 'border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400'
                    }`}
                  >
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="input-label flex items-center gap-1"><Type size={14} /> UI Font Size: {local.fontSize}px</label>
              <input type="range" min="12" max="20" value={local.fontSize} onChange={(e) => update({ fontSize: Number(e.target.value) })} className="w-full accent-accent-500" />
            </div>
            <div>
              <label className="input-label flex items-center gap-1"><AlignLeft size={14} /> Editor Width</label>
              <div className="grid grid-cols-3 gap-2">
                {(['narrow', 'normal', 'wide'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => update({ editorWidth: w })}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                      local.editorWidth === w ? 'border-accent-400 bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' : 'border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card p-5 mb-4">
          <h3 className="mb-4 font-medium text-surface-800 dark:text-surface-100">Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="input-label">Autosave Interval (seconds)</label>
              <input type="number" className="input" value={local.autosaveInterval} onChange={(e) => update({ autosaveInterval: Number(e.target.value) })} min="5" />
            </div>
            <div>
              <label className="input-label">Default Export Format</label>
              <select className="select" value={local.defaultExportFormat} onChange={(e) => update({ defaultExportFormat: e.target.value as ExportFormat })}>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="epub">EPUB</option>
              </select>
            </div>
            <div>
              <label className="input-label">Default Language</label>
              <input className="input" value={local.defaultLanguage} onChange={(e) => update({ defaultLanguage: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Credits */}
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-surface-800 dark:text-surface-100">Credits Balance</h3>
              <p className="text-sm text-surface-500 mt-1">Used for AI generation operations.</p>
            </div>
            <span className="font-display text-2xl font-semibold text-accent-600 dark:text-accent-400">{local.credits.toLocaleString()}</span>
          </div>
        </div>

        <Button variant="primary" icon={<Save size={16} />} loading={saving} onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}
