import { createContext } from 'preact';
import { TEDevice } from '../lib/midi/types';

const DeviceContext = createContext<{
  device: TEDevice | null;
  error: Error | null;
}>({
  device: null,
  error: null,
});

export default DeviceContext;
