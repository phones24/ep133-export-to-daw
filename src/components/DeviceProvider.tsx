import * as Sentry from '@sentry/react';
import { useEffect, useState } from 'preact/hooks';
import { Device } from '../ep133';
import { api } from '../ep133/api';
import { DeviceService } from '../ep133/device-service';
import { MIDIDisallowedError, MIDINotSupportedError } from '../ep133/errors';
import { SysExFileHandler } from '../ep133/sysex-file-handler';
import { trackEvent } from '../lib/ga';
import DeviceContext from './DeviceContext';

const skuFilter = ['TE032AS001', 'TE032AS005'];

function DeviceProvider({ children }: any) {
  const [device, setDevice] = useState<Device | null>(null);
  const [deviceService, setDeviceService] = useState<DeviceService | null>(null);
  const [fileHandler, setFileHandler] = useState<SysExFileHandler | null>(null);
  const [deviceError, setDeviceError] = useState<Error | null>(null);

  useEffect(() => {
    api.init({
      debug: false,
      onDeviceFound: (_device: Device) => {
        trackEvent('device_found', _device.metadata);

        if (skuFilter.length === 0 || skuFilter.includes(_device.sku)) {
          const _fileHandler = new SysExFileHandler(api, true, 1000);
          const _deviceService = new DeviceService(_device, _fileHandler, null, false);

          setFileHandler(_fileHandler);
          setDevice(_device);
          setDeviceService(_deviceService);

          Sentry.setTag('device.os_version', _device.metadata?.os_version);
          Sentry.setTag('device.serial', _device.metadata?.serial);
        }
      },
      onDeviceUpdated: (_device: any) => {
        const _deviceService = new DeviceService(_device, fileHandler, null, false);
        setDevice(_device);
        setDeviceService(_deviceService);
      },
      onDeviceLost: () => {
        setDevice(null);
        setDeviceService(null);
      },
      onNoMidi: (reason: string) => {
        switch (reason) {
          case 'no-midi-support':
            setDeviceError(new MIDINotSupportedError(reason));
            break;
          default:
            setDeviceError(new MIDIDisallowedError(reason));
            break;
        }
      },
      onMidiInited: () => {},
    });
  }, []);

  return (
    <DeviceContext.Provider value={{ fileHandler, device, deviceService, error: deviceError }}>
      {children}
    </DeviceContext.Provider>
  );
}

export default DeviceProvider;
