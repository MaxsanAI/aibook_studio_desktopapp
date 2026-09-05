import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button, EmptyState, ConfirmDialog } from '@/components/ui';
import { createLocation } from '@/utils/factories';
import { Plus, Trash2, Edit3, MapPin, Globe } from 'lucide-react';
import type { Location as LocType } from '@/types';

export function Locations({ toastSuccess }: { toastSuccess: (m: string) => void; toastError: (m: string) => void }) {
  const { currentBook, locations, saveLocation, deleteLocation } = useApp();
  const [editing, setEditing] = useState<LocType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<LocType | null>(null);

  if (!currentBook) return null;

  const handleAdd = () => {
    const loc = createLocation(currentBook.id);
    saveLocation(loc);
    setEditing(loc);
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-4xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">Locations & World</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">{locations.length} locations</p>
          </div>
          <Button variant="secondary" icon={<Plus size={16} />} onClick={handleAdd}>Add Location</Button>
        </div>

        {locations.length === 0 ? (
          <EmptyState icon={<MapPin size={48} />} title="No locations yet" description="Add locations and world details to your book." action={<Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>Add Location</Button>} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {locations.map((loc) => (
              <div key={loc.id} className="card-hover p-5">
                <div className="flex items-start gap-3 mb-2">
                  {loc.isWorldEntry ? <Globe size={20} className="text-accent-500 mt-0.5" /> : <MapPin size={20} className="text-accent-500 mt-0.5" />}
                  <div className="flex-1">
                    <h3 className="font-medium text-surface-800 dark:text-surface-100">{loc.name}</h3>
                    {loc.isWorldEntry && <span className="badge-accent text-xs">World Entry</span>}
                  </div>
                </div>
                {loc.description && <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 mb-3">{loc.description}</p>}
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" icon={<Edit3 size={14} />} onClick={() => setEditing(loc)}>Edit</Button>
                  <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setConfirmDelete(loc)} className="text-error-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && <LocationEditor location={editing} onClose={() => setEditing(null)} onSave={(l) => { saveLocation(l); setEditing(null); toastSuccess('Location saved'); }} />}
      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => { if (confirmDelete) { deleteLocation(confirmDelete.id); toastSuccess('Location deleted'); } }} title="Delete Location" message={`Delete "${confirmDelete?.name}"?`} confirmLabel="Delete" danger />
    </div>
  );
}

function LocationEditor({ location, onClose, onSave }: { location: LocType; onClose: () => void; onSave: (l: LocType) => void }) {
  const [l, setL] = useState(location);
  const update = (partial: Partial<LocType>) => setL({ ...l, ...partial });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-surface-900 shadow-soft-lg">
        <div className="sticky top-0 flex items-center justify-between border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-6 py-4 z-10">
          <h2 className="text-lg font-semibold">Edit Location</h2>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={() => onSave(l)}>Save</Button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={l.isWorldEntry} onChange={(e) => update({ isWorldEntry: e.target.checked })} className="h-4 w-4 rounded accent-accent-500" />
            <label className="text-sm font-medium">World Building Entry (fantasy/sci-fi)</label>
          </div>
          <div><label className="input-label">Name</label><input className="input" value={l.name} onChange={(e) => update({ name: e.target.value })} /></div>
          <div><label className="input-label">Description</label><textarea className="textarea" value={l.description} onChange={(e) => update({ description: e.target.value })} /></div>
          <div><label className="input-label">Appearance</label><textarea className="textarea" value={l.appearance} onChange={(e) => update({ appearance: e.target.value })} /></div>
          <div><label className="input-label">Atmosphere</label><input className="input" value={l.atmosphere} onChange={(e) => update({ atmosphere: e.target.value })} /></div>
          <div><label className="input-label">Geography</label><textarea className="textarea" value={l.geography} onChange={(e) => update({ geography: e.target.value })} /></div>
          <div><label className="input-label">Important Objects</label><input className="input" value={l.importantObjects} onChange={(e) => update({ importantObjects: e.target.value })} /></div>
          <div><label className="input-label">History</label><textarea className="textarea" value={l.history} onChange={(e) => update({ history: e.target.value })} /></div>
          <div><label className="input-label">Rules</label><textarea className="textarea" value={l.rules} onChange={(e) => update({ rules: e.target.value })} /></div>
          {l.isWorldEntry && (
            <>
              <div><label className="input-label">Magic System</label><textarea className="textarea" value={l.magicSystem} onChange={(e) => update({ magicSystem: e.target.value })} /></div>
              <div><label className="input-label">Technology</label><textarea className="textarea" value={l.technology} onChange={(e) => update({ technology: e.target.value })} /></div>
              <div><label className="input-label">Cultures</label><textarea className="textarea" value={l.cultures} onChange={(e) => update({ cultures: e.target.value })} /></div>
              <div><label className="input-label">Organizations</label><textarea className="textarea" value={l.organizations} onChange={(e) => update({ organizations: e.target.value })} /></div>
              <div><label className="input-label">Political Systems</label><textarea className="textarea" value={l.politicalSystems} onChange={(e) => update({ politicalSystems: e.target.value })} /></div>
              <div><label className="input-label">Species</label><textarea className="textarea" value={l.species} onChange={(e) => update({ species: e.target.value })} /></div>
              <div><label className="input-label">Languages</label><textarea className="textarea" value={l.languages} onChange={(e) => update({ languages: e.target.value })} /></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
