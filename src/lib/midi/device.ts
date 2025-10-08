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

let _deviceInputPort: MIDIInput | null = null;
let _deviceOutputPort: MIDIOutput | null = null;
let _pendingInitialization = false;
let _deviceInitialized = false;

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
  midiAccess: MIDIAccess,
  timeoutMs: number = 5_000,
): Promise<Uint8Array | null> {
  return new Promise<Uint8Array | null>((resolve, reject) => {
    const input = Array.from(midiAccess.inputs.values()).find((inp) => inp.name === output.name);

    if (!input) {
      reject(`No matching input port found for output ${output.name}`);
      return;
    }

    const handleMidiMessage = (event: MIDIMessageEvent) => {
      const data = event.data;
      if (data && data[0] === 0xf0) {
        input.removeEventListener('midimessage', handleMidiMessage);
        resolve(data);
      }
    };

    input.addEventListener('midimessage', handleMidiMessage);

    output.send(IDENTITY_SYSEX);

    setTimeout(() => {
      input.removeEventListener('midimessage', handleMidiMessage);
      reject('Timeout waiting for identity response');
    }, timeoutMs);
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
    const response = await sendIdentAndWaitForReponse(output, midiAccess);
    if (response) {
      parsedResponse = parseMidiIdentityResponse(response);

      if (parsedResponse) {
        setDeviceOutputPort(output);
        setDeviceInputPort(
          Array.from(midiAccess.inputs.values()).find((inp) => inp.name === output.name) || null,
        );

        break;
      }
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
    if (!_deviceOutputPort || !_deviceInputPort) {
      reject('No device output port available');
      return;
    }

    const timeoutHandler = () => {
      _deviceInputPort?.removeEventListener('midimessage', handleMidiMessage);
      reject('Timeout waiting for sysex response');
    };

    const timeoutId = setTimeout(timeoutHandler, timeoutMs);
    let currentRequestId = -1;

    const handleMidiMessage = (event: MIDIMessageEvent) => {
      const response = parseTeenageSysex(event?.data || new Uint8Array());

      if (!response || response.type !== 'response' || response.requestId !== currentRequestId) {
        return;
      }

      clearTimeout(timeoutId);

      _deviceInputPort?.removeEventListener('midimessage', handleMidiMessage);

      if (response.status === TE_SYSEX.STATUS_OK) {
        resolve(response);
      } else if (response.status === TE_SYSEX.STATUS_SPECIFIC_SUCCESS_START) {
        reject('Partial response handling not implemented yet');
      } else {
        reject(`Received error status in sysex response: ${JSON.stringify(response)}`);
      }
    };

    _deviceInputPort.addEventListener('midimessage', handleMidiMessage);
    currentRequestId = sendTESysEx(_deviceOutputPort, 0, command, new Uint8Array(payload));
  });
}

export async function tryInitDevice(
  midiAccess: MIDIAccess,
  onDeviceFound?: (deviceInfo: TEDevice) => void,
) {
  if (_pendingInitialization || _deviceInitialized) {
    return null;
  }

  try {
    _pendingInitialization = true;

    const deviceIdentification = await discoverDevicePorts(midiAccess);

    if (!deviceIdentification) {
      throw new Error('Cannot get device identification');
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

    _deviceInitialized = true;

    return deviceMetadata;
  } catch (error) {
    console.error('Error accessing MIDI:', error);

    return null;
  } finally {
    _pendingInitialization = false;
  }
}

export function getDeviceInputPort() {
  return _deviceInputPort;
}

export function getDeviceOutputPort() {
  return _deviceOutputPort;
}

export function setDeviceInputPort(port: MIDIInput | null) {
  _deviceInputPort = port;
}

export function setDeviceOutputPort(port: MIDIOutput | null) {
  _deviceOutputPort = port;
}

export function disconnectDevice() {
  setDeviceInputPort(null);
  setDeviceOutputPort(null);
  _deviceInitialized = false;
}

export function canInitializeDevice() {
  return (
    !_pendingInitialization && !_deviceInitialized && getDeviceInputPort() && getDeviceOutputPort()
  );
}
