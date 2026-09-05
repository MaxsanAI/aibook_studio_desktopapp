import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------

export function Logo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0">
        <rect width="64" height="64" rx="14" fill="#1c1917" />
        <path d="M18 16h20a6 6 0 0 1 6 6v26a4 4 0 0 0-4-4H18V16z" fill="#e8891c" />
        <path d="M46 16h0a6 6 0 0 1 6 6v22a4 4 0 0 0-4 4h-2V22a6 6 0 0 0-6-6h6z" fill="#d06b12" />
        <rect x="22" y="22" width="16" height="2" rx="1" fill="#1c1917" opacity="0.3" />
        <rect x="22" y="28" width="16" height="2" rx="1" fill="#1c1917" opacity="0.3" />
        <rect x="22" y="34" width="12" height="2" rx="1" fill="#1c1917" opacity="0.3" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-surface-800 dark:text-surface-100">
        AI Book Studio
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Spinner
// ---------------------------------------------------------------------------

export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', loading, icon, children, className = '', disabled, ...rest }: BtnProps) {
  const base = 'btn';
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }[variant];
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  return (
    <button
      className={`${base} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size={size === 'sm' ? 14 : 16} /> : icon}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      {icon && <div className="mb-4 text-surface-300 dark:text-surface-700">{icon}</div>}
      <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-surface-500 dark:text-surface-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error Banner
// ---------------------------------------------------------------------------

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-error-500/30 bg-error-500/5 px-4 py-3 text-sm text-error-600 dark:text-error-500 animate-fade-in">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-error-400 hover:text-error-600">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success Banner
// ---------------------------------------------------------------------------

export function SuccessBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-success-500/30 bg-success-500/5 px-4 py-3 text-sm text-success-600 dark:text-success-500 animate-fade-in">
      <CheckCircle size={18} className="mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-success-400 hover:text-success-600">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function Modal({ open, onClose, title, children, footer, size = 'md' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const widthClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${widthClass} max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-surface-900 shadow-soft-lg animate-slide-up`}>
        <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[calc(90vh-8rem)] overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-surface-200 dark:border-surface-800 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-soft-lg animate-slide-up max-w-sm ${
            t.type === 'success' ? 'bg-success-600 text-white' :
            t.type === 'error' ? 'bg-error-600 text-white' :
            'bg-surface-800 text-white'
          }`}
        >
          <span className="flex-1 text-sm">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag Input
// ---------------------------------------------------------------------------

import { useState } from 'react';

export function TagInput({ tags, onChange, placeholder = 'Add item...' }: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2">
      {tags.map((tag, i) => (
        <span key={i} className="badge-accent">
          {tag}
          <button onClick={() => onChange(tags.filter((_, idx) => idx !== i))} className="ml-1 hover:text-accent-900">
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); addTag(); }
          if (e.key === 'Backspace' && !input && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        placeholder={placeholder}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-surface-800 dark:text-surface-200 outline-none placeholder-surface-400"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm Dialog
// ---------------------------------------------------------------------------

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-surface-600 dark:text-surface-400">{message}</p>
    </Modal>
  );
}
