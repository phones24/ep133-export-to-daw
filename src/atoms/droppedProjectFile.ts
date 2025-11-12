import { atom } from 'jotai';

export type DroppedProjectFile = {
  name: string;
  data: Uint8Array;
};

export const droppedProjectFileAtom = atom<DroppedProjectFile | null>(null);
export const droppedBackupFileAtom = atom<Uint8Array | null>(null);
