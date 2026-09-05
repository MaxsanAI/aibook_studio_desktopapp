import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button, EmptyState, ConfirmDialog } from '@/components/ui';
import { createScene } from '@/utils/factories';
import { Plus, Trash2, Edit3, Clapperboard } from 'lucide-react';
import type { Scene } from '@/types';

export function ScenePlanner({ toastSuccess }: { toastSuccess: (m: string) => void; toastError: (m: string) => void }) {
  const { currentBook, chapters, scenes, saveScene, deleteScene } = useApp();
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(chapters[0]?.id || null);
  const [editing, setEditing] = useState<Scene | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Scene | null>(null);

  if (!currentBook) return null;

  const chapterScenes = scenes.filter((s) => s.chapterId === selectedChapterId).sort((a, b) => a.number - b.number);

  const handleAdd = () => {
    if (!selectedChapterId) return;
    const num = chapterScenes.length + 1;
    const sc = createScene(selectedChapterId, currentBook.id, num);
    saveScene(sc);
    setEditing(sc);
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">Scene Planner</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">Plan scenes for each chapter.</p>
        </div>

        {chapters.length === 0 ? (
          <EmptyState icon={<Clapperboard size={48} />} title="No chapters yet" description="Create chapters in the Outline first." />
        ) : (
          <>
            {/* Chapter selector */}
            <div className="mb-4">
              <label className="input-label">Select Chapter</label>
              <select className="select" value={selectedChapterId || ''} onChange={(e) => setSelectedChapterId(e.target.value)}>
                {chapters.map((c) => <option key={c.id} value={c.id}>Chapter {c.number}: {c.title}</option>)}
              </select>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-medium text-surface-800 dark:text-surface-100">{chapterScenes.length} scenes</h2>
              <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={handleAdd}>Add Scene</Button>
            </div>

            {chapterScenes.length === 0 ? (
              <EmptyState title="No scenes yet" description="Add scenes to plan this chapter in detail." action={<Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={handleAdd}>Add Scene</Button>} />
            ) : (
              <div className="space-y-3">
                {chapterScenes.map((sc) => (
                  <div key={sc.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-surface-800 dark:text-surface-100">Scene {sc.number}</h3>
                        {sc.location && <p className="text-xs text-surface-500 mt-1">Location: {sc.location}</p>}
                        {sc.objective && <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{sc.objective}</p>}
                        {sc.emotion && <p className="text-xs text-accent-600 mt-1">Emotion: {sc.emotion}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditing(sc)} className="rounded p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"><Edit3 size={14} /></button>
                        <button onClick={() => setConfirmDelete(sc)} className="rounded p-1.5 text-error-400 hover:bg-error-500/5"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {editing && <SceneEditor scene={editing} onClose={() => setEditing(null)} onSave={(s) => { saveScene(s); setEditing(null); toastSuccess('Scene saved'); }} />}
      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => { if (confirmDelete) { deleteScene(confirmDelete.id); toastSuccess('Scene deleted'); } }} title="Delete Scene" message="Delete this scene?" confirmLabel="Delete" danger />
    </div>
  );
}

function SceneEditor({ scene, onClose, onSave }: { scene: Scene; onClose: () => void; onSave: (s: Scene) => void }) {
  const [s, setS] = useState(scene);
  const update = (partial: Partial<Scene>) => setS({ ...s, ...partial });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-surface-900 shadow-soft-lg p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Edit Scene {scene.number}</h2>
          <div className="flex gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => onSave(s)}>Save</Button></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="input-label">Location</label><input className="input" value={s.location} onChange={(e) => update({ location: e.target.value })} /></div>
          <div><label className="input-label">Time</label><input className="input" value={s.time} onChange={(e) => update({ time: e.target.value })} /></div>
        </div>
        <div><label className="input-label">Characters (comma-separated)</label><input className="input" value={s.characters.join(', ')} onChange={(e) => update({ characters: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} /></div>
        <div><label className="input-label">Objective</label><textarea className="textarea" value={s.objective} onChange={(e) => update({ objective: e.target.value })} /></div>
        <div><label className="input-label">Conflict</label><textarea className="textarea" value={s.conflict} onChange={(e) => update({ conflict: e.target.value })} /></div>
        <div><label className="input-label">Emotion</label><input className="input" value={s.emotion} onChange={(e) => update({ emotion: e.target.value })} /></div>
        <div><label className="input-label">Action</label><textarea className="textarea" value={s.action} onChange={(e) => update({ action: e.target.value })} /></div>
        <div><label className="input-label">Important Info</label><textarea className="textarea" value={s.importantInfo} onChange={(e) => update({ importantInfo: e.target.value })} /></div>
        <div><label className="input-label">Transition</label><input className="input" value={s.transition} onChange={(e) => update({ transition: e.target.value })} /></div>
        <div><label className="input-label">Scene Ending</label><input className="input" value={s.sceneEnding} onChange={(e) => update({ sceneEnding: e.target.value })} /></div>
      </div>
    </div>
  );
}
