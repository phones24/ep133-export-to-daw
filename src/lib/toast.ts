import { type ToastSeverity, toastsAtom } from '../atoms/toast';
import { store } from './store';

export function showToast(message: string, severity: ToastSeverity = 'info') {
  const existingToasts = store.get(toastsAtom);

  const newToast = {
    message,
    severity,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
  };

  store.set(toastsAtom, [...existingToasts, newToast]);
}
