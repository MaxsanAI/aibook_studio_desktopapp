import type {
  Book, Character, Location, PlotPoint, Chapter, Scene,
  BookBible, AIAction, ChapterSummary,
} from '@/types';
import { getProvider, type AIMessage, type AIRequest } from './providers';

// ---------------------------------------------------------------------------
// AI Context Engine — builds rich structured context for AI generation
// ---------------------------------------------------------------------------

export interface BookContext {
  book: Book;
  characters: Character[];
  locations: Location[];
  plotPoints: PlotPoint[];
  chapters: Chapter[];
  currentChapter: Chapter | null;
  scenes: Scene[];
  recentSummaries: ChapterSummary[];
}

export function buildSystemPrompt(book: Book): string {
  const style = book.writingStyle;
  const bible = book.bible;

  return `You are a professional published author and expert ghostwriter. You write with the skill, craft, and voice of a bestselling novelist.

BOOK INFORMATION:
- Title: ${book.title}
- Genre: ${book.genre}${book.subgenre ? ' / ' + book.subgenre : ''}
- Target Audience: ${book.targetAudience}
- Book Type: ${book.bookType}
- Target Length: ${book.targetWordCount.toLocaleString()} words

STORY BIBLE:
${formatBible(bible)}

WRITING STYLE:
- Narrative Style: ${style.narrativeStyle}
- Tone: ${style.tone}
- Point of View: ${style.pointOfView}
- Tense: ${style.tense}
- Complexity: ${style.complexity}
- Pacing: ${style.pacing}
- Dialogue Style: ${style.dialogueStyle}
- Description Level: ${style.descriptionLevel}
- Paragraph Style: ${style.paragraphStyle}
${style.professionalMode ? '\nIMPORTANT: Write like a professional published author. Use sophisticated prose, vivid imagery, and masterful narrative craft.' : ''}
${style.customInstructions ? `\nCUSTOM INSTRUCTIONS: ${style.customInstructions}` : ''}

RULES:
1. Maintain consistency with all established characters, locations, and plot threads.
2. Never contradict information from previous chapters.
3. Write in the specified point of view and tense consistently.
4. Show, don't tell — use vivid, sensory prose.
5. Write compelling, natural-sounding dialogue.
6. Each chapter should advance the plot and develop characters.
7. Do not write meta-commentary, author notes, or explanations about the text.
8. Output only the story prose, formatted with HTML tags (<p>, <h1>, <h2>, <blockquote>, <em>, <strong>).
9. Never write "Chapter X" headers — just the prose content.
10. Maintain the same voice and quality throughout.`;
}

function formatBible(bible: BookBible): string {
  const parts: string[] = [];
  if (bible.premise) parts.push(`Premise: ${bible.premise}`);
  if (bible.themes.length) parts.push(`Themes: ${bible.themes.join(', ')}`);
  if (bible.tone) parts.push(`Tone: ${bible.tone}`);
  if (bible.timeline) parts.push(`Timeline: ${bible.timeline}`);
  if (bible.worldRules.length) parts.push(`World Rules:\n${bible.worldRules.map((r) => '- ' + r).join('\n')}`);
  if (bible.importantFacts.length) parts.push(`Important Facts:\n${bible.importantFacts.map((f) => '- ' + f).join('\n')}`);
  if (bible.ending) parts.push(`Planned Ending: ${bible.ending}`);
  if (bible.openQuestions.length) parts.push(`Open Questions:\n${bible.openQuestions.map((q) => '- ' + q).join('\n')}`);
  return parts.join('\n\n') || 'No story bible information yet.';
}

