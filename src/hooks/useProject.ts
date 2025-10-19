import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { droppedProjectFileAtom } from '~/atoms/droppedProjectFile';
import { getProjectFile } from '../lib/midi';
import {
  collectEffects,
  collectPads,
  collectScenesAndPatterns,
  collectScenesSettings,
  collectSettings,
  collectSounds,
} from '../lib/parsers';
import { untar } from '../lib/untar';
import { ProjectRawData } from '../types/types';
import useDevice from './useDevice';
import { DROPPED_FILE_ID } from './useDroppedProjectFile';

function useProject(id?: number | string) {
  const { device } = useDevice();
  const droppedProjectFile = useAtomValue(droppedProjectFileAtom);

  const result = useQuery<ProjectRawData | null>({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) {
        return null;
      }

      let archiveData: Uint8Array | undefined;

      if (id === DROPPED_FILE_ID && droppedProjectFile) {
        archiveData = droppedProjectFile.data;
      } else {
        const archive = await getProjectFile(Number(id));
        archiveData = archive.data;
      }

      const files = await untar(archiveData);
      const sounds = await collectSounds(files);
      const settings = collectSettings(files);
      const pads = collectPads(files, sounds);
      const scenes = collectScenesAndPatterns(files);
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
