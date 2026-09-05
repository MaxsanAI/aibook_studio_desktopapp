import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button, ErrorBanner } from '@/components/ui';
import { generateCoverPrompt } from '@/services/ai/engine';
import { Sparkles, Image as ImageIcon, Download, Trash2 } from 'lucide-react';

export function Cover({ toastSuccess, toastError }: { toastSuccess: (m: string) => void; toastError: (m: string) => void }) {
  const { currentBook, saveBook, settings } = useApp();
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState(currentBook?.coverPrompt || '');
  const [error, setError] = useState('');

  if (!currentBook) return null;

  const handleGeneratePrompt = async () => {
    if (!settings?.aiSettings?.apiKey) { setError('Set your AI API key in Settings first.'); return; }
    setGenerating(true);
    setError('');
    try {
      const result = await generateCoverPrompt(currentBook, settings.aiSettings);
      setPrompt(result);
      toastSuccess('Cover prompt generated');
    } catch (err) {
      setError((err as Error).message);
      toastError('Failed to generate prompt');
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePrompt = async () => {
    await saveBook({ ...currentBook, coverPrompt: prompt });
    toastSuccess('Cover prompt saved');
  };

  const handleSetCover = async (dataUrl: string) => {
    await saveBook({ ...currentBook, coverDataUrl: dataUrl });
    toastSuccess('Cover set');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { handleSetCover(reader.result as string); };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = async () => {
    await saveBook({ ...currentBook, coverDataUrl: null });
    toastSuccess('Cover removed');
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">Cover Generator</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">Design or upload a cover for your book.</p>
        </div>

        {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

        <div className="grid grid-cols-2 gap-6">
          {/* Cover preview */}
          <div>
            <h3 className="mb-3 font-medium text-surface-800 dark:text-surface-100">Current Cover</h3>
            <div className="aspect-[2/3] rounded-lg overflow-hidden border border-surface-200 dark:border-surface-800 bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              {currentBook.coverDataUrl ? (
                <img src={currentBook.coverDataUrl} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon size={48} className="text-surface-300 dark:text-surface-700" />
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => document.getElementById('cover-upload')?.click()}>Upload</Button>
              <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              {currentBook.coverDataUrl && <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={handleRemoveCover} className="text-error-500">Remove</Button>}
              {currentBook.coverDataUrl && <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={() => { const a = document.createElement('a'); a.href = currentBook.coverDataUrl!; a.download = 'cover.png'; a.click(); }}>Download</Button>}
            </div>
          </div>

          {/* Cover prompt */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-surface-800 dark:text-surface-100">Cover Prompt</h3>
              <Button variant="ghost" size="sm" icon={generating ? undefined : <Sparkles size={14} />} loading={generating} onClick={handleGeneratePrompt}>AI Generate</Button>
            </div>
            <textarea className="textarea min-h-[150px]" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the cover you want..." />
            <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={handleSavePrompt}>Save Prompt</Button>
            <div className="mt-4 rounded-lg bg-surface-100 dark:bg-surface-800 p-4 text-sm text-surface-600 dark:text-surface-400">
              <p className="font-medium text-surface-700 dark:text-surface-300 mb-1">Tip</p>
              <p>Use the AI-generated prompt with an image generation tool (like DALL-E, Midjourney, or Stable Diffusion) to create your cover image, then upload it here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
