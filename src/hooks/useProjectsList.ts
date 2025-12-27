import { useAtomValue } from 'jotai';
import { droppedBackupFileAtom, droppedProjectFileAtom } from '~/atoms/droppedProjectFile';
import useDevice from './useDevice';
import { DROPPED_FILE_ID } from './useDroppedFile';

export type ProjectOption = {
  value: string;
  label: string;
};

function useProjectsList(): ProjectOption[] {
  const { device } = useDevice();
  const droppedProjectFile = useAtomValue(droppedProjectFileAtom);
  const droppedBackupFile = useAtomValue(droppedBackupFileAtom);

  const base: ProjectOption[] =
    device || droppedBackupFile
      ? Array.from({ length: 9 }, (_, i) => {
          const n = i + 1;
          return { value: String(n), label: `Project ${n}` };
        })
      : [];

  if (droppedProjectFile) {
    base.push({ value: DROPPED_FILE_ID, label: droppedProjectFile.name });
  }

  return base;
}

export default useProjectsList;
