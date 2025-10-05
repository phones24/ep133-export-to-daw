import { useQuery } from '@tanstack/react-query';
import { getAllSounds } from '../lib/midi';
import useDevice from './useDevice';

function useAllSounds() {
  const { device } = useDevice();

  const result = useQuery({
    queryKey: ['sounds'],
    queryFn: () => getAllSounds(),
    enabled: !!device,
    retry: false,
    throwOnError: true,
  });

  return result;
}

export default useAllSounds;
