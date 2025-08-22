import { useQuery } from '@tanstack/react-query';
import { BlobReader } from '../ep133/stream';
import { collectPads, collectScenesAndPatterns, Pad, Scene } from '../lib/parsers';
import { untar } from '../lib/untar';
import useDevice from './useDevice';

export type ProjectRawData = {
  pads: Record<string, Pad[]>;
  scenes: Record<string, Scene>;
};

function useProject(id: number | string) {
  const { device, deviceService } = useDevice();

  const result = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!deviceService) {
        return null;
      }

      const archive = await deviceService.downloadProjectArchive(
        `/projects/${String(id).padStart(2, '0')}`,
      );

      const projectFile = new File([...archive.data], `project${archive.name}.tar`);

      const blobReader = new BlobReader(projectFile);
      // const fileReader = new FileReader();

      // fileReader.readAsArrayBuffer(blobReader.blob);

      // console.log('=========== READER', fileReader);
      // const arrBuf = await blobReader.blob.arrayBuffer();

      const files = await untar(blobReader.blob);
      console.log(files);
      // console.log(files[54].data);
      const pads = collectPads(files);
      const scenes = collectScenesAndPatterns(files);

      // const pads = files.filter((f) => f.name.startsWith('pad') && f.type === 'file');

      // for(const group of GROUPS) {
      //   const groupPads = pads.filter((f) => f.name.startsWith(group.id) && f.type === 'file');
      //   console.log('=========== GROUP', group.id, groupPads);
      // }

      // console.log('=========== scenes', scenes);

      return {
        pads,
        scenes,
      } as ProjectRawData;
    },
    retry: false,
    enabled: !!id && !!device && !!deviceService,
    throwOnError: true,
  });

  return result;
}

export default useProject;
