import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui';
import { countWords, formatDate } from '@/utils/factories';
import { Info, Users, MapPin, GitBranch, ListTree, PenLine, Download, Image, FileText, Shield } from 'lucide-react';
import type { Page } from '@/App';

export function BookOverview({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { currentBook, chapters, characters, locations, plotPoints } = useApp();
  if (!currentBook) return null;

  const totalWords = chapters.reduce((sum, ch) => sum + countWords(ch.content), 0);
  const writtenChapters = chapters.filter((c) => c.content.trim().length > 0).length;
  const progress = currentBook.targetWordCount > 0 ? Math.min(100, Math.round((totalWords / currentBook.targetWordCount) * 100)) : 0;

  const cards = [
    { label: 'Story Bible', desc: 'Premise, themes, world rules', icon: Info, page: 'story-bible' as Page },
    { label: 'Characters', desc: `${characters.length} characters`, icon: Users, page: 'characters' as Page },
    { label: 'Locations', desc: `${locations.length} locations`, icon: MapPin, page: 'locations' as Page },
    { label: 'Plot', desc: `${plotPoints.length} plot points`, icon: GitBranch, page: 'plot' as Page },
    { label: 'Outline', desc: `${chapters.length} chapters`, icon: ListTree, page: 'outline' as Page },
    { label: 'Manuscript', desc: `${totalWords.toLocaleString()} words`, icon: PenLine, page: 'editor' as Page },
    { label: 'Continuity', desc: 'Check for issues', icon: Shield, page: 'continuity' as Page },
    { label: 'Cover', desc: 'Generate a cover', icon: Image, page: 'cover' as Page },
    { label: 'Metadata', desc: 'Description & keywords', icon: FileText, page: 'metadata' as Page },
    { label: 'Export', desc: 'PDF, DOCX, EPUB', icon: Download, page: 'export' as Page },
  ];

  return (
    <div className="h-full overflow-y-auto bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-4xl px-8 py-8">
        <h1 className="font-display text-3xl font-semibold text-surface-800 dark:text-surface-100 mb-1">{currentBook.title}</h1>
        <p className="text-surface-500 dark:text-surface-400 mb-6">{currentBook.author} · {currentBook.genre}{currentBook.subgenre ? ' / ' + currentBook.subgenre : ''}</p>

        {/* Progress */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-surface-800 dark:text-surface-100">Writing Progress</h2>
            <span className="text-sm font-medium text-accent-600 dark:text-accent-400">{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800 mb-4">
            <div className="h-full rounded-full bg-accent-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-display text-xl font-semibold text-surface-800 dark:text-surface-100">{totalWords.toLocaleString()}</p>
              <p className="text-xs text-surface-500">Words Written</p>
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-surface-800 dark:text-surface-100">{writtenChapters}/{chapters.length}</p>
              <p className="text-xs text-surface-500">Chapters Written</p>
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-surface-800 dark:text-surface-100">{currentBook.targetWordCount.toLocaleString()}</p>
              <p className="text-xs text-surface-500">Target Words</p>
            </div>
          </div>
        </div>

        {/* Quick navigation */}
        <h2 className="section-title mb-4">Book Sections</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.label}
                onClick={() => onNavigate(c.page)}
                className="card-hover flex flex-col items-start p-5 text-left"
              >
                <Icon size={22} className="mb-3 text-accent-500" />
                <span className="font-medium text-surface-800 dark:text-surface-100">{c.label}</span>
                <span className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{c.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Continue writing */}
        {writtenChapters > 0 && (
          <div className="mt-6">
            <Button variant="primary" icon={<PenLine size={18} />} onClick={() => onNavigate('editor')}>
              Continue Writing
            </Button>
          </div>
        )}

        <p className="mt-8 text-xs text-surface-400">Created {formatDate(currentBook.createdAt)} · Last updated {formatDate(currentBook.updatedAt)}</p>
      </div>
    </div>
  );
}
