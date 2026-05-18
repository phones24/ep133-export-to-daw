import { useAtomValue } from 'jotai';
import {
  backupProjectIdsAtom,
  droppedBackupFileAtom,
  droppedProjectFileAtom,
} from '~/atoms/droppedProjectFile';
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
  const backupProjectIds = useAtomValue(backupProjectIdsAtom);

  const base: ProjectOption[] = [];

  if (device) {
    for (let i = 1; i <= 9; i++) {
      base.push({ value: String(i), label: `Project ${i}` });
    }
  } else if (droppedBackupFile) {
    if (backupProjectIds.length > 0) {
      for (const id of backupProjectIds) {
        base.push({ value: String(id), label: `Project ${id}` });
      }
    }
  }

  if (droppedProjectFile) {
    base.push({ value: DROPPED_FILE_ID, label: droppedProjectFile.name });
  }

  return base;
}

export default useProjectsList;
