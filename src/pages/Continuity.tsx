import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button, ErrorBanner, EmptyState } from '@/components/ui';
import { checkContinuity } from '@/services/ai/engine';
import { Shield, AlertCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import type { ContinuitySeverity } from '@/types';

export function Continuity({ toastSuccess, toastError }: { toastSuccess: (m: string) => void; toastError: (m: string) => void }) {
  const { currentBook, chapters, characters, continuityIssues, saveContinuityIssues, settings } = useApp();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  if (!currentBook) return null;

  const writtenChapters = chapters.filter((c) => c.content.trim().length > 0);

  const handleCheck = async () => {
    if (!settings?.aiSettings?.apiKey) { setError('Set your AI API key in Settings first.'); return; }
    if (writtenChapters.length < 2) { setError('Need at least 2 written chapters to check continuity.'); return; }
    setChecking(true);
    setError('');
    try {
      const result = await checkContinuity(currentBook, chapters, characters, settings.aiSettings);
      saveContinuityIssues(result.issues);
      toastSuccess(`Found ${result.issues.length} continuity issues`);
    } catch (err) {
      setError((err as Error).message);
      toastError('Continuity check failed');
    } finally {
      setChecking(false);
    }
  };

  const severityIcon = (sev: ContinuitySeverity) => {
    if (sev === 'error') return <AlertCircle size={18} className="text-error-500" />;
    if (sev === 'warning') return <AlertTriangle size={18} className="text-warning-500" />;
    return <Info size={18} className="text-accent-500" />;
  };

  const severityBorder = (sev: ContinuitySeverity) => {
    if (sev === 'error') return 'border-l-error-500';
    if (sev === 'warning') return 'border-l-warning-500';
    return 'border-l-accent-500';
  };

  const counts = {
    error: continuityIssues.filter((i) => i.severity === 'error').length,
    warning: continuityIssues.filter((i) => i.severity === 'warning').length,
    info: continuityIssues.filter((i) => i.severity === 'info').length,
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">Continuity Check</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">AI-powered analysis for plot holes and inconsistencies.</p>
          </div>
          <Button variant="primary" icon={checking ? undefined : <RefreshCw size={16} />} loading={checking} onClick={handleCheck}>
            {checking ? 'Checking...' : 'Run Check'}
          </Button>
        </div>

        {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

        {/* Stats */}
        {continuityIssues.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="card p-4 border-l-4 border-l-error-500">
              <p className="text-sm text-surface-500">Errors</p>
              <p className="font-display text-xl font-semibold text-error-600">{counts.error}</p>
            </div>
            <div className="card p-4 border-l-4 border-l-warning-500">
              <p className="text-sm text-surface-500">Warnings</p>
              <p className="font-display text-xl font-semibold text-warning-600">{counts.warning}</p>
            </div>
            <div className="card p-4 border-l-4 border-l-accent-500">
              <p className="text-sm text-surface-500">Info</p>
              <p className="font-display text-xl font-semibold text-accent-600">{counts.info}</p>
            </div>
          </div>
        )}

        {/* Issues */}
        {continuityIssues.length === 0 ? (
          <EmptyState
            icon={<Shield size={48} />}
            title={writtenChapters.length < 2 ? 'Not enough chapters' : 'No issues found'}
            description={writtenChapters.length < 2 ? 'Write at least 2 chapters before running a continuity check.' : 'Run a check to scan for inconsistencies across your book.'}
            action={writtenChapters.length >= 2 ? <Button variant="primary" icon={<RefreshCw size={18} />} onClick={handleCheck}>Run Continuity Check</Button> : undefined}
          />
        ) : (
          <div className="space-y-3">
            {continuityIssues.map((issue) => (
              <div key={issue.id} className={`card p-4 border-l-4 ${severityBorder(issue.severity)}`}>
                <div className="flex items-start gap-3">
                  {severityIcon(issue.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge-neutral text-xs capitalize">{issue.category}</span>
                      {issue.chapterNumbers.length > 0 && (
                        <span className="text-xs text-surface-400">Chapters: {issue.chapterNumbers.join(', ')}</span>
                      )}
                    </div>
                    <p className="text-sm text-surface-700 dark:text-surface-300">{issue.description}</p>
                    {issue.suggestion && (
                      <div className="mt-2 rounded-lg bg-success-500/5 px-3 py-2 text-sm text-success-700 dark:text-success-400">
                        <span className="font-medium">Suggestion: </span>{issue.suggestion}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
