import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Button, ErrorBanner } from '@/components/ui';
import { countWords } from '@/utils/factories';
import { generateChapter, runAIAction, generateChapterSummary } from '@/services/ai/engine';
import { getScenesByChapter } from '@/services/db';
import { nanoid } from 'nanoid';
import {
  Bold, Italic, Underline, List, ListOrdered, Quote, Heading1, Heading2,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo, Search, Replace,
  ChevronLeft, ChevronRight, Sparkles, PenLine, RefreshCw, Loader2,
  Check, X, Brain,
} from 'lucide-react';
import type { AIAction, Scene } from '@/types';

export function Editor({ toastSuccess, toastError }: { toastSuccess: (m: string) => void; toastError: (m: string) => void }) {
  const { currentBook, chapters, currentChapter, setCurrentChapter, saveChapter, saveBook, characters, locations, plotPoints, settings, saveGenerationHistory, updateSettings } = useApp();
  const editorRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiAction, setAiAction] = useState<AIAction | null>(null);
  const [customInstruction, setCustomInstruction] = useState('');
  const [error, setError] = useState('');
  const [chapterScenes, setChapterScenes] = useState<Scene[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load scenes for current chapter
  useEffect(() => {
    if (currentChapter) {
      getScenesByChapter(currentChapter.id).then(setChapterScenes);
    } else {
      setChapterScenes([]);
    }
  }, [currentChapter?.id]);

  // Load content into editor when chapter changes
  useEffect(() => {
    if (editorRef.current && currentChapter) {
      editorRef.current.innerHTML = currentChapter.content || '';
      updateCounts();
    }
  }, [currentChapter?.id]);

  const updateCounts = useCallback(() => {
    const content = editorRef.current?.innerHTML || '';
    setWordCount(countWords(content));
    setCharCount(content.replace(/<[^>]*>/g, '').length);
  }, []);

  const handleInput = useCallback(() => {
    updateCounts();
    // Debounced autosave
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (currentChapter && editorRef.current) {
        saveChapter({ ...currentChapter, content: editorRef.current.innerHTML, status: currentChapter.content ? 'written' : 'draft' });
      }
    }, (settings?.autosaveInterval || 30) * 1000);
  }, [currentChapter, saveChapter, settings, updateCounts]);

  const handleManualSave = useCallback(() => {
    if (currentChapter && editorRef.current) {
      saveChapter({ ...currentChapter, content: editorRef.current.innerHTML, status: 'written' });
      toastSuccess('Saved');
    }
  }, [currentChapter, saveChapter, toastSuccess]);

  // Execute formatting command
  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleManualSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setShowFind(!showFind); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleManualSave, showFind, currentChapter]);

  const getSelectedText = (): string => {
    const sel = window.getSelection();
    return sel ? sel.toString() : '';
  };

  const handleGenerate = async () => {
    if (!currentChapter || !currentBook || !settings?.aiSettings?.apiKey) {
      setError('Set your AI API key in Settings first.');
      return;
    }
    setGenerating(true);
    setError('');
    setAiResult('');
    setStreamingText('');
    setGenProgress('Preparing context...');
    abortRef.current = new AbortController();

    try {
      const result = await generateChapter({
        book: currentBook,
        characters, locations, plotPoints,
        chapters, currentChapter,
        scenes: chapterScenes,
        aiSettings: settings.aiSettings,
        onProgress: (p) => setGenProgress(p.stage),
        onToken: settings.aiSettings.streamingEnabled ? (token) => setStreamingText((prev) => prev + token) : undefined,
        signal: abortRef.current.signal,
      });

      // Insert into editor
      if (editorRef.current) {
        editorRef.current.innerHTML = result;
        handleInput();
      }
      await saveChapter({ ...currentChapter, content: result, status: 'written' });

      // Deduct credits
      const cost = Math.ceil(countWords(result) / 100) + 10;
      updateSettings({ credits: Math.max(0, settings.credits - cost) });

      // Save to history
      saveGenerationHistory({
        id: nanoid(), bookId: currentBook.id, chapterId: currentChapter.id,
        action: 'generate-chapter', prompt: `Generate chapter ${currentChapter.number}`,
        result: result.slice(0, 500), tokensUsed: countWords(result) * 2,
        creditsUsed: cost, status: 'success', createdAt: Date.now(),
      });

      toastSuccess('Chapter generated');
    } catch (err) {
      if ((err as Error).name === 'AbortError') { toastError('Generation cancelled'); }
      else { setError((err as Error).message); toastError('Generation failed'); }
    } finally {
      setGenerating(false);
      setGenProgress('');
      setStreamingText('');
    }
  };

  const handleAIAction = async (action: AIAction) => {
    if (!currentChapter || !currentBook || !settings?.aiSettings?.apiKey) {
      setError('Set your AI API key in Settings first.');
      return;
    }
    const selected = getSelectedText();
    if (action !== 'continue' && !selected) {
      toastError('Select some text in the editor first.');
      return;
    }
    setAiAction(action);
    setGenerating(true);
    setError('');
    setAiResult('');
    setStreamingText('');
    abortRef.current = new AbortController();

    try {
      const result = await runAIAction({
        book: currentBook, characters, locations, chapters,
        currentChapter, selectedText: selected, action,
        customInstruction, aiSettings: settings.aiSettings,
        onToken: settings.aiSettings.streamingEnabled ? (token) => setStreamingText((prev) => prev + token) : undefined,
        signal: abortRef.current.signal,
      });

      setAiResult(result);

      const cost = Math.ceil(countWords(result) / 100) + 5;
      updateSettings({ credits: Math.max(0, settings.credits - cost) });
      saveGenerationHistory({
        id: nanoid(), bookId: currentBook.id, chapterId: currentChapter.id,
        action, prompt: selected || 'continue', result: result.slice(0, 500),
        tokensUsed: countWords(result) * 2, creditsUsed: cost, status: 'success', createdAt: Date.now(),
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') { setError((err as Error).message); }
    } finally {
      setGenerating(false);
      setStreamingText('');
    }
  };

  const handleInsertResult = () => {
    if (!aiResult || !editorRef.current) return;
    if (aiAction === 'continue') {
      editorRef.current.innerHTML += aiResult;
    } else {
      // Replace selection
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && getSelectedText()) {
        document.execCommand('insertHTML', false, aiResult);
      } else {
        editorRef.current.innerHTML = aiResult;
      }
    }
    handleInput();
    setAiResult('');
    setAiAction(null);
    toastSuccess('Result inserted');
  };

  const handleGenerateSummary = async () => {
    if (!currentChapter || !currentBook || !settings?.aiSettings?.apiKey) { toastError('Set AI API key first'); return; }
    try {
      const summary = await generateChapterSummary(currentChapter, currentBook, settings.aiSettings);
      await saveChapter({ ...currentChapter, aiSummary: summary });
      toastSuccess('Chapter summary generated for long-book memory');
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const handleCancel = () => { abortRef.current?.abort(); setGenerating(false); };

  const handleReplaceAll = () => {
    if (!editorRef.current || !findText) return;
    const content = editorRef.current.innerHTML.replace(new RegExp(findText, 'gi'), replaceText);
    editorRef.current.innerHTML = content;
    handleInput();
    toastSuccess('Replaced all');
  };

  const navigateChapter = (dir: -1 | 1) => {
    if (!currentChapter) return;
    const sorted = [...chapters].sort((a, b) => a.number - b.number);
    const idx = sorted.findIndex((c) => c.id === currentChapter.id);
    const next = sorted[idx + dir];
    if (next) { setCurrentChapter(next); if (currentBook) saveBook({ ...currentBook, currentChapterId: next.id }); }
  };

  const editorWidthClass = settings?.editorWidth === 'narrow' ? 'max-w-prose-narrow' : settings?.editorWidth === 'wide' ? 'max-w-prose-wide' : 'max-w-prose-normal';

  const aiActions: { action: AIAction; label: string }[] = [
    { action: 'continue', label: 'Continue Writing' },
    { action: 'rewrite', label: 'Rewrite' },
    { action: 'improve', label: 'Improve' },
    { action: 'expand', label: 'Expand' },
    { action: 'shorten', label: 'Shorten' },
    { action: 'change-tone', label: 'Change Tone' },
    { action: 'improve-dialogue', label: 'Improve Dialogue' },
    { action: 'make-literary', label: 'Make More Literary' },
    { action: 'make-cinematic', label: 'Make More Cinematic' },
    { action: 'make-emotional', label: 'Make More Emotional' },
    { action: 'improve-description', label: 'Improve Description' },
    { action: 'fix-grammar', label: 'Fix Grammar' },
    { action: 'proofread', label: 'Proofread' },
    { action: 'show-dont-tell', label: "Show Don't Tell" },
    { action: 'increase-tension', label: 'Increase Tension' },
    { action: 'improve-pacing', label: 'Improve Pacing' },
    { action: 'create-alternative', label: 'Create Alternative' },
  ];

  if (!currentBook || !currentChapter) {
    return (
      <div className="flex h-full items-center justify-center text-surface-400">
        <div className="text-center">
          <PenLine size={48} className="mx-auto mb-4 text-surface-300 dark:text-surface-700" />
          <p>Select or create a chapter to start writing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Editor area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4 py-2">
          <button onClick={() => exec('bold')} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Bold"><Bold size={16} /></button>
          <button onClick={() => exec('italic')} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Italic"><Italic size={16} /></button>
          <button onClick={() => exec('underline')} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Underline"><Underline size={16} /></button>
          <div className="mx-1 h-5 w-px bg-surface-200 dark:bg-surface-700" />
          <button onClick={() => exec('formatBlock', '<h1>')} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Heading 1"><Heading1 size={16} /></button>
          <button onClick={() => exec('formatBlock', '<h2>')} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Heading 2"><Heading2 size={16} /></button>
          <button onClick={() => exec('formatBlock', '<blockquote>')} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Quote"><Quote size={16} /></button>
          <div className="mx-1 h-5 w-px bg-surface-200 dark:bg-surface-700" />
          <button onClick={() => exec('insertUnorderedList')} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Bullet List"><List size={16} /></button>
          <button onClick={() => exec('insertOrderedList')} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Numbered List"><ListOrdered size={16} /></button>
          <div className="mx-1 h-5 w-px bg-surface-200 dark:bg-surface-700" />
          <button onClick={() => exec('justifyLeft')} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Align Left"><AlignLeft size={16} /></button>
          <button onClick={() => exec('justifyCenter')} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Align Center"><AlignCenter size={16} /></button>
          <button onClick={() => exec('justifyRight')} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Align Right"><AlignRight size={16} /></button>
          <div className="mx-1 h-5 w-px bg-surface-200 dark:bg-surface-700" />
          <button onClick={() => exec('undo')} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Undo"><Undo size={16} /></button>
          <button onClick={() => exec('redo')} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Redo"><Redo size={16} /></button>
          <div className="mx-1 h-5 w-px bg-surface-200 dark:bg-surface-700" />
          <button onClick={() => setShowFind(!showFind)} className="rounded p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800" title="Find & Replace"><Search size={16} /></button>
          <div className="flex-1" />
          <button onClick={() => setAiPanelOpen(!aiPanelOpen)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${aiPanelOpen ? 'bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
            <Sparkles size={16} className="inline mr-1" /> AI Panel
          </button>
        </div>

        {/* Find & Replace */}
        {showFind && (
          <div className="flex items-center gap-2 border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-850 px-4 py-2 animate-slide-down">
            <input className="input max-w-[200px]" placeholder="Find..." value={findText} onChange={(e) => setFindText(e.target.value)} />
            <input className="input max-w-[200px]" placeholder="Replace with..." value={replaceText} onChange={(e) => setReplaceText(e.target.value)} />
            <Button variant="secondary" size="sm" icon={<Replace size={14} />} onClick={handleReplaceAll}>Replace All</Button>
            <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={() => setShowFind(false)} />
          </div>
        )}

        {/* Chapter navigation */}
        <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-850 px-6 py-2">
          <button onClick={() => navigateChapter(-1)} disabled={currentChapter.number <= 1} className="rounded p-1 text-surface-400 hover:text-surface-700 disabled:opacity-30"><ChevronLeft size={18} /></button>
          <span className="text-sm font-medium text-surface-600 dark:text-surface-400">Chapter {currentChapter.number}: {currentChapter.title}</span>
          <button onClick={() => navigateChapter(1)} disabled={currentChapter.number >= chapters.length} className="rounded p-1 text-surface-400 hover:text-surface-700 disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>

        {/* Writing area */}
        <div className="flex-1 overflow-y-auto bg-surface-50 dark:bg-surface-950">
          <div className={`mx-auto ${editorWidthClass} px-8 py-10`}>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onBlur={handleManualSave}
              className="writing-canvas min-h-[60vh] focus:outline-none"
              data-placeholder="Start writing or use the AI panel to generate..."
            />
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4 py-1.5 text-xs text-surface-500">
          <div className="flex items-center gap-4">
            <span>{wordCount.toLocaleString()} words</span>
            <span>{charCount.toLocaleString()} characters</span>
            {currentChapter.targetWordCount > 0 && (
              <span className={wordCount >= currentChapter.targetWordCount ? 'text-success-600' : ''}>
                {Math.round((wordCount / currentChapter.targetWordCount) * 100)}% of target
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={<Brain size={12} />} onClick={handleGenerateSummary}>Generate Summary</Button>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={12} />} onClick={handleManualSave}>Save</Button>
          </div>
        </div>
      </div>

      {/* AI Panel */}
      {aiPanelOpen && (
        <aside className="flex w-72 shrink-0 flex-col border-l border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
          <div className="border-b border-surface-200 dark:border-surface-800 px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-surface-800 dark:text-surface-100"><Sparkles size={16} className="text-accent-500" /> AI Assistant</h3>
            <p className="text-xs text-surface-500 mt-0.5">Select text and apply an action.</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

            {/* Generate chapter */}
            <Button variant="primary" className="w-full" icon={generating ? undefined : <Sparkles size={16} />} loading={generating} onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Full Chapter'}
            </Button>

            {generating && genProgress && (
              <div className="rounded-lg bg-accent-50 dark:bg-accent-900/20 p-3 text-xs text-accent-700 dark:text-accent-300">
                <div className="flex items-center gap-2 mb-1"><Loader2 size={12} className="animate-spin" /> {genProgress}</div>
                {streamingText && <p className="mt-2 max-h-32 overflow-y-auto text-surface-500 text-xs">{streamingText.slice(-200)}...</p>}
                <button onClick={handleCancel} className="mt-2 text-error-500 text-xs font-medium">Cancel</button>
              </div>
            )}

            {aiResult && (
              <div className="rounded-lg border border-accent-200 dark:border-accent-800 p-3 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-accent-600">AI Result</span>
                  <button onClick={() => setAiResult('')} className="text-surface-400"><X size={14} /></button>
                </div>
                <div className="max-h-48 overflow-y-auto text-sm prose-reader mb-3" dangerouslySetInnerHTML={{ __html: aiResult }} />
                <Button variant="primary" size="sm" className="w-full" icon={<Check size={14} />} onClick={handleInsertResult}>Insert Result</Button>
              </div>
            )}

            <div className="pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">AI Actions</p>
              <div className="grid grid-cols-2 gap-1.5">
                {aiActions.map((a) => (
                  <button
                    key={a.action}
                    onClick={() => handleAIAction(a.action)}
                    disabled={generating}
                    className="rounded-lg border border-surface-200 dark:border-surface-800 px-2 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-400 hover:border-accent-300 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors disabled:opacity-50"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Custom Instruction</p>
              <textarea className="textarea text-sm min-h-[60px]" value={customInstruction} onChange={(e) => setCustomInstruction(e.target.value)} placeholder="Write a custom AI instruction..." />
              <Button variant="secondary" size="sm" className="w-full mt-2" disabled={generating || !customInstruction.trim()} onClick={() => handleAIAction('custom')}>Run Custom</Button>
            </div>
          </div>

          {settings && (
            <div className="border-t border-surface-200 dark:border-surface-800 px-4 py-2 text-xs text-surface-400">
              {settings.credits.toLocaleString()} credits remaining
            </div>
          )}
        </aside>
      )}
    </div>
  );
}