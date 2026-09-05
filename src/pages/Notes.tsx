import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button, EmptyState, ConfirmDialog } from '@/components/ui';
import { createNote, formatDate } from '@/utils/factories';
import { Plus, Trash2, Edit3, StickyNote, Pin } from 'lucide-react';
import type { Note as NoteType } from '@/types';

export function Notes({ toastSuccess }: { toastSuccess: (m: string) => void; toastError: (m: string) => void }) {
  const { currentBook, notes, saveNote, deleteNote } = useApp();
  const [editing, setEditing] = useState<NoteType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NoteType | null>(null);

  if (!currentBook) return null;

  const handleAdd = () => {
    const n = createNote(currentBook.id);
    saveNote(n);
    setEditing(n);
  };

  const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);

  return (
    <div className="h-full overflow-y-auto bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">Notes</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">{notes.length} notes</p>
          </div>
          <Button variant="secondary" icon={<Plus size={16} />} onClick={handleAdd}>Add Note</Button>
        </div>

        {notes.length === 0 ? (
          <EmptyState icon={<StickyNote size={48} />} title="No notes yet" description="Jot down ideas, research, or reminders." action={<Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>Add Note</Button>} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sorted.map((n) => (
              <div key={n.id} className={`card-hover p-4 ${n.pinned ? 'border-accent-300 dark:border-accent-700' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-surface-800 dark:text-surface-100">{n.title}</h3>
                  <button onClick={() => saveNote({ ...n, pinned: !n.pinned })} className={`rounded p-1 ${n.pinned ? 'text-accent-500' : 'text-surface-300'}`}><Pin size={14} /></button>
                </div>
                <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-3 whitespace-pre-wrap">{n.content}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-surface-400">{n.category} · {formatDate(n.updatedAt)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(n)} className="rounded p-1 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"><Edit3 size={14} /></button>
                    <button onClick={() => setConfirmDelete(n)} className="rounded p-1 text-error-400 hover:bg-error-500/5"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && <NoteEditor note={editing} onClose={() => setEditing(null)} onSave={(n) => { saveNote(n); setEditing(null); toastSuccess('Note saved'); }} />}
      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => { if (confirmDelete) { deleteNote(confirmDelete.id); toastSuccess('Note deleted'); } }} title="Delete Note" message="Delete this note?" confirmLabel="Delete" danger />
    </div>
  );
}

function NoteEditor({ note, onClose, onSave }: { note: NoteType; onClose: () => void; onSave: (n: NoteType) => void }) {
  const [n, setN] = useState(note);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-surface-900 shadow-soft-lg p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Edit Note</h2>
          <div className="flex gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => onSave(n)}>Save</Button></div>
        </div>
        <div><label className="input-label">Title</label><input className="input" value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} /></div>
        <div><label className="input-label">Category</label><input className="input" value={n.category} onChange={(e) => setN({ ...n, category: e.target.value })} /></div>
        <div><label className="input-label">Content</label><textarea className="textarea min-h-[200px]" value={n.content} onChange={(e) => setN({ ...n, content: e.target.value })} /></div>
      </div>
    </div>
  );
}