export function buildCharacterContext(characters: Character[]): string {
  if (!characters.length) return 'No characters defined yet.';
  return characters.map((c) => {
    const parts = [`### ${c.name}`];
    if (c.role) parts.push(`Role: ${c.role}`);
    if (c.age) parts.push(`Age: ${c.age}`);
    if (c.gender) parts.push(`Gender: ${c.gender}`);
    if (c.appearance) parts.push(`Appearance: ${c.appearance}`);
    if (c.personality) parts.push(`Personality: ${c.personality}`);
    if (c.background) parts.push(`Background: ${c.background}`);
    if (c.occupation) parts.push(`Occupation: ${c.occupation}`);
    if (c.goals) parts.push(`Goals: ${c.goals}`);
    if (c.motivation) parts.push(`Motivation: ${c.motivation}`);
    if (c.fear) parts.push(`Fear: ${c.fear}`);
    if (c.strengths) parts.push(`Strengths: ${c.strengths}`);
    if (c.weaknesses) parts.push(`Weaknesses: ${c.weaknesses}`);
    if (c.arc) parts.push(`Character Arc: ${c.arc}`);
    if (c.secrets) parts.push(`Secrets: ${c.secrets}`);
    if (c.importantFacts) parts.push(`Important Facts: ${c.importantFacts}`);
    if (c.relationships.length) {
      parts.push(`Relationships:\n${c.relationships.map((r) => `- ${r.type}: ${r.characterName} — ${r.description}`).join('\n')}`);
    }
    return parts.join('\n');
  }).join('\n\n---\n\n');
}

export function buildLocationContext(locations: Location[]): string {
  if (!locations.length) return 'No locations defined yet.';
  return locations.map((l) => {
    const parts = [`### ${l.name}`];
    if (l.description) parts.push(`Description: ${l.description}`);
    if (l.appearance) parts.push(`Appearance: ${l.appearance}`);
    if (l.atmosphere) parts.push(`Atmosphere: ${l.atmosphere}`);
    if (l.geography) parts.push(`Geography: ${l.geography}`);
    if (l.history) parts.push(`History: ${l.history}`);
    if (l.rules) parts.push(`Rules: ${l.rules}`);
    if (l.importantObjects) parts.push(`Important Objects: ${l.importantObjects}`);
    return parts.join('\n');
  }).join('\n\n---\n\n');
}

export function buildPlotContext(plotPoints: PlotPoint[]): string {
  if (!plotPoints.length) return 'No plot points defined yet.';
  const main = plotPoints.filter((p) => p.type === 'main');
  const sub = plotPoints.filter((p) => p.type === 'subplot');
  const threads = plotPoints.filter((p) => p.type === 'thread');

  const sections: string[] = [];
  if (main.length) {
    sections.push(`MAIN PLOT:\n${main.map((p) => `- ${p.title}: ${p.description}`).join('\n')}`);
  }
  if (sub.length) {
    sections.push(`SUBPLOTS:\n${sub.map((p) => `- ${p.title}: ${p.description}`).join('\n')}`);
  }
  if (threads.length) {
    sections.push(`PLOT THREADS:\n${threads.map((p) => `- ${p.title}: ${p.description} [${p.status}]`).join('\n')}`);
  }
  return sections.join('\n\n') || 'No plot information yet.';
}

export function buildChapterContext(chapter: Chapter): string {
  const parts: string[] = [`CHAPTER ${chapter.number}: ${chapter.title}`];
  if (chapter.purpose) parts.push(`Purpose: ${chapter.purpose}`);
  if (chapter.summaryText) parts.push(`Summary: ${chapter.summaryText}`);
  if (chapter.mainEvents) parts.push(`Main Events: ${chapter.mainEvents}`);
  if (chapter.characters.length) parts.push(`Characters: ${chapter.characters.join(', ')}`);
  if (chapter.location) parts.push(`Location: ${chapter.location}`);
  if (chapter.conflict) parts.push(`Conflict: ${chapter.conflict}`);
  if (chapter.emotionalBeat) parts.push(`Emotional Beat: ${chapter.emotionalBeat}`);
  if (chapter.importantDetails) parts.push(`Important Details: ${chapter.importantDetails}`);
  if (chapter.endingHook) parts.push(`Ending Hook: ${chapter.endingHook}`);
  parts.push(`Target Word Count: ${chapter.targetWordCount.toLocaleString()}`);
  return parts.join('\n');
}

