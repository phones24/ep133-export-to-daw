import { useContext } from 'preact/hooks';
import DeviceContext from '../components/DeviceContext';

function useDevice() {
  const context = useContext(DeviceContext);

  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }

  return context;
}

export default useDevice;
