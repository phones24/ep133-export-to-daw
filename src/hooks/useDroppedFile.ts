import { useAtom } from 'jotai';
import type { DropTargetMonitor } from 'react-dnd';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { droppedBackupFileAtom, droppedProjectFileAtom } from '~/atoms/droppedProjectFile';
import { projectIdAtom } from '~/atoms/project';
import { showToast } from '~/lib/toast';

export const DROPPED_FILE_ID = '10';

function useDroppedFile() {
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

        const lower = file.name.toLowerCase();
        if (!(lower.endsWith('.tar') || lower.endsWith('.ppak') || lower.endsWith('.pak'))) {
          showToast('Unsupported file. Use a .tar or .ppak. or .pak', 'error');
          return;
        }

        try {
          const buf = await file.arrayBuffer();

          if (lower.endsWith('.tar') || lower.endsWith('.ppak')) {
            setDroppedProjectFile({ name: file.name, data: new Uint8Array(buf) });
            setProjectId(DROPPED_FILE_ID);
            showToast(`Added "${file.name}" to projects`, 'info');
          } else if (lower.endsWith('.pak')) {
            setDroppedBackupFile(new Uint8Array(buf));
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
    [setDroppedProjectFile, setProjectId],
  );

  return { dropRef, isOver };
}

export default useDroppedFile;
