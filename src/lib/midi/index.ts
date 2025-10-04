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
  TE_SYSEX_FILE,
  TE_SYSEX_FILE_FILE_TYPE_FILE,
} from './constants';
import { FileListEntry, TESysexMessage } from './types';
import {
  binToString,
  buildSysExFileInfoRequest,
  buildSysExFileInitRequest,
  buildSysExFileListRequest,
  getNextRequestId,
  metadataStringToObject,
  packToBuffer,
  parseFileInfoResponse,
  parseMidiIdentityResponse,
  parseSysExFileListResponse,
  sysexStatusToString,
  unpackInPlace,
} from './utils';

let deviceInputPort: MIDIInput | null = null;
let deviceOutputPort: MIDIOutput | null = null;

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
    if (
      bytes.length >= 8 &&
      bytes[0] === MIDI_SYSEX_START &&
      bytes[1] === TE_MIDI_ID_0 &&
      bytes[2] === TE_MIDI_ID_1 &&
      bytes[3] === TE_MIDI_ID_2 &&
      bytes[5] === 51
    ) {
      console.log(binToString(bytes.subarray(6, bytes.length - 1)));
    }
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
    console.error(`cannot handle message with status ${msg.status}`);
    return;
  }

  msg.rawData = unpackInPlace(bytes.subarray(index, bytes.length - 1));
  msg.string = binToString(msg.rawData);

  // msg.hex_data = asHexString(msg.rawData);
  // msg.hex_command = msg.command.toString(16).padStart(2, '0');

  return msg;
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

async function sendIdentAndWaitForReponse(
  output: MIDIOutput,
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

    output.send(IDENTITY_SYSEX);

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
    const response = await sendIdentAndWaitForReponse(output, midiAccess);

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
    throw new Error('No Teenage Engineering device found');
  }
}

export async function getFileList(
  nodeId: number = 0,
  filesList: FileListEntry[] = [],
  path = '/',
): Promise<FileListEntry[]> {
  let page = 0;

  while (true) {
    console.log(`-----Requesting file list page ${page} for node ${nodeId}`);
    const fileListRequest = buildSysExFileListRequest(page, nodeId);
    const fileListResponse = await sendSysexToDevice(TE_SYSEX_FILE, fileListRequest);
    if (!fileListResponse || !fileListResponse.rawData || fileListResponse.rawData.length < 2) {
      break;
    }

    const pageNumber = ((fileListResponse.rawData[0] << 8) | fileListResponse.rawData[1]) & 0xffff;
    if (pageNumber !== page) {
      throw new Error(`unexpected page ${pageNumber}, expected ${page}`);
    }
    page += 1;

    // console.log('File list response:', fileListResponse);

    const payload = fileListResponse?.rawData.slice(2);
    const list = parseSysExFileListResponse(payload);

    if (list.length === 0) {
      break;
    }

    // break;

    for await (const entry of list) {
      // const entry = list[0];
      // console.log('----------File list entry:', entry);
      const filePath = path === '/' ? `${path}${entry.fileName}` : `${path}/${entry.fileName}`;
      const fileType = entry.flags & TE_SYSEX_FILE_FILE_TYPE_FILE ? 1 : 2;
      filesList.push({
        ...entry,
        fileName: filePath,
        fileType: fileType === 1 ? 'file' : 'folder',
      });

      if (fileType === 2) {
        await getFileList(entry.nodeId, filesList, filePath);
      }
    }
  }

  return filesList;
}

export async function initializeMidiDevice(): Promise<void> {
  if (deviceInputPort) {
    deviceInputPort.addEventListener('midimessage', (event) => {
      console.log('============', event);
    });
  }

  try {
    const midiAccess = await navigator.requestMIDIAccess({ sysex: true });

    await discoverDevicePorts(midiAccess);

    console.log(deviceOutputPort, deviceInputPort);

    const greetResponse = await sendSysexToDevice(TE_SYSEX.GREET, []);

    console.log('Greet response:', greetResponse);

    // const fileInitRequest = buildSysExFileInitRequest(4 * 1024 * 1024, 0);
    // console.log('-======', fileInitRequest);
    // const fileInfoRequest = ;
    const fileInfoResponse = await sendSysexToDevice(
      TE_SYSEX_FILE,
      buildSysExFileInfoRequest(11301),
    );

    // console.log('File info response:', fileInfoResponse);
    const res = parseFileInfoResponse(fileInfoResponse?.rawData);
    console.log('---Parsed file info:', res);

    // const fileList = await getFileList();
    // console.log('Parsed file list info:', fileList);
  } catch (error) {
    console.error('Error accessing MIDI:', error);

    return;
  }
}

async function sendSysexToDevice(
  command: number,
  data: Uint8Array | Array<number>,
  timeoutMs: number = 5000,
): Promise<TESysexMessage | null> {
  return new Promise<TESysexMessage | null>((resolve, reject) => {
    if (!deviceOutputPort || !deviceInputPort) {
      console.warn('No device output port available');
      reject();
      return;
    }

    const timeoutHandler = () => {
      console.warn('Timeout waiting for sysex response');
      deviceInputPort!.removeEventListener('midimessage', handleMidiMessage);
      reject();
    };

    let timeoutId = setTimeout(timeoutHandler, timeoutMs);
    let currentRequestId = -1;

    const handleMidiMessage = (event: MIDIMessageEvent) => {
      // console.log('----Received MIDI message:', event.data);

      // if (!event.data) {
      //   reject();
      //   return;
      // }

      const response = parseTeenageSysex(event?.data || new Uint8Array());
      console.log('Parsed', response);

      // if (!response && tries-- > 0) {
      //   timeoutId = setTimeout(timeoutHandler, timeoutMs);
      //   deviceInputPort!.addEventListener('midimessage', handleMidiMessage);
      //   return;
      // }

      if (!response || response.type !== 'response' || response.requestId !== currentRequestId) {
        // console.log(
        //   `Ignoring response with requestId ${response?.requestId}, expected ${currentRequestId}`,
        // );

        return;
      }

      clearTimeout(timeoutId);
      deviceInputPort!.removeEventListener('midimessage', handleMidiMessage);

      if (response.status === TE_SYSEX.STATUS_OK) {
        resolve(response);
      } else if (response.status === TE_SYSEX.STATUS_SPECIFIC_SUCCESS_START) {
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!Partial response received, waiting for more...');
        timeoutId = setTimeout(timeoutHandler, timeoutMs);

        // onPartialResponse && onPartialResponse(response);
      } else {
        console.warn('Received error status in sysex response', response);

        reject();
      }
    };

    deviceInputPort.addEventListener('midimessage', handleMidiMessage);

    currentRequestId = sendTESysEx(deviceOutputPort, 0, command, new Uint8Array(data));
  });
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
