import { useQuery } from '@tanstack/react-query';
import { BlobReader } from '../ep133/stream';
import { collectPads, collectScenesAndPatterns, collectSettings } from '../lib/parsers';
import { untar } from '../lib/untar';
import { ProjectRawData } from '../types/types';
import useAllSounds from './useAllSounds';
import useDevice from './useDevice';

function useProject(id: number | string) {
  const { device, deviceService } = useDevice();
  const { data: allSounds } = useAllSounds();

  const result = useQuery<ProjectRawData | null>({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!deviceService || !allSounds) {
        return null;
      }

      const archive = await deviceService.downloadProjectArchive(
        `/projects/${String(id).padStart(2, '0')}`,
      );

      const projectFile = new File([...archive.data], `project${archive.name}.tar`);
      const blobReader = new BlobReader(projectFile);
      const files = await untar(blobReader.blob);
      console.log('files', files);
      const settings = collectSettings(files);
      const pads = collectPads(files, allSounds);
      const scenes = collectScenesAndPatterns(files);

      return {
        pads,
        scenes,
        settings,
      };
    },
    retry: false,
    enabled: !!id && !!device && !!deviceService,
    throwOnError: true,
  });

  return result;
}

export default useProject;
