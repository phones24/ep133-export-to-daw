import { useQuery } from '@tanstack/react-query';
import { SoundMetadata } from '../types/ep133';
import { Sound } from '../types/types';
import useDevice from './useDevice';

function useAllSounds() {
  const { device, deviceService } = useDevice();

  const result = useQuery({
    queryKey: ['sounds'],
    queryFn: async () => {
      if (!deviceService) {
        return null;
      }

      const allSounds: Sound[] = [];
      for await (const sound of deviceService.getAllSounds()) {
        const meta: SoundMetadata = await deviceService.getMetadata(sound.path);
        const soundData = {
          ...sound,
          meta,
          id: parseInt(sound.path.split('/')[2].split('.')[0], 10),
        };

        allSounds.push(soundData);
      }

      return allSounds;
    },
    enabled: !!device && !!deviceService,
    retry: false,
    throwOnError: true,
  });

  return result;
}

export default useAllSounds;
