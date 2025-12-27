import { atom } from 'jotai';
import type JSZip from 'jszip';

export type DroppedProjectFile = {
  name: string;
  data: Uint8Array;
};

export const droppedProjectFileAtom = atom<DroppedProjectFile | null>(null);
export const droppedBackupFileAtom = atom<Uint8Array | null>(null);
export const unzippedBackupAtom = atom<JSZip | null>(null);
