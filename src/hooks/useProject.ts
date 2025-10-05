import { useQuery } from '@tanstack/react-query';
import { BlobReader } from '../ep133/stream';
import { getProjectFiles } from '../lib/midi';
import {
  collectEffects,
  collectPads,
  collectScenesAndPatterns,
  collectSettings,
} from '../lib/parsers';
import { untar } from '../lib/untar';
import { ProjectRawData } from '../types/types';
import useAllSounds from './useAllSounds';
import useDevice from './useDevice';

function useProject(id?: number | string) {
  const { device } = useDevice();
  const { data: allSounds } = useAllSounds();

  const result = useQuery<ProjectRawData | null>({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!allSounds || !id) {
        return null;
      }

      const archive = await getProjectFiles(id);

      const projectFile = new File([...archive.data], `project${archive.name}.tar`);
      const blobReader = new BlobReader(projectFile);
      const files = await untar(blobReader.blob);

      const settings = collectSettings(files);
      const pads = collectPads(files, allSounds);
      const scenes = collectScenesAndPatterns(files);
      const effects = collectEffects(files);

      return {
        pads,
        scenes,
        settings,
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
