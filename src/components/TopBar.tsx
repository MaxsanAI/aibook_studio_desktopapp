import { useState, useEffect } from 'react';
import { Save, Settings, HelpCircle, BookOpen, ChevronDown, ArrowLeft } from 'lucide-react';
import type { Page } from '@/App';
import { useApp } from '@/context/AppContext';
import { Logo, Spinner } from '@/components/ui';
import { HelpModal } from '@/components/HelpModal';

export function TopBar({ page, onNavigate }: {
  page: Page;
  onNavigate: (p: Page) => void;
}) {
  const { currentBook, books, openBook, settings } = useApp();
  const [bookMenuOpen, setBookMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Simulate save status feedback
  useEffect(() => {
    if (currentBook) {
      setSaveStatus('saved');
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentBook?.updatedAt]);

  const pageTitle: Record<Page, string> = {
    'dashboard': 'Dashboard',
    'create-book': 'Create New Book',
    'book-overview': 'Book Overview',
    'story-bible': 'Story Bible',
    'characters': 'Characters',
    'locations': 'Locations & World',
    'plot': 'Plot Manager',
    'outline': 'Chapter Outline',
    'scenes': 'Scene Planner',
    'editor': 'Manuscript Editor',
    'notes': 'Notes',
    'cover': 'Cover Generator',
    'metadata': 'Book Metadata',
    'export': 'Export',
    'settings': 'Settings',
    'continuity': 'Continuity Check',
    'license': 'License',
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4">
      {/* Left: Logo + current page */}
      <div className="flex items-center gap-4">
        {!currentBook && (
          <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 transition-opacity hover:opacity-80" title="Go to Dashboard">
            <Logo size={26} />
          </button>
        )}
        {!currentBook && page !== 'dashboard' && (
          <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
            <ArrowLeft size={16} />
            Dashboard
          </button>
        )}
        {currentBook && (
          <h1 className="text-sm font-semibold text-surface-700 dark:text-surface-300">
            {pageTitle[page]}
          </h1>
        )}
      </div>

      {/* Center: Book selector */}
      {currentBook && (
        <div className="relative">
          <button
            onClick={() => setBookMenuOpen(!bookMenuOpen)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <BookOpen size={15} className="text-accent-500" />
            <span className="max-w-[200px] truncate">{currentBook.title}</span>
            <ChevronDown size={14} className="text-surface-400" />
          </button>
          {bookMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setBookMenuOpen(false)} />
              <div className="absolute left-1/2 top-full z-20 mt-1 w-64 -translate-x-1/2 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-soft-lg py-1.5 animate-slide-up">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-surface-400">Switch Book</p>
                {books.slice(0, 8).map((book) => (
                  <button
                    key={book.id}
                    onClick={() => {
                      openBook(book.id);
                      setBookMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors ${
                      book.id === currentBook.id ? 'text-accent-600 dark:text-accent-400 font-medium' : 'text-surface-700 dark:text-surface-300'
                    }`}
                  >
                    <span className="truncate">{book.title}</span>
                    {book.id === currentBook.id && <span className="text-xs">✓</span>}
                  </button>
                ))}
                <div className="border-t border-surface-200 dark:border-surface-800 mt-1 pt-1">
                  <button
                    onClick={() => { onNavigate('dashboard'); setBookMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
                  >
                    All Books
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Right: Save status, credits, settings, help */}
      <div className="flex items-center gap-3">
        {currentBook && (
          <div className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
            {saveStatus === 'saving' ? (
              <><Spinner size={12} /> Saving...</>
            ) : saveStatus === 'saved' ? (
              <><Save size={13} className="text-success-500" /> Saved</>
            ) : (
              <><Save size={13} /> Auto-save on</>
            )}
          </div>
        )}

        {settings && (
          <div className="flex items-center gap-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 px-2.5 py-1.5 text-xs">
            <span className="text-surface-500 dark:text-surface-400">Credits</span>
            <span className="font-semibold text-surface-700 dark:text-surface-200">
              {settings.credits.toLocaleString()}
            </span>
          </div>
        )}

        <button
          onClick={() => setHelpOpen(true)}
          className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-300 transition-colors"
          title="Help"
        >
          <HelpCircle size={18} />
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`rounded-lg p-2 transition-colors ${
            page === 'settings'
              ? 'bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400'
              : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-300'
          }`}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  );
}
