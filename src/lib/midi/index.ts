import {
  canInitializeDevice,
  disconnectDevice,
  getDeviceInputPort,
  getDeviceOutputPort,
  getFileListFromDevice,
  setDeviceInputPort,
  setDeviceOutputPort,
  tryInitDevice,
} from './device';
import { getFile, getFileList, getFileMetadata, getMetadata } from './fs';
import { TEDevice, TESoundMetadata } from './types';

const _files = [];

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
        tryInitDevice(midiAccess, onDeviceFound);
      }
    }
  };

  midiAccess.addEventListener('statechange', stateChangeMidiEventHandler);

  if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', () => {
      midiAccess?.removeEventListener('statechange', stateChangeMidiEventHandler);
    });
  }

  //   console.log(deviceOutputPort, deviceInputPort);

  //   console.log('Greet response:', greetResponse);

  //   await sendSysexToDevice(TE_SYSEX_FILE, buildSysExFileInitRequest(4 * 1024 * 1024, 0));
  //   // console.log('-======', fileInitRequest);
  //   // const fileInfoRequest = ;

  //   const fileInfoResponse = await sendSysexToDevice(
  //     TE_SYSEX_FILE,
  //     buildSysExFileInfoRequest(3000),
  //   );
  //   console.log('File info response:', fileInfoResponse);
  //   // const res = parseFileInfoResponse(fileInfoResponse?.rawData);
  //   // console.log('---Parsed file info:', res);

  //   const res2 = await getFile(3000);
  //   console.log('Downloaded file:', res2);

  //   // const fileList = await getFileList();
  //   // console.log('Parsed file list info:', fileList);
  // } catch (error) {
  //   console.error('Error accessing MIDI:', error);

  //   return;
  // }
}

export async function getAllSounds() {
  const result = [];
  const files = await getFileList();
  const soundFiles = files.filter((f) => f.fileName.startsWith('/sounds/'));

  for (const file of soundFiles) {
    const meta = await getFileMetadata<TESoundMetadata>(file.nodeId);

    const soundData = {
      file,
      meta,
      id: parseInt(file.fileName.split('/')[2].split('.')[0], 10),
    };

    result.push(soundData);
  }

  return result;
}

export async function getProjectFiles(projectId: number) {
  const files = await getFileList();

  const path = `/projects/${String(projectId).padStart(2, '0')}`;
  const foundNode = files.find((f) => f.fileName === path);

  if (!foundNode) {
    throw new Error(`Project ${projectId} not found`);
  }

  const archive = await getFile(foundNode.nodeId);

  console.log('Got project archive:', archive);

  return foundNode;
}