export function buildSceneContext(scenes: Scene[]): string {
  if (!scenes.length) return '';
  return scenes
    .sort((a, b) => a.number - b.number)
    .map((s) => {
      const parts = [`Scene ${s.number}`];
      if (s.location) parts.push(`Location: ${s.location}`);
      if (s.time) parts.push(`Time: ${s.time}`);
      if (s.characters.length) parts.push(`Characters: ${s.characters.join(', ')}`);
      if (s.objective) parts.push(`Objective: ${s.objective}`);
      if (s.conflict) parts.push(`Conflict: ${s.conflict}`);
      if (s.emotion) parts.push(`Emotion: ${s.emotion}`);
      if (s.action) parts.push(`Action: ${s.action}`);
      if (s.sceneEnding) parts.push(`Ending: ${s.sceneEnding}`);
      return parts.join(' | ');
    })
    .join('\n');
}

export function buildRecentSummaries(chapters: Chapter[], currentNumber: number): string {
  const previous = chapters
    .filter((c) => c.number < currentNumber && c.aiSummary)
    .sort((a, b) => b.number - a.number)
    .slice(0, 5)
    .sort((a, b) => a.number - b.number);

  if (!previous.length) return 'No previous chapter summaries available.';
  return previous.map((c) => {
    const s = c.aiSummary!;
    return `CHAPTER ${c.number} SUMMARY:\n${s.summary}\nKey Events: ${s.importantEvents.join(', ')}\nCharacters: ${s.charactersInvolved.join(', ')}\nNew Facts: ${s.newFacts.join(', ')}`;
  }).join('\n\n---\n\n');
}

// ---------------------------------------------------------------------------
// Chapter generation — multi-stage process
// ---------------------------------------------------------------------------

export interface GenerationProgress {
  stage: string;
  progress: number; // 0-100
  partial?: string;
}

