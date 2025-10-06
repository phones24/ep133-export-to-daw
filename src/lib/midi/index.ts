import {
  canInitializeDevice,
  disconnectDevice,
  getDeviceInputPort,
  getDeviceOutputPort,
  setDeviceInputPort,
  setDeviceOutputPort,
  tryInitDevice,
} from './device';
import { getFile, getFileNodeByPath } from './fs';
import { TEDevice } from './types';

export async function initDevice({
  onDeviceFound,
  onDeviceLost,
  onNoMidiAccess,
}: {
  onDeviceFound?: (deviceInfo: TEDevice) => void;
  onDeviceLost?: () => void;
  onNoMidiAccess?: (error: Error) => void;
}): Promise<void> {
  let midiAccess: MIDIAccess | null = null;

  try {
    midiAccess = await navigator.requestMIDIAccess({ sysex: true });
  } catch (error) {
    onNoMidiAccess?.(error as Error);

    return;
  }

  tryInitDevice(midiAccess, onDeviceFound);

  const stateChangeMidiEventHandler = (event: MIDIConnectionEvent) => {
    const currentInputPort = getDeviceInputPort();
    const currentOutputPort = getDeviceOutputPort();

    if (
      event.port?.state === 'disconnected' &&
      (currentInputPort?.id === event.port?.id || currentOutputPort?.id === event.port?.id)
    ) {
      disconnectDevice();

      onDeviceLost?.();
    }

    if (event.port?.state === 'connected') {
      if (event.port?.type === 'input') {
        setDeviceInputPort(event.port as MIDIInput);
      }

      if (event.port?.type === 'output') {
        setDeviceOutputPort(event.port as MIDIOutput);
      }

      if (canInitializeDevice()) {
        setTimeout(() => tryInitDevice(midiAccess, onDeviceFound), 1000);
      }
    }
  };

  midiAccess.addEventListener('statechange', stateChangeMidiEventHandler);

  if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', () => {
      midiAccess?.removeEventListener('statechange', stateChangeMidiEventHandler);
    });
  }
}

export async function getProjectFile(projectId: number) {
  const path = `/projects/${String(projectId).padStart(2, '0')}`;
  const foundNode = await getFileNodeByPath(path);

  if (!foundNode) {
    throw new Error(`Project ${projectId} not found`);
  }

  const archive = await getFile(foundNode.nodeId);

  return archive;
}
