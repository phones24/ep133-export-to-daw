import {
  BIT_IS_REQUEST,
  BIT_REQUEST_ID_AVAILABLE,
  IDENTITY_SYSEX,
  MIDI_SYSEX_END,
  MIDI_SYSEX_START,
  MIDI_SYSEX_TE,
  TE_MIDI_ID_0,
  TE_MIDI_ID_1,
  TE_MIDI_ID_2,
  TE_SYSEX,
  TE_SYSEX_GREET,
} from './constants';
import { TEDevice, TEDeviceIdentification, TESysexMessage } from './types';
import {
  binToString,
  getNextRequestId,
  metadataStringToObject,
  packToBuffer,
  parseMidiIdentityResponse,
  sysexStatusToString,
  unpackInPlace,
} from './utils';

let deviceInputPort: MIDIInput | null = null;
let deviceOutputPort: MIDIOutput | null = null;
let pendingInitialization = false;
let deviceInitialized = false;
const messageHandler = new Map<number, (requestId: number, data: Uint8Array) => void>();
const portListeners = new Map<MIDIInput, (event: MIDIMessageEvent) => void>();

async function startEventListener(midiAccess: MIDIAccess) {
  const inputs = midiAccess.inputs.values();

  // remove old listeners if any
  // mainly for hot reload during development
  stopEventListener();

  const handleMidiMessage = (event: MIDIMessageEvent) => {
    // skip empty messages and non-sysex messages (like clock)
    if (!event.data || event.data.length === 0 || event.data[0] !== MIDI_SYSEX_START) {
      return;
    }

    for (const [requestId, handler] of messageHandler.entries()) {
      handler(requestId, event.data);
    }
  };

  for (const inputPort of inputs) {
    inputPort.addEventListener('midimessage', handleMidiMessage);
    portListeners.set(inputPort, handleMidiMessage);
  }
}

function stopEventListener() {
  for (const [port, callback] of portListeners) {
    if (port) {
      port.removeEventListener('midimessage', callback);
      portListeners.delete(port);
    }
  }
}

function parseTeenageSysex(bytes: Uint8Array) {
  const validHeader =
    bytes.length >= 9 &&
    bytes[0] === MIDI_SYSEX_START &&
    bytes[1] === TE_MIDI_ID_0 &&
    bytes[2] === TE_MIDI_ID_1 &&
    bytes[3] === TE_MIDI_ID_2 &&
    bytes[5] === MIDI_SYSEX_TE &&
    bytes[bytes.length - 1] === MIDI_SYSEX_END;

  if (!validHeader) {
    return;
  }

  const msg: TESysexMessage = {
    kind: 'te-sysex',
    identityCode: bytes[4],
    requestId: 0,
    hasRequestId: false,
    status: -1,
    hStatus: '',
    command: bytes[8],
    type: bytes[6] & BIT_IS_REQUEST ? 'request' : 'response',
    rawData: new Uint8Array(),
    hexData: '',
    hexCommand: '',
    string: '',
  };

  if (bytes[6] & BIT_REQUEST_ID_AVAILABLE) {
    msg.hasRequestId = true;
    msg.requestId = ((bytes[6] & 0x1f) << 7) | (bytes[7] & 0x7f);
  }

  let index = 9;

  if (msg.type === 'response') {
    msg.status = bytes[index++];
  }

  msg.hStatus = sysexStatusToString(msg.status);
  if (msg.hStatus === undefined) {
    console.error(`Cannot handle message with status ${msg.status}`);
    return;
  }

  msg.rawData = unpackInPlace(bytes.subarray(index, bytes.length - 1));
  msg.string = binToString(msg.rawData);

  return msg;
}

async function sendIdentAndWaitForReponse(
  output: MIDIOutput,
  timeoutMs: number = 2_000,
): Promise<Uint8Array | null> {
  return new Promise<Uint8Array | null>((resolve) => {
    const requestId = 0;

    const timeoutId = setTimeout(() => {
      messageHandler.delete(requestId);
      console.warn('Timeout waiting for identity response');
      resolve(null);
    }, timeoutMs);

    const handleMidiMessage = (_requestId: number, data: Uint8Array) => {
      if (_requestId === 0) {
        clearTimeout(timeoutId);
        messageHandler.delete(_requestId);
        resolve(data);
      }
    };

    messageHandler.set(requestId, handleMidiMessage);

    output.send(IDENTITY_SYSEX);
  });
}

