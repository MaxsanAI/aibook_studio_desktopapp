import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button, ErrorBanner } from '@/components/ui';
import { createBook, createChapter } from '@/utils/factories';
import { generateBookBible } from '@/services/ai/engine';
import { chaptersRepo } from '@/services/db';

import {
  ArrowLeft, ArrowRight, Check, BookOpen, Type, Palette, Ruler, Sparkles,
  ChevronRight,
} from 'lucide-react';
import type { Page } from '@/App';
import type { BookType, BookLength, WritingStyle, BookBible } from '@/types';

const BOOK_TYPES: BookType[] = [
  'Novel', 'Short Story', 'Novella', 'Memoir', 'Biography',
  'Self Help', 'Business', 'Nonfiction', 'Fantasy', 'Romance',
  'Mystery', 'Thriller', 'Horror', 'Science Fiction',
  'Historical Fiction', "Children's Book", 'Other',
];

const BOOK_LENGTHS: { id: BookLength; label: string; words: number }[] = [
  { id: 'Short', label: 'Short', words: 15000 },
  { id: 'Novella', label: 'Novella', words: 30000 },
  { id: 'Standard Novel', label: 'Standard Novel', words: 70000 },
  { id: 'Long Novel', label: 'Long Novel', words: 120000 },
  { id: 'Custom', label: 'Custom', words: 0 },
];

const GENRES = ['Fiction', 'Nonfiction', 'Fantasy', 'Science Fiction', 'Romance', 'Mystery', 'Thriller', 'Horror', 'Historical Fiction', 'Literary Fiction', "Children's", 'Young Adult', 'Memoir', 'Biography', 'Self Help', 'Business', 'Other'];

const STEPS = ['Book Idea', 'Book Type', 'Writing Style', 'Book Length', 'Generate Plan'];

