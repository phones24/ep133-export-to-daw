import { useAtomValue } from 'jotai';
import { droppedProjectFileAtom } from '~/atoms/droppedProjectFile';
import { DROPPED_FILE_ID } from './useDroppedFile';

export type ProjectOption = {
  value: string;
  label: string;
};

function useProjectsList(): ProjectOption[] {
  const droppedProjectFile = useAtomValue(droppedProjectFileAtom);

  const base: ProjectOption[] = Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    return { value: String(n), label: `Project ${n}` };
  });

  if (droppedProjectFile) {
    base.push({ value: DROPPED_FILE_ID, label: droppedProjectFile.name });
  }

  return base;
}

export default useProjectsList;
