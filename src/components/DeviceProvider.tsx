import { useEffect, useState } from 'preact/hooks';
import { initDevice } from '../lib/midi';
import { TEDevice } from '../lib/midi/types';
import DeviceContext from './DeviceContext';

function DeviceProvider({ children }: any) {
  const [device, setDevice] = useState<TEDevice | null>(null);
  const [deviceError, setDeviceError] = useState<Error | null>(null);

  useEffect(() => {
    initDevice({
      onDeviceFound: (deviceInfo) => {
        console.log('Device found:', deviceInfo);

        setDevice(deviceInfo);
      },
      onDeviceLost: () => {
        console.log('Device lost');
        setDevice(null);
      },
      onNoMidiAccess: (error) => {
        console.error('No MIDI access:', error);
        setDeviceError(error);
      },
    });
    // WebMidi.enable()
    //   .then(() => {
    //     WebMidi.outputs.forEach((output) => console.log(output));

    //     // WebMidi.inputs.forEach((input) => console.log(input));
    //   })
    //   .catch((err) => alert(err));

    // api.init({
    //   debug: false,
    //   onDeviceFound: (_device: Device) => {
    //     try {
    //       trackEvent('device_found', _device.metadata);

    //       if (skuFilter.length === 0 || skuFilter.includes(_device.sku)) {
    //         const _fileHandler = new SysExFileHandler(api, true, 1000);
    //         const _deviceService = new DeviceService(_device, _fileHandler, null, false);

    //         setFileHandler(_fileHandler);
    //         setDevice(_device);
    //         setDeviceService(_deviceService);

    //         Sentry.setTag('device.os_version', _device.metadata?.os_version);
    //         Sentry.setTag('device.serial', _device.metadata?.serial);
    //       }
    //     } catch (err: any) {
    //       setDeviceError(err);

    //       throw err;
    //     }
    //   },
    //   onDeviceUpdated: (_device: any) => {
    //     const _deviceService = new DeviceService(_device, fileHandler, null, false);
    //     setDevice(_device);
    //     setDeviceService(_deviceService);
    //   },
    //   onDeviceLost: () => {
    //     setDevice(null);
    //     setDeviceService(null);
    //   },
    //   onNoMidi: (reason: string) => {
    //     switch (reason) {
    //       case 'no-midi-support':
    //         setDeviceError(new MIDINotSupportedError(reason));
    //         break;
    //       default:
    //         setDeviceError(new MIDIDisallowedError(reason));
    //         break;
    //     }
    //   },
    //   onMidiInited: () => {},
    // });
  }, []);

  return (
    <DeviceContext.Provider value={{ device, error: deviceError }}>
      {children}
    </DeviceContext.Provider>
  );
}

export default DeviceProvider;
