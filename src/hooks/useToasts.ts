import { useState, useCallback } from 'react';
import type { Toast, ToastType } from '@/components/ui';

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const toastSuccess = useCallback((msg: string) => toast('success', msg), [toast]);
  const toastError = useCallback((msg: string) => toast('error', msg), [toast]);
  const toastInfo = useCallback((msg: string) => toast('info', msg), [toast]);

  return { toasts, dismiss, toastSuccess, toastError, toastInfo };
}