export function CreateBookWizard({ onNavigate, toastSuccess, toastError }: {
  onNavigate: (p: Page) => void;
  toastSuccess: (msg: string) => void;
  toastError: (msg: string) => void;
}) {
  const { saveBook, settings } = useApp();
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [generatedBible, setGeneratedBible] = useState<Partial<BookBible> | null>(null);

  // Form data
  const [title, setTitle] = useState('');
  const [idea, setIdea] = useState('');
  const [genre, setGenre] = useState('Fiction');
  const [subgenre, setSubgenre] = useState('');
  const [language, setLanguage] = useState('English');
  const [targetAudience, setTargetAudience] = useState('General');
  const [bookType, setBookType] = useState<BookType>('Novel');
  const [bookLength, setBookLength] = useState<BookLength>('Standard Novel');
  const [customWords, setCustomWords] = useState(70000);
  const [style, setStyle] = useState<WritingStyle>({
    narrativeStyle: 'Linear', tone: 'Engaging', pointOfView: 'Third Person Limited',
    tense: 'Past', complexity: 'Accessible', pacing: 'Moderate',
    dialogueStyle: 'Natural', descriptionLevel: 'Moderate', paragraphStyle: 'Standard',
    customInstructions: '', professionalMode: true,
  });

  const targetWordCount = bookLength === 'Custom' ? customWords : BOOK_LENGTHS.find((l) => l.id === bookLength)?.words || 70000;

  const canProceed = (): boolean => {
    if (step === 0) return title.trim().length > 0 && idea.trim().length > 0;
    return true;
  };

  const handleGeneratePlan = async () => {
    if (!settings?.aiSettings?.apiKey) {
      setError('Please set your AI API key in Settings before generating a plan.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const tempBook = createBook({
        title, idea, genre, subgenre, language, targetAudience,
        bookType, bookLength, targetWordCount,
      });
      const bible = await generateBookBible({ book: tempBook, aiSettings: settings.aiSettings });
      setGeneratedBible(bible);
      toastSuccess('Story plan generated');
    } catch (err) {
      setError((err as Error).message || 'Failed to generate plan');
      toastError('Generation failed');
    } finally {
      setCreating(false);
    }
  };

  const handleCreate = async () => {
    const book = createBook({
      title, idea, genre, subgenre, language, targetAudience,
      bookType, bookLength, targetWordCount,
      writingStyle: style,
      bible: generatedBible ? {
        premise: generatedBible.premise || '',
        themes: generatedBible.themes || [],
        genre, subgenre,
        tone: generatedBible.tone || style.tone,
        writingStyleSummary: '',
        pointOfView: style.pointOfView,
        timeline: generatedBible.timeline || '',
        worldRules: generatedBible.worldRules || [],
        importantFacts: generatedBible.importantFacts || [],
        plotThreads: generatedBible.plotThreads || [],
        openQuestions: generatedBible.openQuestions || [],
        ending: generatedBible.ending || '',
      } : {
        premise: idea, themes: [], genre, subgenre, tone: style.tone,
        writingStyleSummary: '', pointOfView: style.pointOfView,
        timeline: '', worldRules: [], importantFacts: [],
        plotThreads: [], openQuestions: [], ending: '',
      },
    });
    await saveBook(book);

    // Create initial chapters (3 placeholder chapters)
    for (let i = 1; i <= 3; i++) {
      const ch = createChapter(book.id, i, `Chapter ${i}`);
      await chaptersRepo.save(ch);
    }

    toastSuccess(`"${title}" created`);
    onNavigate('book-overview');
  };

  const stepIcons = [BookOpen, Type, Palette, Ruler, Sparkles];

  return (
    <div className="h-full overflow-y-auto bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-3xl px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">Create New Book</h1>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">From idea to finished book.</p>
          </div>
          <Button variant="ghost" onClick={() => onNavigate('dashboard')}>Cancel</Button>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = stepIcons[i];
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  i === step ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' :
                  i < step ? 'text-success-600' : 'text-surface-400'
                }`}>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                    i === step ? 'bg-accent-500 text-white' :
                    i < step ? 'bg-success-500 text-white' : 'bg-surface-200 dark:bg-surface-800 text-surface-500'
                  }`}>
                    {i < step ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <span className="hidden sm:inline">{s}</span>
                </div>
                {i < STEPS.length - 1 && <ChevronRight size={16} className="mx-1 text-surface-300 dark:text-surface-700" />}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="card p-6 mb-6">
          {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="input-label">Book Title *</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter your book title" autoFocus />
              </div>
              <div>
                <label className="input-label">Book Idea *</label>
                <textarea className="textarea min-h-[100px]" value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Describe your book idea in a few sentences..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Genre</label>
                  <select className="select" value={genre} onChange={(e) => setGenre(e.target.value)}>
                    {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Subgenre</label>
                  <input className="input" value={subgenre} onChange={(e) => setSubgenre(e.target.value)} placeholder="e.g. Epic, Cyberpunk, Cozy" />
                </div>
                <div>
                  <label className="input-label">Language</label>
                  <select className="select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Other'].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Target Audience</label>
                  <select className="select" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
                    {['General', 'Children', 'Young Adult', 'New Adult', 'Adult'].map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="mb-4 text-sm text-surface-500 dark:text-surface-400">Select your book type.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {BOOK_TYPES.map((bt) => (
                  <button
                    key={bt}
                    onClick={() => setBookType(bt)}
                    className={`rounded-lg border p-4 text-center text-sm font-medium transition-all ${
                      bookType === bt
                        ? 'border-accent-400 bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
                        : 'border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-700'
                    }`}
                  >
                    {bt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Narrative Style</label>
                  <select className="select" value={style.narrativeStyle} onChange={(e) => setStyle({ ...style, narrativeStyle: e.target.value as WritingStyle['narrativeStyle'] })}>
                    {['Linear', 'Non-linear', 'Epistolary', 'Stream of Consciousness', 'Frame Story'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Tone</label>
                  <select className="select" value={style.tone} onChange={(e) => setStyle({ ...style, tone: e.target.value })}>
                    {['Engaging', 'Dark', 'Light-hearted', 'Serious', 'Humorous', 'Dramatic', 'Introspective', 'Atmospheric', 'Suspenseful'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Point of View</label>
                  <select className="select" value={style.pointOfView} onChange={(e) => setStyle({ ...style, pointOfView: e.target.value as WritingStyle['pointOfView'] })}>
                    {['First Person', 'Second Person', 'Third Person Limited', 'Third Person Omniscient', 'Mixed'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Tense</label>
                  <select className="select" value={style.tense} onChange={(e) => setStyle({ ...style, tense: e.target.value as WritingStyle['tense'] })}>
                    {['Past', 'Present', 'Mixed'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Complexity</label>
                  <select className="select" value={style.complexity} onChange={(e) => setStyle({ ...style, complexity: e.target.value })}>
                    {['Simple', 'Accessible', 'Moderate', 'Advanced', 'Literary'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Pacing</label>
                  <select className="select" value={style.pacing} onChange={(e) => setStyle({ ...style, pacing: e.target.value as WritingStyle['pacing'] })}>
                    {['Slow-burn', 'Moderate', 'Fast-paced', 'Variable'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Dialogue Style</label>
                  <select className="select" value={style.dialogueStyle} onChange={(e) => setStyle({ ...style, dialogueStyle: e.target.value })}>
                    {['Natural', 'Witty', 'Formal', 'Colloquial', 'Minimal', 'Rich'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Description Level</label>
                  <select className="select" value={style.descriptionLevel} onChange={(e) => setStyle({ ...style, descriptionLevel: e.target.value })}>
                    {['Minimal', 'Moderate', 'Rich', 'Lush'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">Custom Instructions</label>
                <textarea className="textarea" value={style.customInstructions} onChange={(e) => setStyle({ ...style, customInstructions: e.target.value })} placeholder="Any specific writing instructions for the AI..." />
              </div>
              <label className="flex items-center gap-3 rounded-lg bg-accent-50 dark:bg-accent-900/20 p-3 cursor-pointer">
                <input type="checkbox" checked={style.professionalMode} onChange={(e) => setStyle({ ...style, professionalMode: e.target.checked })} className="h-4 w-4 rounded accent-accent-500" />
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Write like a professional published author</span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-4 text-sm text-surface-500 dark:text-surface-400">Choose your book length.</p>
              <div className="space-y-3">
                {BOOK_LENGTHS.map((bl) => (
                  <button
                    key={bl.id}
                    onClick={() => setBookLength(bl.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-4 transition-all ${
                      bookLength === bl.id
                        ? 'border-accent-400 bg-accent-50 dark:bg-accent-900/30'
                        : 'border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700'
                    }`}
                  >
                    <span className="font-medium text-surface-700 dark:text-surface-300">{bl.label}</span>
                    <span className="text-sm text-surface-500">{bl.words > 0 ? `${bl.words.toLocaleString()} words` : 'Custom'}</span>
                  </button>
                ))}
              </div>
              {bookLength === 'Custom' && (
                <div className="mt-4">
                  <label className="input-label">Target Word Count</label>
                  <input type="number" className="input" value={customWords} onChange={(e) => setCustomWords(Number(e.target.value))} min={1000} step={1000} />
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-surface-800 dark:text-surface-100">AI Generate Plan</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">Let AI generate your story premise, themes, plot threads, and more.</p>
                </div>
                {!generatedBible && (
                  <Button variant="primary" icon={creating ? undefined : <Sparkles size={16} />} loading={creating} onClick={handleGeneratePlan}>
                    {creating ? 'Generating...' : 'Generate Plan'}
                  </Button>
                )}
              </div>

              {generatedBible && (
                <div className="space-y-4 animate-fade-in">
                  <div className="rounded-lg bg-success-500/10 px-4 py-3 text-sm text-success-600">Plan generated successfully! Review below.</div>
                  {generatedBible.premise && (
                    <div>
                      <label className="input-label">Premise</label>
                      <p className="text-sm text-surface-600 dark:text-surface-400 rounded-lg bg-surface-100 dark:bg-surface-800 p-3">{generatedBible.premise}</p>
                    </div>
                  )}
                  {generatedBible.themes && generatedBible.themes.length > 0 && (
                    <div>
                      <label className="input-label">Themes</label>
                      <div className="flex flex-wrap gap-2">{generatedBible.themes.map((t) => <span key={t} className="badge-accent">{t}</span>)}</div>
                    </div>
                  )}
                  {generatedBible.tone && (
                    <div>
                      <label className="input-label">Tone</label>
                      <p className="text-sm text-surface-600 dark:text-surface-400">{generatedBible.tone}</p>
                    </div>
                  )}
                  {generatedBible.ending && (
                    <div>
                      <label className="input-label">Planned Ending</label>
                      <p className="text-sm text-surface-600 dark:text-surface-400 rounded-lg bg-surface-100 dark:bg-surface-800 p-3">{generatedBible.ending}</p>
                    </div>
                  )}
                  {generatedBible.plotThreads && generatedBible.plotThreads.length > 0 && (
                    <div>
                      <label className="input-label">Plot Threads</label>
                      <div className="space-y-2">
                        {generatedBible.plotThreads.map((pt) => (
                          <div key={pt.id} className="rounded-lg bg-surface-100 dark:bg-surface-800 p-3">
                            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{pt.name}</p>
                            <p className="text-xs text-surface-500 mt-1">{pt.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button variant="secondary" size="sm" onClick={handleGeneratePlan} loading={creating}>Regenerate</Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => step > 0 ? setStep(step - 1) : onNavigate('dashboard')} disabled={creating}>
            Back
          </Button>
          {step < 4 ? (
            <Button variant="primary" icon={<ArrowRight size={16} />} onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()}>
              Next
            </Button>
          ) : (
            <Button variant="primary" icon={<Check size={16} />} onClick={handleCreate} disabled={creating}>
              Create Book
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
