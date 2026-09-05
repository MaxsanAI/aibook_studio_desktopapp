import {
  LayoutDashboard, Plus, Info, Users, MapPin,
  GitBranch, ListTree, Clapperboard, PenLine, StickyNote,
  Image, FileText, Download, BookMarked, Shield,
} from 'lucide-react';
import type { Page } from '@/App';
import { useApp } from '@/context/AppContext';
import { countWords } from '@/utils/factories';

const NAV_ITEMS: { page: Page; label: string; icon: typeof LayoutDashboard; group?: string }[] = [
  { page: 'book-overview', label: 'Book Overview', icon: BookMarked, group: 'project' },
  { page: 'story-bible', label: 'Story Bible', icon: Info, group: 'project' },
  { page: 'characters', label: 'Characters', icon: Users, group: 'project' },
  { page: 'locations', label: 'Locations & World', icon: MapPin, group: 'project' },
  { page: 'plot', label: 'Plot', icon: GitBranch, group: 'project' },
  { page: 'outline', label: 'Outline', icon: ListTree, group: 'project' },
  { page: 'scenes', label: 'Scene Planner', icon: Clapperboard, group: 'project' },
  { page: 'editor', label: 'Manuscript', icon: PenLine, group: 'writing' },
  { page: 'continuity', label: 'Continuity Check', icon: Shield, group: 'writing' },
  { page: 'notes', label: 'Notes', icon: StickyNote, group: 'writing' },
  { page: 'cover', label: 'Cover', icon: Image, group: 'finish' },
  { page: 'metadata', label: 'Metadata', icon: FileText, group: 'finish' },
  { page: 'export', label: 'Export', icon: Download, group: 'finish' },
];

export function Sidebar({ current, onNavigate }: { current: Page; onNavigate: (p: Page) => void }) {
  const { currentBook, chapters, closeBook } = useApp();

  if (!currentBook) return null;

  const totalWords = chapters.reduce((sum, ch) => sum + countWords(ch.content), 0);
  const writtenChapters = chapters.filter((c) => c.content.trim().length > 0).length;
  const progress = currentBook.targetWordCount > 0
    ? Math.min(100, Math.round((totalWords / currentBook.targetWordCount) * 100))
    : 0;

  const groups = ['project', 'writing', 'finish'];
  const groupLabels: Record<string, string> = {
    project: 'Story Planning',
    writing: 'Writing',
    finish: 'Finishing',
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-surface-200 dark:border-surface-800 bg-surface-100/50 dark:bg-surface-900/50">
      {/* Book info */}
      <div className="border-b border-surface-200 dark:border-surface-800 px-4 py-3">
        <button
          onClick={() => { closeBook(); onNavigate('dashboard'); }}
          className="flex items-center gap-2 text-xs text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
        >
          <LayoutDashboard size={14} />
          Back to Dashboard
        </button>
        <h2 className="mt-2 font-display text-base font-semibold text-surface-800 dark:text-surface-100 line-clamp-2 leading-tight">
          {currentBook.title}
        </h2>
        <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
          {totalWords.toLocaleString()} words · {writtenChapters}/{chapters.length} chapters
        </p>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800">
          <div
            className="h-full rounded-full bg-accent-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-surface-400">{progress}% of {currentBook.targetWordCount.toLocaleString()} words</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {groups.map((group) => (
          <div key={group} className="mb-4">
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-600">
              {groupLabels[group]}
            </p>
            {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  className={`sidebar-item w-full ${current === item.page ? 'sidebar-item-active' : ''}`}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* New Book */}
      <div className="border-t border-surface-200 dark:border-surface-800 p-3">
        <button
          onClick={() => onNavigate('create-book')}
          className="sidebar-item w-full"
        >
          <Plus size={17} />
          Create New Book
        </button>
      </div>
    </aside>
  );
}