export async function discoverDevicePorts(
  midiAccess: MIDIAccess,
): Promise<TEDeviceIdentification | null> {
  const outputs = Array.from(midiAccess.outputs.values());
  let parsedResponse: TEDeviceIdentification | null = null;

  if (outputs.length === 0) {
    return parsedResponse;
  }

  for (const output of outputs) {
    try {
      console.group('Trying output port:', output.name);

      const response = await sendIdentAndWaitForReponse(output);
      if (response) {
        console.debug('Checking response for output port:', output.name);

        parsedResponse = parseMidiIdentityResponse(response);
        if (parsedResponse) {
          console.log('Found TE device on port:', output.name);

          setDeviceOutputPort(output);
          setDeviceInputPort(
            midiAccess.inputs.values().find((inp) => inp.name?.includes('EP-133')) || null,
          );

          break;
        }
      }
    } finally {
      console.groupEnd();
    }
  }

  return parsedResponse;
}

function sendTESysEx(
  midiOutput: MIDIOutput,
  identityCode: number,
  command: number,
  data: Uint8Array,
) {
  const packedLength = data.length > 0 ? data.length + Math.ceil(data.length / 7) : 0;
  const message = new Uint8Array(10 + packedLength);
  const requestId = getNextRequestId(midiOutput.id);

  const header = new Uint8Array([
    MIDI_SYSEX_START,
    TE_MIDI_ID_0,
    TE_MIDI_ID_1,
    TE_MIDI_ID_2,
    identityCode,
    MIDI_SYSEX_TE,
    BIT_IS_REQUEST | BIT_REQUEST_ID_AVAILABLE | ((requestId >> 7) & 0x1f),
    requestId & 0x7f,
    command,
  ]);

  message.set(header, 0);
  message[message.length - 1] = MIDI_SYSEX_END;

  packToBuffer(data, message.subarray(9, 9 + packedLength));

  midiOutput.send(message);

  return requestId;
}

export async function sendSysexToDevice(
  command: number,
  payload: Uint8Array | Array<number> = [],
  timeoutMs: number = 5_000,
): Promise<TESysexMessage | null> {
  return new Promise<TESysexMessage | null>((resolve, reject) => {
    if (!deviceOutputPort || !deviceInputPort) {
      reject('No device output port available');
      return;
    }

    const currentRequestId = sendTESysEx(deviceOutputPort, 0, command, new Uint8Array(payload));

    const timeoutHandler = () => {
      messageHandler.delete(currentRequestId);
      reject(`Timeout waiting for sysex response for request ${currentRequestId}`);
    };

    const timeoutId = setTimeout(timeoutHandler, timeoutMs);

    const handleMidiMessage = (_requestId: number, data: Uint8Array) => {
      if (_requestId !== currentRequestId) {
        return;
      }

      const response = parseTeenageSysex(data);
      if (!response || response.type !== 'response' || response.requestId !== currentRequestId) {
        return;
      }

      clearTimeout(timeoutId);

      messageHandler.delete(currentRequestId);

      if (response.status === TE_SYSEX.STATUS_OK) {
        resolve(response);
      } else if (response.status === TE_SYSEX.STATUS_SPECIFIC_SUCCESS_START) {
        reject('Partial response handling not implemented yet');
      } else {
        reject(`Received error status in sysex response: ${JSON.stringify(response)}`);
      }
    };

    messageHandler.set(currentRequestId, handleMidiMessage);
  });
}

export async function tryInitDevice(
  midiAccess: MIDIAccess,
  onDeviceFound?: (deviceInfo: TEDevice) => void,
) {
  if (pendingInitialization || deviceInitialized) {
    return null;
  }

  try {
    pendingInitialization = true;

    await startEventListener(midiAccess);

    const deviceIdentification = await discoverDevicePorts(midiAccess);
    if (!deviceIdentification) {
      return;
    }

    const greetResponse = await sendSysexToDevice(TE_SYSEX_GREET);
    if (!greetResponse) {
      throw new Error('No greetings from device');
    }

    const deviceMetadata = metadataStringToObject(greetResponse.string);
    const deviceInfo: TEDevice = {
      inputId: getDeviceInputPort()?.id || '',
      outputId: getDeviceOutputPort()?.id || '',
      sku: deviceMetadata.sku,
      serial: deviceMetadata.serial,
      metadata: deviceMetadata,
    };

    onDeviceFound?.(deviceInfo);

    deviceInitialized = true;

    return deviceMetadata;
  } catch (error) {
    console.error('Error accessing MIDI:', error);

    return null;
  } finally {
    pendingInitialization = false;
  }
}

export function getDeviceInputPort() {
  return deviceInputPort;
}

export function getDeviceOutputPort() {
  return deviceOutputPort;
}

export function setDeviceInputPort(port: MIDIInput | null) {
  deviceInputPort = port;
}

export function setDeviceOutputPort(port: MIDIOutput | null) {
  deviceOutputPort = port;
}

export function disconnectDevice() {
  stopEventListener();
  setDeviceInputPort(null);
  setDeviceOutputPort(null);
  deviceInitialized = false;
}

export function canInitializeDevice() {
  return (
    !pendingInitialization && !deviceInitialized && getDeviceInputPort() && getDeviceOutputPort()
  );
}
