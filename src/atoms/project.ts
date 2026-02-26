import { atom } from 'jotai';

export const projectIdAtom = atom<string>('');
export const customSceneNamesByProjectAtom = atom<Record<string, boolean>>({});
