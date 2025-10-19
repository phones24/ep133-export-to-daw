import { useAtom } from 'jotai';
import type { DropTargetMonitor } from 'react-dnd';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { droppedProjectFileAtom } from '~/atoms/droppedProjectFile';
import { projectIdAtom } from '~/atoms/project';
import { showToast } from '~/lib/toast';

const MAX_BYTES = 10 * 1024 * 1024;
export const DROPPED_FILE_ID = '10';

function useDroppedProjectFile() {
  const [, setProjectId] = useAtom(projectIdAtom);
  const [, setDroppedProjectFile] = useAtom(droppedProjectFileAtom);

  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop: async (_item: unknown, monitor: DropTargetMonitor) => {
        const item = monitor.getItem() as { files?: File[] };
        const file = item?.files?.[0];
        if (!file) {
          return;
        }

        if (file.size > MAX_BYTES) {
          showToast('File too large. Max 10 MB.', 'error');
          return;
        }

        const lower = file.name.toLowerCase();
        if (!(lower.endsWith('.tar') || lower.endsWith('.ppak'))) {
          showToast('Unsupported file. Use a .tar or .ppak.', 'error');
          return;
        }

        try {
          const buf = await file.arrayBuffer();
          setDroppedProjectFile({ name: file.name, data: new Uint8Array(buf) });
          setProjectId(DROPPED_FILE_ID);
          showToast(`Added "${file.name}" to projects`, 'info');
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

export default useDroppedProjectFile;
