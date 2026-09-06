import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Button, EmptyState, ConfirmDialog, Modal } from '@/components/ui';
import { formatDate } from '@/utils/factories';
import { exportProjectFile, importProjectFile } from '@/services/exports';
import { importManuscript } from '@/services/import';
import { nanoid } from 'nanoid';
import { BookOpen, Plus, FileText, Upload, MoreVertical, Trash2, Copy, Download, Edit3, PenLine, Zap } from 'lucide-react';
import type { Page } from '@/App';
import type { Book } from '@/types';

export function Dashboard({ onNavigate, toastSuccess, toastError }: {
  onNavigate: (p: Page) => void;
  toastSuccess: (msg: string) => void;
  toastError: (msg: string) => void;
}) {
  const { books, openBook, deleteBook, saveBook, loadBooks } = useApp();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Book | null>(null);
  const [renameBook, setRenameBook] = useState<Book | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const projectRef = useRef<HTMLInputElement>(null);



  const handleDuplicate = async (book: Book) => {
    const copy: Book = {
      ...book,
      id: nanoid(),
      title: `${book.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastOpenedAt: Date.now(),
    };
    await saveBook(copy);
    toastSuccess('Book duplicated');
    setMenuOpen(null);
  };

  const handleExportProject = async (book: Book) => {
    try {
      await exportProjectFile(book);
      toastSuccess('Project exported');
    } catch {
      toastError('Failed to export project');
    }
    setMenuOpen(null);
  };

  const handleImportManuscript = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importManuscript(file, 'Unknown Author');
      await loadBooks();
      await openBook(result.book.id);
      toastSuccess(`Imported "${result.book.title}" with ${result.chapters.length} chapters`);
      onNavigate('book-overview');
    } catch (err) {
      toastError('Failed to import: ' + (err as Error).message);
    }
    if (importRef.current) importRef.current.value = '';
  };

  const handleImportProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const bookId = await importProjectFile(file);
      await loadBooks();
      await openBook(bookId);
      toastSuccess('Project restored successfully');
      onNavigate('book-overview');
    } catch (err) {
      toastError('Failed to import project: ' + (err as Error).message);
    }
    if (projectRef.current) projectRef.current.value = '';
  };

  const handleRename = async () => {
    if (renameBook && renameValue.trim()) {
      await saveBook({ ...renameBook, title: renameValue.trim() });
      toastSuccess('Book renamed');
      setRenameBook(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-surface-800 dark:text-surface-100">Welcome back</h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">Continue your writing journey.</p>
        </div>

        {/* Quick actions */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => onNavigate('create-book')}>
            Create New Book
          </Button>
          <Button variant="secondary" icon={<Upload size={18} />} onClick={() => importRef.current?.click()}>
            Import Manuscript
          </Button>
          <Button variant="secondary" icon={<FileText size={18} />} onClick={() => projectRef.current?.click()}>
            Open Project File
          </Button>
          <input ref={importRef} type="file" accept=".txt,.md,.markdown" className="hidden" onChange={handleImportManuscript} />
          <input ref={projectRef} type="file" accept=".bookstudio,.json" className="hidden" onChange={handleImportProject} />
        </div>

        {/* Stats */}
        {books.length > 0 && (
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="card p-5">
              <p className="text-sm text-surface-500 dark:text-surface-400">Total Books</p>
              <p className="mt-1 font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">{books.length}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-surface-500 dark:text-surface-400">Total Words</p>
              <p className="mt-1 font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">
                {'0'}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-surface-500 dark:text-surface-400">Recently Edited</p>
              <p className="mt-1 font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">
                {books.filter((b) => Date.now() - b.updatedAt < 86400000 * 7).length}
              </p>
            </div>
          </div>
        )}

        {/* Bolt invite banner */}
        <div className="mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-5 text-white shadow-soft-lg">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <Zap size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Build apps like this one with Bolt</h3>
                <p className="text-sm text-white/90">AI-powered app builder — create full-stack web apps from a prompt. Try it free.</p>
              </div>
            </div>
            <a
              href="https://bolt.cello.so/SGMjFQLEpDn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-semibold text-accent-600 shadow-sm transition-all hover:bg-surface-50 hover:shadow-md whitespace-nowrap"
            >
              <Zap size={18} />
              Try Bolt Free
            </a>
          </div>
        </div>

        {/* Recent Books */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Recent Books</h2>
          </div>

          {books.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={48} />}
              title="No books yet"
              description="Create your first book to get started on your writing journey."
              action={<Button variant="primary" icon={<Plus size={18} />} onClick={() => onNavigate('create-book')}>Create New Book</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="card-hover group relative cursor-pointer p-5"
                  onClick={() => { openBook(book.id); onNavigate('book-overview'); }}
                >
                  {/* Cover or placeholder */}
                  <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-850 overflow-hidden">
                    {book.coverDataUrl ? (
                      <img src={book.coverDataUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <BookOpen size={32} className="text-surface-300 dark:text-surface-700" />
                    )}
                  </div>

                  <h3 className="font-display text-base font-semibold text-surface-800 dark:text-surface-100 line-clamp-1">{book.title}</h3>
                  <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">{book.genre}{book.subgenre ? ' / ' + book.subgenre : ''}</p>
                  <p className="mt-2 text-xs text-surface-400">Updated {formatDate(book.updatedAt)}</p>

                  {/* Actions menu */}
                  <div className="absolute right-3 top-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setMenuOpen(menuOpen === book.id ? null : book.id)}
                      className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {menuOpen === book.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-soft-lg py-1 animate-slide-up">
                          <button onClick={() => { openBook(book.id); onNavigate('editor'); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800">
                            <PenLine size={14} /> Continue Writing
                          </button>
                          <button onClick={() => { setRenameBook(book); setRenameValue(book.title); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800">
                            <Edit3 size={14} /> Rename
                          </button>
                          <button onClick={() => handleDuplicate(book)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800">
                            <Copy size={14} /> Duplicate
                          </button>
                          <button onClick={() => handleExportProject(book)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800">
                            <Download size={14} /> Export Project
                          </button>
                          <div className="my-1 border-t border-surface-200 dark:border-surface-800" />
                          <button onClick={() => { setConfirmDelete(book); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-500/5">
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) { deleteBook(confirmDelete.id); toastSuccess('Book deleted'); } }}
        title="Delete Book"
        message={`Are you sure you want to delete "${confirmDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />

      <Modal
        open={!!renameBook}
        onClose={() => setRenameBook(null)}
        title="Rename Book"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameBook(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleRename}>Rename</Button>
          </>
        }
      >
        <label className="input-label">Book Title</label>
        <input className="input" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleRename()} />
      </Modal>
    </div>
  );
}
