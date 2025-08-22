import { createContext } from 'preact';
import { DeviceService } from '../ep133/device-service';
import { SysExFileHandler } from '../ep133/sysex-file-handler';
import { Device } from '../ep133/types';

const DeviceContext = createContext<{
  fileHandler: SysExFileHandler | null;
  device: Device | null;
  deviceService: DeviceService | null;
  error: Error | null;
}>({
  fileHandler: null,
  device: null,
  deviceService: null,
  error: null,
});

export default DeviceContext;
