import { atom } from 'jotai';

export type ToastSeverity = 'info' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  severity: ToastSeverity;
  timestamp: number;
}

export const toastsAtom = atom<ToastMessage[]>([]);

export const removeToastAtom = atom(null, (get, set, id: string) => {
  set(
    toastsAtom,
    get(toastsAtom).filter((toast) => toast.id !== id),
  );
});
