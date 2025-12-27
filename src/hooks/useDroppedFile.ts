import { useAtom } from 'jotai';
import JSZip from 'jszip';
import type { DropTargetMonitor } from 'react-dnd';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import {
  droppedBackupFileAtom,
  droppedProjectFileAtom,
  unzippedBackupAtom,
} from '~/atoms/droppedProjectFile';
import { projectIdAtom } from '~/atoms/project';
import { store } from '~/lib/store';
import { showToast } from '~/lib/toast';
import useDevice from './useDevice';

export const DROPPED_FILE_ID = '10';

function useDroppedFile() {
  const { device } = useDevice();
  const [, setProjectId] = useAtom(projectIdAtom);
  const [, setDroppedProjectFile] = useAtom(droppedProjectFileAtom);
  const [, setDroppedBackupFile] = useAtom(droppedBackupFileAtom);

  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop: async (_item: unknown, monitor: DropTargetMonitor) => {
        const item = monitor.getItem() as { files?: File[] };
        const file = item?.files?.[0];
        if (!file) {
          return;
        }

        const fileNameLower = file.name.toLowerCase();
        if (!(fileNameLower.endsWith('.tar') || fileNameLower.endsWith('.ppak') || fileNameLower.endsWith('.pak'))) {
          showToast('Unsupported file. Use a .tar or .ppak. or .pak', 'error');
          return;
        }

        if (!device && (fileNameLower.endsWith('.tar') || fileNameLower.endsWith('.ppak'))) {
          showToast(
            'Connect a device to load .tar/.ppak files, or use a .pak backup file',
            'error',
          );
          return;
        }

        if (device && fileNameLower.endsWith('.pak')) {
          showToast('Disconnect the device to use a .pak backup file', 'error');
          return;
        }

        try {
          const buf = await file.arrayBuffer();

          if (fileNameLower.endsWith('.tar') || fileNameLower.endsWith('.ppak')) {
            setDroppedProjectFile({ name: file.name, data: new Uint8Array(buf) });
            setProjectId(DROPPED_FILE_ID);
            showToast(`Added "${file.name}" to projects`, 'info');
          } else if (fileNameLower.endsWith('.pak')) {
            const backupData = new Uint8Array(buf);
            setDroppedBackupFile(backupData);

            const unzipped = await JSZip.loadAsync(backupData);
            store.set(unzippedBackupAtom, unzipped);

            showToast(`Loaded backup file "${file.name}"`, 'info');
          }
        } catch {
          showToast('Failed to read dropped file', 'error');
        }
      },
      collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [device, setDroppedProjectFile, setProjectId],
  );

  return { dropRef, isOver };
}

export default useDroppedFile;
