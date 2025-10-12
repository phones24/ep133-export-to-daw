import { useEffect, useState } from 'preact/hooks';
import { initDevice } from '../lib/midi';
import { TEDevice } from '../lib/midi/types';
import DeviceContext from './DeviceContext';

function DeviceProvider({ children }: { children: preact.ComponentChildren }) {
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
  }, []);

  return (
    <DeviceContext.Provider value={{ device, error: deviceError }}>
      {children}
    </DeviceContext.Provider>
  );
}

export default DeviceProvider;
