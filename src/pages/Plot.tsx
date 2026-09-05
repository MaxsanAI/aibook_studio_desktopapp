import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button, EmptyState, ConfirmDialog } from '@/components/ui';
import { createPlotPoint } from '@/utils/factories';
import { Plus, Trash2, Edit3, GitBranch, ChevronDown, ChevronRight } from 'lucide-react';
import type { PlotPoint, PlotType } from '@/types';

export function Plot({ toastSuccess }: { toastSuccess: (m: string) => void; toastError: (m: string) => void }) {
  const { currentBook, plotPoints, savePlotPoint, deletePlotPoint } = useApp();
  const [editing, setEditing] = useState<PlotPoint | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PlotPoint | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (!currentBook) return null;

  const handleAdd = (type: PlotType) => {
    const pp = createPlotPoint(currentBook.id, type);
    savePlotPoint(pp);
    setEditing(pp);
  };

  const toggle = (id: string) => {
    setExpanded((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const groups: { type: PlotType; label: string }[] = [
    { type: 'main', label: 'Main Plot' },
    { type: 'subplot', label: 'Subplots' },
    { type: 'thread', label: 'Plot Threads' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">Plot Manager</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">Organize your main plot, subplots, and plot threads.</p>
        </div>

        {plotPoints.length === 0 && (
          <EmptyState icon={<GitBranch size={48} />} title="No plot points yet" description="Start building your plot structure." action={<Button variant="primary" icon={<Plus size={18} />} onClick={() => handleAdd('main')}>Add Main Plot Point</Button>} />
        )}

        <div className="space-y-6">
          {groups.map((g) => {
            const items = plotPoints.filter((p) => p.type === g.type);
            if (items.length === 0 && g.type !== 'main') return null;
            return (
              <div key={g.type}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-medium text-surface-800 dark:text-surface-100">{g.label}</h2>
                  <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => handleAdd(g.type)}>Add</Button>
                </div>
                <div className="space-y-2">
                  {items.map((pp) => (
                    <div key={pp.id} className="card p-4">
                      <div className="flex items-start gap-2">
                        <button onClick={() => toggle(pp.id)} className="mt-0.5 text-surface-400">
                          {expanded.has(pp.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-surface-800 dark:text-surface-100">{pp.title}</h3>
                            <span className={`badge-neutral text-xs`}>{pp.status}</span>
                          </div>
                          {expanded.has(pp.id) && (
                            <div className="mt-2 space-y-2 text-sm text-surface-600 dark:text-surface-400">
                              {pp.description && <p>{pp.description}</p>}
                              {pp.conflict && <p><strong>Conflict:</strong> {pp.conflict}</p>}
                              {pp.resolution && <p><strong>Resolution:</strong> {pp.resolution}</p>}
                              {pp.involvedCharacters.length > 0 && <p><strong>Characters:</strong> {pp.involvedCharacters.join(', ')}</p>}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditing(pp)} className="rounded p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"><Edit3 size={14} /></button>
                          <button onClick={() => setConfirmDelete(pp)} className="rounded p-1.5 text-error-400 hover:bg-error-500/5"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && <PlotEditor pp={editing} onClose={() => setEditing(null)} onSave={(p) => { savePlotPoint(p); setEditing(null); toastSuccess('Plot point saved'); }} />}
      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => { if (confirmDelete) { deletePlotPoint(confirmDelete.id); toastSuccess('Deleted'); } }} title="Delete Plot Point" message={`Delete "${confirmDelete?.title}"?`} confirmLabel="Delete" danger />
    </div>
  );
}

function PlotEditor({ pp, onClose, onSave }: { pp: PlotPoint; onClose: () => void; onSave: (p: PlotPoint) => void }) {
  const [p, setP] = useState(pp);
  const update = (partial: Partial<PlotPoint>) => setP({ ...p, ...partial });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-surface-900 shadow-soft-lg p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Edit Plot Point</h2>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={() => onSave(p)}>Save</Button>
          </div>
        </div>
        <div><label className="input-label">Title</label><input className="input" value={p.title} onChange={(e) => update({ title: e.target.value })} /></div>
        <div><label className="input-label">Type</label><select className="select" value={p.type} onChange={(e) => update({ type: e.target.value as PlotType })}><option value="main">Main Plot</option><option value="subplot">Subplot</option><option value="thread">Plot Thread</option></select></div>
        <div><label className="input-label">Status</label><select className="select" value={p.status} onChange={(e) => update({ status: e.target.value as PlotPoint['status'] })}><option value="planned">Planned</option><option value="active">Active</option><option value="resolved">Resolved</option></select></div>
        <div><label className="input-label">Description</label><textarea className="textarea" value={p.description} onChange={(e) => update({ description: e.target.value })} /></div>
        <div><label className="input-label">Conflict</label><textarea className="textarea" value={p.conflict} onChange={(e) => update({ conflict: e.target.value })} /></div>
        <div><label className="input-label">Resolution</label><textarea className="textarea" value={p.resolution} onChange={(e) => update({ resolution: e.target.value })} /></div>
        <div><label className="input-label">Involved Characters (comma-separated)</label><input className="input" value={p.involvedCharacters.join(', ')} onChange={(e) => update({ involvedCharacters: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} /></div>
      </div>
    </div>
  );
}
