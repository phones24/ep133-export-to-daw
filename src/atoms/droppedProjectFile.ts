import { atom } from 'jotai';

export type DroppedProjectFile = {
  name: string;
  data: Uint8Array;
};

export const droppedProjectFileAtom = atom<DroppedProjectFile | null>(null);
