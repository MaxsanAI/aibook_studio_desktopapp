import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button, ErrorBanner } from '@/components/ui';
import { Key, Check, Zap, Crown } from 'lucide-react';

export function License({ toastSuccess, toastError }: { toastSuccess: (m: string) => void; toastError: (m: string) => void }) {
  const { settings, updateSettings } = useApp();
  const [key, setKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');

  if (!settings) return null;

  const handleActivate = async () => {
    if (!key.trim()) { setError('Enter a license key.'); return; }
    setActivating(true);
    setError('');
    try {
      // Simulate license activation (offline validation)
      const isValid = key.trim().startsWith('ABS-') && key.trim().length >= 20;
      if (!isValid) {
        throw new Error('Invalid license key format.');
      }
      updateSettings({
        licenseKey: key.trim(),
        licenseStatus: 'active',
        licenseActivatedAt: Date.now(),
      });
      toastSuccess('License activated! All features unlocked.');
      setKey('');
    } catch (err) {
      setError((err as Error).message);
      toastError('Activation failed');
    } finally {
      setActivating(false);
    }
  };

  const handleDeactivate = () => {
    updateSettings({
      licenseKey: '',
      licenseStatus: 'unlicensed',
      licenseActivatedAt: null,
    });
    toastSuccess('License deactivated');
  };

  const isActive = settings.licenseStatus === 'active';

  return (
    <div className="h-full overflow-y-auto bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-lg px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-surface-800 dark:text-surface-100">License</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">Activate your license to unlock all features.</p>
        </div>

        {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

        {/* Status card */}
        <div className={`card p-6 mb-6 ${isActive ? 'border-success-300 dark:border-success-700' : ''}`}>
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isActive ? 'bg-success-500/10' : 'bg-surface-100 dark:bg-surface-800'}`}>
              {isActive ? <Check size={24} className="text-success-500" /> : <Key size={24} className="text-surface-400" />}
            </div>
            <div>
              <h3 className="font-semibold text-surface-800 dark:text-surface-100">
                {isActive ? 'License Active' : 'Unlicensed'}
              </h3>
              <p className="text-sm text-surface-500 mt-0.5">
                {isActive ? 'All features unlocked.' : 'Activate to unlock all features.'}
              </p>
            </div>
          </div>
          {isActive && settings.licenseActivatedAt && (
            <div className="mt-4 space-y-1 text-sm text-surface-500">
              <p><strong>Key:</strong> {settings.licenseKey.slice(0, 8)}...{settings.licenseKey.slice(-4)}</p>
              <p><strong>Activated:</strong> {new Date(settings.licenseActivatedAt).toLocaleDateString()}</p>
              <p><strong>Type:</strong> Lifetime License</p>
            </div>
          )}
        </div>

        {/* Activation */}
        {!isActive ? (
          <div className="card p-6">
            <h3 className="mb-4 font-medium text-surface-800 dark:text-surface-100">Activate License</h3>
            <div className="space-y-4">
              <div>
                <label className="input-label">License Key</label>
                <input className="input" value={key} onChange={(e) => setKey(e.target.value)} placeholder="ABS-XXXX-XXXX-XXXX-XXXX" />
                <p className="mt-1 text-xs text-surface-400">Your key was provided when you purchased AI Book Studio.</p>
              </div>
              <Button variant="primary" className="w-full" icon={<Crown size={16} />} loading={activating} onClick={handleActivate}>
                Activate License
              </Button>
            </div>
          </div>
        ) : (
          <div className="card p-6">
            <h3 className="mb-4 font-medium text-surface-800 dark:text-surface-100">Manage License</h3>
            <Button variant="danger" onClick={handleDeactivate}>Deactivate License</Button>
          </div>
        )}

        {/* AI Usage info */}
        <div className="mt-6 card p-5">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-accent-500" />
            <div>
              <p className="text-sm font-medium text-surface-800 dark:text-surface-100">AI Usage</p>
              <p className="font-display text-xl font-semibold text-accent-600 dark:text-accent-400">Unlimited</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-surface-400">You use your own API key — usage is billed directly by your AI provider (OpenAI, Anthropic, Google, OpenRouter, or Cloudflare AI free tier).</p>
        </div>
      </div>
    </div>
  );
}