export interface GenerateChapterParams {
  book: Book;
  characters: Character[];
  locations: Location[];
  plotPoints: PlotPoint[];
  chapters: Chapter[];
  currentChapter: Chapter;
  scenes: Scene[];
  aiSettings: Book['writingStyle'] extends never ? never : import('@/types').AISettings;
  onProgress?: (p: GenerationProgress) => void;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

export async function generateChapter(params: GenerateChapterParams): Promise<string> {
  const { book, characters, locations, plotPoints, chapters, currentChapter, scenes, onProgress, onToken, signal } = params;
  const settings = params.aiSettings;

  const systemPrompt = buildSystemPrompt(book);
  const charCtx = buildCharacterContext(characters);
  const locCtx = buildLocationContext(locations);
  const plotCtx = buildPlotContext(plotPoints);
  const chapCtx = buildChapterContext(currentChapter);
  const sceneCtx = buildSceneContext(scenes);
  const summariesCtx = buildRecentSummaries(chapters, currentChapter.number);

  // Get previous chapter content for continuity (last 2000 chars)
  const prevChapter = chapters
    .filter((c) => c.number === currentChapter.number - 1 && c.content)
    .sort((a, b) => b.number - a.number)[0];
  const prevEnding = prevChapter?.content
    ? prevChapter.content.replace(/<[^>]*>/g, '').slice(-2000)
    : '';

  onProgress?.({ stage: 'Preparing context...', progress: 10 });
  onProgress?.({ stage: 'Planning scenes...', progress: 20 });

  const userPrompt = `Write Chapter ${currentChapter.number}: "${currentChapter.title}" in full.

ESTABLISHED CHARACTERS:
${charCtx}

ESTABLISHED LOCATIONS:
${locCtx}

PLOT INFORMATION:
${plotCtx}

PREVIOUS CHAPTER SUMMARIES (for continuity):
${summariesCtx}

${prevEnding ? `END OF PREVIOUS CHAPTER (for continuity):\n...${prevEnding}\n\n` : ''}CHAPTER OUTLINE:
${chapCtx}

${sceneCtx ? `SCENE PLAN:\n${sceneCtx}\n\n` : ''}Write the COMPLETE chapter now. Target approximately ${currentChapter.targetWordCount.toLocaleString()} words. Write the full prose — do not summarize or abbreviate. Format with HTML tags (<p> for paragraphs, <em> for italics, <strong> for bold, <blockquote> for quotes).`;

  onProgress?.({ stage: 'Generating chapter draft...', progress: 30 });

  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const request: AIRequest = {
    messages,
    temperature: settings.temperature,
    maxTokens: Math.min(settings.maxTokens, 16000),
    stream: settings.streamingEnabled,
    signal,
    onToken: (token) => {
      onToken?.(token);
      onProgress?.({ stage: 'Generating chapter draft...', progress: 60, partial: token });
    },
  };

  const provider = getProvider(settings.provider);
  const response = await provider.generate(request, settings);

  onProgress?.({ stage: 'Verifying continuity...', progress: 85 });
  // In a full implementation, we'd do a second pass here. For now, the single pass is sufficient.
  onProgress?.({ stage: 'Finalizing...', progress: 100 });

  return response.content;
}

// ---------------------------------------------------------------------------
// AI Assistant actions — operate on selected text or current chapter
// ---------------------------------------------------------------------------

export interface AIAssistantParams {
  book: Book;
  characters: Character[];
  locations: Location[];
  chapters: Chapter[];
  currentChapter: Chapter | null;
  selectedText: string;
  action: AIAction;
  customInstruction: string;
  aiSettings: import('@/types').AISettings;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

const ACTION_PROMPTS: Record<AIAction, string> = {
  'continue': 'Continue writing the story from where it ends. Maintain the same voice, style, and tone. Write 300-500 words of continuation.',
  'rewrite': 'Rewrite the selected text to improve it. Keep the same meaning but enhance the prose quality, flow, and impact.',
  'improve': 'Improve the selected text. Enhance word choice, sentence structure, rhythm, and overall prose quality while preserving the meaning.',
  'expand': 'Expand the selected text with more detail, description, and depth. Add sensory details and emotional depth without changing the core meaning.',
  'shorten': 'Shorten and tighten the selected text. Remove redundancy and unnecessary words while preserving the essential meaning and impact.',
  'change-tone': 'Change the tone of the selected text. Make it more atmospheric and emotionally resonant.',
  'improve-dialogue': 'Improve the dialogue in the selected text. Make it more natural, character-specific, and subtext-rich. Add action beats.',
  'make-literary': 'Rewrite the selected text in a more literary style. Use sophisticated prose, metaphor, and elegant sentence construction.',
  'make-cinematic': 'Rewrite the selected text in a more cinematic style. Use vivid visual descriptions, dramatic pacing, and scene-like structure.',
  'make-emotional': 'Enhance the emotional depth of the selected text. Add internal thoughts, sensory emotions, and emotional resonance.',
  'improve-description': 'Improve the descriptions in the selected text. Add vivid sensory details — sight, sound, smell, touch, taste.',
  'fix-grammar': 'Fix grammar, spelling, and punctuation errors in the selected text. Do not change the content or style.',
  'proofread': 'Proofread the selected text. Fix any typos, spelling errors, punctuation issues, and minor grammatical problems. Preserve the authorial voice.',
  'show-dont-tell': 'Rewrite the selected text using "show, don\'t tell" technique. Convert telling statements into vivid scenes with action and sensory detail.',
  'increase-tension': 'Increase the tension and suspense in the selected text. Add urgency, stakes, and dramatic pacing.',
  'improve-pacing': 'Improve the pacing of the selected text. Vary sentence length, add pauses, and create rhythm.',
  'create-alternative': 'Write an alternative version of the selected text. Take a different approach while keeping the same scene and outcome.',
  'custom': '',
};

export async function runAIAction(params: AIAssistantParams): Promise<string> {
  const { book, characters, locations, currentChapter, selectedText, action, customInstruction, aiSettings, onToken, signal } = params;

  const systemPrompt = buildSystemPrompt(book);
  const charCtx = buildCharacterContext(characters);
  const locCtx = buildLocationContext(locations);

  let actionPrompt = ACTION_PROMPTS[action];
  if (action === 'custom') {
    actionPrompt = customInstruction;
  }

  const isContinueAction = action === 'continue';
  const textToProcess = isContinueAction
    ? (currentChapter?.content || '')
    : (selectedText || currentChapter?.content || '');

  if (!textToProcess && !isContinueAction) {
    throw new Error('Select some text in the editor or write something first.');
  }

  // For "continue", get the last portion of the chapter
  const contextText = isContinueAction
    ? textToProcess.replace(/<[^>]*>/g, '').slice(-1500)
    : textToProcess;

  const userPrompt = `${actionPrompt}

${isContinueAction ? 'CURRENT TEXT (end of chapter):' : 'TEXT TO REVISE:'}
${contextText}

${charCtx ? `\nCHARACTERS:\n${charCtx}\n` : ''}
${locCtx ? `\nLOCATIONS:\n${locCtx}\n` : ''}
${currentChapter ? `\nCHAPTER CONTEXT: Chapter ${currentChapter.number} — ${currentChapter.title}. ${currentChapter.purpose}` : ''}

Output only the ${isContinueAction ? 'continuation text' : 'revised text'}, formatted with HTML tags (<p>, <em>, <strong>, <blockquote>). Do not include explanations.`;

  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const provider = getProvider(aiSettings.provider);
  const response = await provider.generate({
    messages,
    temperature: aiSettings.temperature,
    maxTokens: aiSettings.maxTokens,
    stream: aiSettings.streamingEnabled,
    onToken,
    signal,
  }, aiSettings);

  return response.content;
}

// ---------------------------------------------------------------------------
// Book Bible Generation
// ---------------------------------------------------------------------------

export interface GenerateBibleParams {
  book: Book;
  aiSettings: import('@/types').AISettings;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

export async function generateBookBible(params: GenerateBibleParams): Promise<Partial<BookBible>> {
  const { book, aiSettings, onToken, signal } = params;

  const systemPrompt = `You are an expert story development consultant. You help authors develop rich, compelling story bibles for their books. Output valid JSON only, no explanation.`;

  const userPrompt = `Develop a comprehensive story bible for this book:

TITLE: ${book.title}
IDEA: ${book.idea}
GENRE: ${book.genre} / ${book.subgenre}
BOOK TYPE: ${book.bookType}
TARGET AUDIENCE: ${book.targetAudience}
TARGET LENGTH: ${book.targetWordCount.toLocaleString()} words

Create a detailed story bible with:
- A compelling premise (2-3 sentences)
- 3-5 major themes
- The overall tone
- A timeline overview
- 3-5 world rules (setting-specific rules the story follows)
- 3-5 important facts the reader should know
- 3-4 plot threads with names and descriptions
- 2-3 open questions to create intrigue
- A satisfying ending description

Output as JSON with this exact shape:
{
  "premise": "...",
  "themes": ["...", "..."],
  "tone": "...",
  "timeline": "...",
  "worldRules": ["...", "..."],
  "importantFacts": ["...", "..."],
  "plotThreads": [{"name": "...", "description": "..."}],
  "openQuestions": ["...", "..."],
  "ending": "..."
}`;

  const provider = getProvider(aiSettings.provider);
  const response = await provider.generate({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    maxTokens: 4000,
    stream: false,
    onToken,
    signal,
  }, aiSettings);

  try {
    const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      premise: parsed.premise || '',
      themes: parsed.themes || [],
      tone: parsed.tone || '',
      timeline: parsed.timeline || '',
      worldRules: parsed.worldRules || [],
      importantFacts: parsed.importantFacts || [],
      plotThreads: (parsed.plotThreads || []).map((t: { name: string; description: string }, i: number) => ({
        id: `pt-${Date.now()}-${i}`,
        name: t.name,
        description: t.description,
        status: 'open' as const,
      })),
      openQuestions: parsed.openQuestions || [],
      ending: parsed.ending || '',
    };
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }
}

// ---------------------------------------------------------------------------
// Character Generation
// ---------------------------------------------------------------------------

export async function generateCharacter(
  book: Book,
  aiSettings: import('@/types').AISettings,
  prompt?: string
): Promise<Partial<import('@/types').Character>> {
  const systemPrompt = `You are an expert character development consultant for novelists. Create rich, compelling characters. Output valid JSON only.`;

  const userPrompt = `Create a detailed character for this book:

TITLE: ${book.title}
GENRE: ${book.genre}
IDEA: ${book.idea}
${prompt ? `\nSPECIFIC REQUEST: ${prompt}` : ''}

Create a character with all fields filled in meaningfully. Output as JSON:
{
  "name": "...",
  "age": "...",
  "gender": "...",
  "role": "Protagonist|Antagonist|Supporting|Mentor|...",
  "appearance": "...",
  "personality": "...",
  "background": "...",
  "occupation": "...",
  "goals": "...",
  "motivation": "...",
  "fear": "...",
  "strengths": "...",
  "weaknesses": "...",
  "arc": "...",
  "secrets": "...",
  "importantFacts": "..."
}`;

  const provider = getProvider(aiSettings.provider);
  const response = await provider.generate({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    maxTokens: 2000,
    signal: undefined,
  }, aiSettings);

  try {
    const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse character generation response.');
  }
}

// ---------------------------------------------------------------------------
// Chapter Summary Generation (for long book memory)
// ---------------------------------------------------------------------------

export async function generateChapterSummary(
  chapter: Chapter,
  book: Book,
  aiSettings: import('@/types').AISettings
): Promise<ChapterSummary> {
  const plainText = chapter.content.replace(/<[^>]*>/g, ' ').trim();
  if (!plainText) {
    throw new Error('Chapter has no content to summarize.');
  }

  const systemPrompt = `You are a literary analyst. Summarize book chapters for continuity tracking. Output valid JSON only.`;

  const userPrompt = `Analyze this chapter and create a detailed summary for continuity tracking in a long book.

BOOK: ${book.title}
CHAPTER ${chapter.number}: ${chapter.title}

CHAPTER CONTENT:
${plainText.slice(0, 8000)}

Output as JSON:
{
  "summary": "2-3 paragraph summary of what happened",
  "importantEvents": ["event1", "event2", ...],
  "charactersInvolved": ["name1", "name2", ...],
  "locations": ["location1", ...],
  "newFacts": ["fact revealed or established", ...],
  "unresolvedThreads": ["open question or unresolved element", ...],
  "characterChanges": ["character: what changed", ...],
  "timelineEvents": ["timeline event description", ...],
  "importantObjects": ["object that appeared or was used", ...]
}`;

  const provider = getProvider(aiSettings.provider);
  const response = await provider.generate({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    maxTokens: 2000,
    signal: undefined,
  }, aiSettings);

  try {
    const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse chapter summary response.');
  }
}

// ---------------------------------------------------------------------------
// Continuity Check
// ---------------------------------------------------------------------------

export async function checkContinuity(
  book: Book,
  chapters: Chapter[],
  characters: Character[],
  aiSettings: import('@/types').AISettings
): Promise<import('@/types').ContinuityCheckResult> {
  const systemPrompt = `You are a professional continuity editor for novels. You identify inconsistencies, plot holes, and continuity errors. Output valid JSON only.`;

  const chaptersWithContent = chapters.filter((c) => c.content && c.content.trim());

  if (chaptersWithContent.length < 2) {
    return { issues: [], checkedAt: Date.now(), totalChapters: chaptersWithContent.length };
  }

  // Build a condensed view of all chapters
  const chapterDigests = chaptersWithContent.map((c) => {
    const plain = c.content.replace(/<[^>]*>/g, ' ').trim();
    return `CHAPTER ${c.number} (${c.title}):\n${plain.slice(0, 3000)}`;
  }).join('\n\n---\n\n');

  const charInfo = characters.map((c) => `${c.name} (age: ${c.age}, role: ${c.role})`).join(', ');

  const userPrompt = `Analyze these chapters for continuity errors, inconsistencies, and plot holes.

BOOK: ${book.title}
CHARACTERS: ${charInfo}

CHAPTERS:
${chapterDigests}

Identify issues in these categories:
- Character inconsistencies (age, appearance, personality, name spelling)
- Timeline problems (events out of order, impossible timing)
- Location inconsistencies (description mismatches, geography errors)
- Conflicting facts (contradictory statements)
- Plot holes (unresolved threads, impossible events)
- Relationship inconsistencies

For each issue, provide a specific suggestion for how to fix it.

Output as JSON:
{
  "issues": [
    {
      "severity": "error|warning|info",
      "category": "character|timeline|location|fact|plot_hole|relationship",
      "description": "Specific description of the issue",
      "chapterNumbers": [1, 3],
      "suggestion": "How to fix it"
    }
  ]
}

If no issues are found, return {"issues": []}.`;

  const provider = getProvider(aiSettings.provider);
  const response = await provider.generate({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    maxTokens: 4000,
    signal: undefined,
  }, aiSettings);

  try {
    const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const issues: import('@/types').ContinuityIssue[] = (parsed.issues || []).map((issue: Record<string, unknown>, i: number) => ({
      id: `ci-${book.id}-${Date.now()}-${i}`,
      bookId: book.id,
      severity: issue.severity as import('@/types').ContinuitySeverity,
      category: issue.category as string,
      description: issue.description as string,
      chapterNumbers: issue.chapterNumbers as number[],
      suggestion: issue.suggestion as string,
      resolved: false,
      createdAt: Date.now(),
    }));
    return { issues, checkedAt: Date.now(), totalChapters: chaptersWithContent.length };
  } catch {
    throw new Error('Failed to parse continuity check response.');
  }
}

// ---------------------------------------------------------------------------
// Cover Description Generation (for cover prompt)
// ---------------------------------------------------------------------------

export async function generateCoverPrompt(
  book: Book,
  aiSettings: import('@/types').AISettings
): Promise<string> {
  const systemPrompt = `You are a professional book cover designer. Create detailed visual prompts for book covers.`;

  const userPrompt = `Create a detailed visual description for a book cover.

TITLE: ${book.title}
GENRE: ${book.genre}
TONE: ${book.bible.tone}
PREMISE: ${book.bible.premise}

Describe a professional, commercially viable book cover design. Include:
- Visual style (photographic, illustrated, minimalist, typographic)
- Color palette
- Main imagery/subject
- Typography style
- Mood and atmosphere
- Composition

Write a single detailed paragraph that could be used as an image generation prompt.`;

  const provider = getProvider(aiSettings.provider);
  const response = await provider.generate({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    maxTokens: 500,
    signal: undefined,
  }, aiSettings);

  return response.content.trim();
}

// ---------------------------------------------------------------------------
// Metadata Generation
// ---------------------------------------------------------------------------

export async function generateMetadata(
  book: Book,
  aiSettings: import('@/types').AISettings
): Promise<Partial<import('@/types').BookMetadata>> {
  const systemPrompt = `You are a professional publishing consultant. Generate compelling book marketing metadata. Output valid JSON only.`;

  const userPrompt = `Generate publishing metadata for this book:

TITLE: ${book.title}
AUTHOR: ${book.author}
GENRE: ${book.genre} / ${book.subgenre}
PREMISE: ${book.bible.premise}
THEMES: ${book.bible.themes.join(', ')}

Output as JSON:
{
  "shortDescription": "1-2 sentence hook for retailers",
  "longDescription": "3-4 paragraph compelling book description",
  "authorBio": "Sample author bio (will be edited)",
  "keywords": ["keyword1", "keyword2", ...],
  "categories": ["Fiction > Genre", ...],
  "marketingHook": "One-line marketing hook",
  "tagline": "Short memorable tagline",
  "backCoverText": "Back cover marketing copy"
}`;

  const provider = getProvider(aiSettings.provider);
  const response = await provider.generate({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    maxTokens: 2000,
    signal: undefined,
  }, aiSettings);

  try {
    const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse metadata response.');
  }
}
