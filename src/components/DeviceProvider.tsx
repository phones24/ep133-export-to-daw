import { useAtom } from 'jotai';
import { useEffect, useState } from 'preact/hooks';
import { deviceSkuAtom } from '~/atoms/deviceSku';
import { SKU_EP133 } from '~/lib/constants';
import { initDevice } from '../lib/midi';
import { TEDevice } from '../lib/midi/types';
import DeviceContext from './DeviceContext';

function DeviceProvider({ children }: { children: preact.ComponentChildren }) {
  const [device, setDevice] = useState<TEDevice | null>(null);
  const [deviceError, setDeviceError] = useState<Error | null>(null);
  const [, setDeviceSku] = useAtom(deviceSkuAtom);

  useEffect(() => {
    initDevice({
      onDeviceFound: (deviceInfo) => {
        console.log('Device found:', deviceInfo);
        setDevice(deviceInfo);
        setDeviceSku(deviceInfo.sku);
      },
      onDeviceLost: () => {
        console.log('Device lost');
        setDevice(null);
        setDeviceSku(SKU_EP133);
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
