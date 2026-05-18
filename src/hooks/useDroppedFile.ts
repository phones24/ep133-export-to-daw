import { useAtom } from 'jotai';
import JSZip from 'jszip';
import type { DropTargetMonitor } from 'react-dnd';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import {
  backupProjectIdsAtom,
  backupSkuAtom,
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
  const [, setBackupSku] = useAtom(backupSkuAtom);
  const [, setBackupProjectIds] = useAtom(backupProjectIdsAtom);

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
        if (
          !(
            fileNameLower.endsWith('.tar') ||
            fileNameLower.endsWith('.ppak') ||
            fileNameLower.endsWith('.pak')
          )
        ) {
          showToast('Unsupported file. Use a .tar or .ppak. or .pak', 'error');
          return;
        }

        if (!device && fileNameLower.endsWith('.tar')) {
          showToast(
            'Connect a device to load .tar files, or use a .pak/.ppak backup file',
            'error',
          );
          return;
        }

        if (device && (fileNameLower.endsWith('.pak') || fileNameLower.endsWith('.ppak'))) {
          showToast('Disconnect the device to use a .pak/.ppak backup file', 'error');
          return;
        }

        try {
          const buf = await file.arrayBuffer();

          if (fileNameLower.endsWith('.tar')) {
            setDroppedProjectFile({ name: file.name, data: new Uint8Array(buf) });
            setDroppedBackupFile(null);
            store.set(unzippedBackupAtom, null);
            setBackupSku(null);
            setBackupProjectIds([]);
            setProjectId(DROPPED_FILE_ID);
            showToast(`Added "${file.name}" to projects`, 'info');
          } else if (fileNameLower.endsWith('.pak') || fileNameLower.endsWith('.ppak')) {
            const backupData = new Uint8Array(buf);
            setDroppedBackupFile(backupData);
            setDroppedProjectFile(null);

            const unzipped = await JSZip.loadAsync(backupData);
            store.set(unzippedBackupAtom, unzipped);

            // Read backup metadata
            const metaFile = unzipped.file('meta.json');
            if (metaFile) {
              try {
                const metaText = await metaFile.async('text');
                const meta = JSON.parse(metaText);
                const sku = meta.device_sku || meta.base_sku || null;
                setBackupSku(sku);
              } catch {
                setBackupSku(null);
              }
            } else {
              setBackupSku(null);
            }

            // Scan for available projects
            const projectIds: number[] = [];
            for (const zipFile of Object.values(unzipped.files)) {
              const match = zipFile.name.match(/\/projects\/P(\d{2})\.tar$/);
              if (match) {
                projectIds.push(Number(match[1]));
              }
            }
            setBackupProjectIds(projectIds.sort((a, b) => a - b));

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
    [device, setDroppedProjectFile, setProjectId, setBackupSku, setBackupProjectIds],
  );

  return { dropRef, isOver };
}

export default useDroppedFile;
