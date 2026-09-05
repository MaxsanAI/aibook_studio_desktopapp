import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui';
import { exportPDF, exportDOCX, exportEPUB, exportProjectFile, getExportPreset } from '@/services/exports';
import { countWords } from '@/utils/factories';
import { Download, FileText, FileType, BookOpen, Package } from 'lucide-react';
import type { ExportFormat, ExportPreset as Preset } from '@/types';

export function ExportPage({ toastSuccess, toastError }: { toastSuccess: (m: string) => void; toastError: (m: string) => void }) {
  const { currentBook, chapters } = useApp();
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [preset, setPreset] = useState<Preset>(getExportPreset('pdf')[0]);
  const [exporting, setExporting] = useState(false);

  if (!currentBook) return null;

  const writtenChapters = chapters.filter((c) => c.content.trim().length > 0);
  const totalWords = chapters.reduce((sum, ch) => sum + countWords(ch.content), 0);

  const handleExport = async () => {
    if (writtenChapters.length === 0) { toastError('No chapters with content to export.'); return; }
    setExporting(true);
    try {
      if (format === 'pdf') exportPDF(currentBook, writtenChapters, preset);
      else if (format === 'docx') await exportDOCX(currentBook, writtenChapters, preset);
      else if (format === 'epub') await exportEPUB(currentBook, writtenChapters, preset);
      toastSuccess(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      toastError('Export failed: ' + (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportProject = async () => {
    setExporting(true);
    try {
      await exportProjectFile(currentBook);
      toastSuccess('Project file exported');
    } catch (err) {
      toastError('Export failed: ' + (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleFormatChange = (f: ExportFormat) => {
    setFormat(f);
    setPreset(getExportPreset(f)[0]);
  };

  const formats: { id: ExportFormat; label: string; icon: typeof FileText; desc: string }[] = [
    { id: 'pdf', label: 'PDF', icon: FileText, desc: 'Print-ready document' },
    { id: 'docx', label: 'DOCX', icon: FileType, desc: 'Microsoft Word format' },
    { id: 'epub', label: 'EPUB', icon: BookOpen, desc: 'E-book reader format' },
  ];

  const updatePreset = (partial: Partial<Preset>) => setPreset({ ...preset, ...partial });

  return (
    <div className="h-full overflow-y-auto bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">Export Your Book</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">{writtenChapters.length} chapters ready · {totalWords.toLocaleString()} words</p>
        </div>

        {/* Format selection */}
        <h3 className="section-title mb-3">Choose Format</h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {formats.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => handleFormatChange(f.id)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-5 transition-all ${
                  format === f.id ? 'border-accent-400 bg-accent-50 dark:bg-accent-900/30' : 'border-surface-200 dark:border-surface-800 hover:border-surface-300'
                }`}
              >
                <Icon size={24} className={format === f.id ? 'text-accent-500' : 'text-surface-400'} />
                <span className="font-medium text-surface-800 dark:text-surface-100">{f.label}</span>
                <span className="text-xs text-surface-500">{f.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Format options */}
        <div className="card p-5 mb-6">
          <h3 className="mb-4 font-medium text-surface-800 dark:text-surface-100">Page Settings</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label className="input-label">Page Size</label>
              <select className="select" value={preset.pageSize} onChange={(e) => updatePreset({ pageSize: e.target.value })}>
                {['Letter', 'A4', 'A5', '6x9', '5x8', 'Custom'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Font Size (pt)</label>
              <input type="number" className="input" value={preset.fontSize} onChange={(e) => updatePreset({ fontSize: Number(e.target.value) })} />
            </div>
            <div>
              <label className="input-label">Line Height</label>
              <input type="number" step="0.1" className="input" value={preset.lineHeight} onChange={(e) => updatePreset({ lineHeight: Number(e.target.value) })} />
            </div>
            <div>
              <label className="input-label">Margin Top (in)</label>
              <input type="number" step="0.1" className="input" value={preset.marginTop} onChange={(e) => updatePreset({ marginTop: Number(e.target.value) })} />
            </div>
            <div>
              <label className="input-label">Margin Bottom (in)</label>
              <input type="number" step="0.1" className="input" value={preset.marginBottom} onChange={(e) => updatePreset({ marginBottom: Number(e.target.value) })} />
            </div>
            <div>
              <label className="input-label">Margin Left (in)</label>
              <input type="number" step="0.1" className="input" value={preset.marginLeft} onChange={(e) => updatePreset({ marginLeft: Number(e.target.value) })} />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded accent-accent-500" checked={preset.includeTitlePage} onChange={(e) => updatePreset({ includeTitlePage: e.target.checked })} />
              <span className="text-sm">Include title page</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded accent-accent-500" checked={preset.includeCopyright} onChange={(e) => updatePreset({ includeCopyright: e.target.checked })} />
              <span className="text-sm">Include copyright page</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded accent-accent-500" checked={preset.includeTOC} onChange={(e) => updatePreset({ includeTOC: e.target.checked })} />
              <span className="text-sm">Include table of contents</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded accent-accent-500" checked={preset.includePageNumbers} onChange={(e) => updatePreset({ includePageNumbers: e.target.checked })} />
              <span className="text-sm">Include page numbers</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded accent-accent-500" checked={preset.includeCover} onChange={(e) => updatePreset({ includeCover: e.target.checked })} />
              <span className="text-sm">Include cover image</span>
            </label>
          </div>
        </div>

        {/* Export actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="lg" icon={exporting ? undefined : <Download size={18} />} loading={exporting} onClick={handleExport}>
            Export as {format.toUpperCase()}
          </Button>
          <Button variant="secondary" size="lg" icon={<Package size={18} />} onClick={handleExportProject} disabled={exporting}>
            Export Project Backup
          </Button>
        </div>

        {writtenChapters.length === 0 && (
          <div className="mt-4 rounded-lg bg-warning-500/10 px-4 py-3 text-sm text-warning-600">
            You have no chapters with content yet. Write some chapters before exporting.
          </div>
        )}
      </div>
    </div>
  );
}
