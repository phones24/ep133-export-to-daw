import { useQuery } from '@tanstack/react-query';
import { getProjectFile } from '../lib/midi';
import {
  collectEffects,
  collectPads,
  collectScenesAndPatterns,
  collectSettings,
  collectSounds,
} from '../lib/parsers';
import { untar } from '../lib/untar';
import { ProjectRawData } from '../types/types';
import useDevice from './useDevice';

function useProject(id?: number | string) {
  const { device } = useDevice();

  const result = useQuery<ProjectRawData | null>({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) {
        return null;
      }

      const archive = await getProjectFile(Number(id));
      const files = await untar(archive.data);
      const sounds = await collectSounds(files);
      const settings = collectSettings(files);
      const pads = collectPads(files, sounds);
      const scenes = collectScenesAndPatterns(files);
      const effects = collectEffects(files);

      // @ts-expect-error wrong typing?
      const projectFileBlob = new Blob([archive.data]);
      const projectFile = new File(
        [projectFileBlob],
        `project-${String(id).padStart(2, '0')}.tar`,
        {
          type: 'application/x-tar',
          lastModified: Date.now(),
        },
      );

      console.log(projectFile);

      return {
        pads,
        scenes,
        settings,
        sounds,
        effects,
        projectFile,
      };
    },
    retry: false,
    enabled: !!id && !!device,
    throwOnError: true,
  });

  return result;
}

export default useProject;
