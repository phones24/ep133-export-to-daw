import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import JSZip from 'jszip';
import { droppedBackupFileAtom, droppedProjectFileAtom } from '~/atoms/droppedProjectFile';
import { getProjectFile } from '../lib/midi';
import {
  collectEffects,
  collectPads,
  collectScenesAndPatterns,
  collectScenesSettings,
  collectSettings,
  collectSounds,
  loadSoundsFromBackup,
} from '../lib/parsers';
import { untar } from '../lib/untar';
import { ProjectRawData } from '../types/types';
import useDevice from './useDevice';
import { DROPPED_FILE_ID } from './useDroppedFile';

function useProject(id?: number | string) {
  const { device } = useDevice();
  const droppedProjectFile = useAtomValue(droppedProjectFileAtom);
  const droppedBackupFile = useAtomValue(droppedBackupFileAtom);

  const result = useQuery<ProjectRawData | null>({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id || !device) {
        return null;
      }

      let archiveData: Uint8Array | undefined;
      let unzippedBackup: JSZip | undefined;

      // yeah, you could drop a backup file or a project file
      // but this is just for testing purposes anyway
      if (droppedBackupFile) {
        unzippedBackup = await JSZip.loadAsync(droppedBackupFile);
        const projectFile = unzippedBackup.file(`/projects/P${String(id).padStart(2, '0')}.tar`);
        if (!projectFile) {
          throw new Error('No project file in backup');
        }
        const projectFileData = await projectFile.async('uint8array');
        archiveData = projectFileData;
      } else if (id === DROPPED_FILE_ID && droppedProjectFile) {
        archiveData = droppedProjectFile.data;
      } else {
        const archive = await getProjectFile(Number(id));
        archiveData = archive.data;
      }

      const files = await untar(archiveData);
      const sounds = unzippedBackup
        ? await loadSoundsFromBackup(unzippedBackup, files)
        : await collectSounds(files);
      const settings = collectSettings(files);
      const pads = collectPads(files, sounds);
      const scenes = collectScenesAndPatterns(files, device.sku);
      const scenesSettings = collectScenesSettings(files);
      const effects = collectEffects(files);

      // @ts-expect-error wrong typing?
      const projectFileBlob = new Blob([archiveData]);
      const projectFile = new File(
        [projectFileBlob],
        `project-${String(id).padStart(2, '0')}.tar`,
        {
          type: 'application/x-tar',
          lastModified: Date.now(),
        },
      );

      return {
        pads,
        scenes,
        settings,
        sounds,
        effects,
        projectFile,
        scenesSettings,
      };
    },
    retry: false,
    enabled: !!id && !!device,
    throwOnError: true,
  });

  return result;
}

export default useProject;
