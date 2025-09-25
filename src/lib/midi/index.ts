import {
  BIT_IS_REQUEST,
  BIT_REQUEST_ID_AVAILABLE,
  MIDI_SYSEX_END,
  MIDI_SYSEX_START,
  MIDI_SYSEX_TE,
  TE_MIDI_ID_0,
  TE_MIDI_ID_1,
  TE_MIDI_ID_2,
} from '../../ep133/constants';

let deviceInputPort: MIDIInput | null = null;
let deviceOutputPort: MIDIOutput | null = null;
let lastRequestId = 0;
const IDENTITY_SYSEX = [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7];

function parseMidiIdentityResponse(data: Uint8Array) {
  if (
    data.length === 17 &&
    data[0] === 0xf0 && // SysEx start
    data[1] === 0x7e && // Universal SysEx
    data[5] === 0 && // TE manufacturer ID byte 0
    data[6] === 32 && // TE manufacturer ID byte 1
    data[7] === 118 // TE manufacturer ID byte 2
  ) {
    const productCode = data[8] ^ (data[9] << 7);
    const assemblyCode = data[10] ^ (data[11] << 7);

    return {
      id: data[2],
      sku: `TE${productCode.toString().padStart(3, '0')}AS${assemblyCode.toString().padStart(3, '0')}`,
    };
  }

  return null;
}

function packToBuffer(data: Uint8Array, outBuffer: Uint8Array) {
  let outIndex = 1;
  let msbIndex = 0;

  for (let i = 0; i < data.length; ++i) {
    const positionInGroup = i % 7;
    const msb = data[i] >> 7;

    outBuffer[msbIndex] |= msb << positionInGroup;
    outBuffer[outIndex++] = data[i] & 0x7f;

    if (positionInGroup === 6 && i < data.length - 1) {
      msbIndex += 8;
      outIndex++;
    }
  }
}

function getNextRequestId(portId: string): number {
  lastRequestId = (lastRequestId + 1) & 0x3ff;
  return lastRequestId;
}

function sendTESysEx(midiOutput, identityCode, command, data = []) {
  const packedLength = data.length > 0 ? data.length + Math.ceil(data.length / 7) : 0;

  const message = new Uint8Array(10 + packedLength);
  const requestId = getNextRequestId(midiOutput.id);

  message[0] = MIDI_SYSEX_START;
  message[1] = TE_MIDI_ID_0;
  message[2] = TE_MIDI_ID_1;
  message[3] = TE_MIDI_ID_2;
  message[4] = identityCode;
  message[5] = MIDI_SYSEX_TE;
  message[6] = BIT_IS_REQUEST | BIT_REQUEST_ID_AVAILABLE | ((requestId >> 7) & 0x1f);
  message[7] = requestId & 0x7f;
  message[8] = command;
  message[message.length - 1] = MIDI_SYSEX_END;

  packToBuffer(data, message.subarray(9, 9 + packedLength));

  midiOutput.send(message);

  return requestId;
}

async function sendSysexAndWaitForResponse(
  output: MIDIOutput,
  sysexMessage: Array<number> | Uint8Array,
  midiAccess: MIDIAccess,
  timeoutMs: number = 5000,
): Promise<Uint8Array | null> {
  return new Promise<Uint8Array | null>((resolve) => {
    const input = Array.from(midiAccess.inputs.values()).find((inp) => inp.name === output.name);

    if (!input) {
      resolve(null);
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

    // Send the sysex message
    output.send(sysexMessage);

    // Timeout if no response
    setTimeout(() => {
      input.removeEventListener('midimessage', handleMidiMessage);
      resolve(null);
    }, timeoutMs);
  });
}

async function discoverDevicePorts(midiAccess: MIDIAccess): Promise<void> {
  const outputs = Array.from(midiAccess.outputs.values());

  if (outputs.length === 0) {
    return;
  }

  for (const output of outputs) {
    const response = await sendSysexAndWaitForResponse(output, IDENTITY_SYSEX, midiAccess);

    if (response) {
      const parsedResponse = parseMidiIdentityResponse(response);

      if (parsedResponse) {
        deviceOutputPort = output;
        deviceInputPort =
          Array.from(midiAccess.inputs.values()).find((inp) => inp.name === output.name) || null;

        break;
      }
    }
  }

  if (!deviceOutputPort) {
    console.log('No Teenage Engineering device found');
  }
}

export async function initializeMidiDevice(): Promise<void> {
  try {
    const midiAccess = await navigator.requestMIDIAccess({ sysex: true });

    await discoverDevicePorts(midiAccess);
  } catch (error) {
    console.error('Error accessing MIDI:', error);
  }
}

// // Getters for device ports
// export function getDeviceInputPort(): MIDIInput | null {
//   return deviceInputPort;
// }

// export function getDeviceOutputPort(): MIDIOutput | null {
//   return deviceOutputPort;
// }

// // Legacy function for backward compatibility
// export async function sendIdentitySysex(): Promise<void> {
//   return initializeMidiDevice();
// }
