import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Button, EmptyState, ConfirmDialog } from '@/components/ui';
import { createChapter, arrayMove, countWords } from '@/utils/factories';
import { chaptersRepo } from '@/services/db';
import { Plus, Trash2, Edit3, GripVertical, Copy, ListTree, ChevronRight } from 'lucide-react';
import type { Chapter as ChapterType } from '@/types';
import type { Page } from '@/App';

export function Outline({ onNavigate, toastSuccess }: { onNavigate: (p: Page) => void; toastSuccess: (m: string) => void; toastError: (m: string) => void }) {
  const { currentBook, chapters, saveChapter, refreshBookData } = useApp();
  const [editing, setEditing] = useState<ChapterType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ChapterType | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  if (!currentBook) return null;

  const handleAdd = async () => {
    const num = chapters.length + 1;
    const ch = createChapter(currentBook.id, num);
    await chaptersRepo.save(ch);
    await refreshBookData();
    setEditing(ch);
  };

  const handleDuplicate = async (ch: ChapterType) => {
    const copy = { ...ch, id: createChapter(currentBook.id, ch.number).id, title: `${ch.title} (Copy)`, createdAt: Date.now(), updatedAt: Date.now() };
    await chaptersRepo.save(copy);
    await refreshBookData();
    toastSuccess('Chapter duplicated');
  };

  const handleReorder = async (from: number, to: number) => {
    const reordered = arrayMove(chapters, from, to);
    // Renumber
    const renumbered = reordered.map((ch, i) => ({ ...ch, number: i + 1 }));
    await Promise.all(renumbered.map((ch) => chaptersRepo.save(ch)));
    await refreshBookData();
  };

  const handleDelete = async (ch: ChapterType) => {
    await chaptersRepo.delete(ch.id);
    // Renumber remaining
    const remaining = chapters.filter((c) => c.id !== ch.id).sort((a, b) => a.number - b.number);
    const renumbered = remaining.map((c, i) => ({ ...c, number: i + 1 }));
    await Promise.all(renumbered.map((c) => chaptersRepo.save(c)));
    await refreshBookData();
    toastSuccess('Chapter deleted');
  };

  const handleDrop = () => {
    if (dragIndex !== null && dragOverIndex.current !== null && dragIndex !== dragOverIndex.current) {
      handleReorder(dragIndex, dragOverIndex.current);
    }
    setDragIndex(null);
    dragOverIndex.current = null;
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">Chapter Outline</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">{chapters.length} chapters · Drag to reorder</p>
          </div>
          <Button variant="secondary" icon={<Plus size={16} />} onClick={handleAdd}>Add Chapter</Button>
        </div>

        {chapters.length === 0 ? (
          <EmptyState icon={<ListTree size={48} />} title="No chapters yet" description="Add chapters to build your outline." action={<Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>Add Chapter</Button>} />
        ) : (
          <div className="space-y-2">
            {chapters.map((ch, i) => (
              <div
                key={ch.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => { e.preventDefault(); dragOverIndex.current = i; }}
                onDragEnd={handleDrop}
                className={`card p-4 transition-all ${dragIndex === i ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical size={16} className="text-surface-300 cursor-grab active:cursor-grabbing" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800 text-xs font-semibold text-surface-600 dark:text-surface-400">{ch.number}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-surface-800 dark:text-surface-100 truncate">{ch.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-surface-400 mt-0.5">
                      <span>{countWords(ch.content).toLocaleString()} words</span>
                      <span className={`badge-neutral ${ch.status === 'written' ? 'text-success-600' : ''}`}>{ch.status}</span>
                      {ch.targetWordCount > 0 && <span>Target: {ch.targetWordCount.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => onNavigate('editor')} className="rounded p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800" title="Write"><ChevronRight size={16} /></button>
                    <button onClick={() => setEditing(ch)} className="rounded p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"><Edit3 size={14} /></button>
                    <button onClick={() => handleDuplicate(ch)} className="rounded p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"><Copy size={14} /></button>
                    <button onClick={() => setConfirmDelete(ch)} className="rounded p-1.5 text-error-400 hover:bg-error-500/5"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && <ChapterEditor ch={editing} onClose={() => setEditing(null)} onSave={async (c) => { await saveChapter(c); setEditing(null); toastSuccess('Chapter saved'); }} />}
      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => { if (confirmDelete) handleDelete(confirmDelete); }} title="Delete Chapter" message={`Delete "${confirmDelete?.title}"? Chapters will be renumbered.`} confirmLabel="Delete" danger />
    </div>
  );
}

function ChapterEditor({ ch, onClose, onSave }: { ch: ChapterType; onClose: () => void; onSave: (c: ChapterType) => void }) {
  const [c, setC] = useState(ch);
  const update = (partial: Partial<ChapterType>) => setC({ ...c, ...partial });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-surface-900 shadow-soft-lg p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Edit Chapter {ch.number}</h2>
          <div className="flex gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => onSave(c)}>Save</Button></div>
        </div>
        <div><label className="input-label">Title</label><input className="input" value={c.title} onChange={(e) => update({ title: e.target.value })} /></div>
        <div><label className="input-label">Purpose</label><textarea className="textarea" value={c.purpose} onChange={(e) => update({ purpose: e.target.value })} placeholder="What is this chapter supposed to accomplish?" /></div>
        <div><label className="input-label">Summary</label><textarea className="textarea" value={c.summaryText} onChange={(e) => update({ summaryText: e.target.value })} /></div>
        <div><label className="input-label">Main Events</label><textarea className="textarea" value={c.mainEvents} onChange={(e) => update({ mainEvents: e.target.value })} /></div>
        <div><label className="input-label">Characters (comma-separated)</label><input className="input" value={c.characters.join(', ')} onChange={(e) => update({ characters: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} /></div>
        <div><label className="input-label">Location</label><input className="input" value={c.location} onChange={(e) => update({ location: e.target.value })} /></div>
        <div><label className="input-label">Conflict</label><input className="input" value={c.conflict} onChange={(e) => update({ conflict: e.target.value })} /></div>
        <div><label className="input-label">Emotional Beat</label><input className="input" value={c.emotionalBeat} onChange={(e) => update({ emotionalBeat: e.target.value })} /></div>
        <div><label className="input-label">Important Details</label><textarea className="textarea" value={c.importantDetails} onChange={(e) => update({ importantDetails: e.target.value })} /></div>
        <div><label className="input-label">Ending Hook</label><textarea className="textarea" value={c.endingHook} onChange={(e) => update({ endingHook: e.target.value })} /></div>
        <div><label className="input-label">Target Word Count</label><input type="number" className="input" value={c.targetWordCount} onChange={(e) => update({ targetWordCount: Number(e.target.value) })} /></div>
        <div><label className="input-label">Status</label><select className="select" value={c.status} onChange={(e) => update({ status: e.target.value as ChapterType['status'] })}><option value="outline">Outline</option><option value="draft">Draft</option><option value="written">Written</option><option value="edited">Edited</option></select></div>
      </div>
    </div>
  );
}
