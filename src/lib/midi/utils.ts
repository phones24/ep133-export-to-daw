import { TE_SYSEX } from './constants';
import { TEDeviceIdentification, TEDeviceMetadata } from './types';

const requestIds: Map<string, number> = new Map();

export const crc32 = (data: Uint8Array, initial = 0) => {
  const normalize = (value: number) => (value >= 0 ? value : 0xffffffff + value + 1);

  let crc = normalize(initial) ^ 0xffffffff;

  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }

  return normalize(crc ^ 0xffffffff);
};

export function unpackInPlace(packedBytes: Uint8Array): Uint8Array {
  let writeIndex = 0; // Index where unpacked bytes will be written
  let msbIndex = 0; // Index in array holding the MSB flags
  let bitIndex = 0; // Bit position within the MSB byte
  let readIndex = 1; // Read position for data bytes
  let msbByte = packedBytes[msbIndex];

  while (readIndex < packedBytes.length) {
    const msb = (msbByte & (1 << bitIndex) ? 1 : 0) << 7; // Extract MSB bit
    const data = packedBytes[readIndex] & 0x7f; // Lower 7 bits
    const fullByte = msb | data;

    packedBytes[writeIndex] = fullByte;

    bitIndex++;
    readIndex++;
    writeIndex++;

    if (bitIndex > 6) {
      // Move to next group of 8 bytes (1 MSB byte + 7 data bytes)
      readIndex++;
      bitIndex = 0;
      msbIndex += 8;
      msbByte = packedBytes[msbIndex];
    }
  }

  return packedBytes.subarray(0, writeIndex);
}

export function parseMidiIdentityResponse(data: Uint8Array): TEDeviceIdentification | null {
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

export function metadataStringToObject(metaString: string) {
  const result: TEDeviceMetadata = {
    chip_id: '',
    mode: '',
    os_version: '',
    product: '',
    serial: '',
    sku: '',
    sw_version: '',
  };

  metaString.split(';').forEach((entry) => {
    const [key, value] = entry.split(':');
    if (key && value) {
      (result as Record<string, string>)[key] = value;
    }
  });

  return result;
}

export function binToString(byteArray: Uint8Array) {
  return String.fromCharCode.apply(null, Array.from(byteArray));
}

export function sysexStatusToString(status: number) {
  if (status === TE_SYSEX.STATUS_OK) return 'ok';
  if (status >= TE_SYSEX.STATUS_SPECIFIC_SUCCESS_START) return 'command-specific-success';
  if (status === TE_SYSEX.STATUS_ERROR) return 'error';
  if (status === TE_SYSEX.STATUS_COMMAND_NOT_FOUND) return 'not-found';
  if (status === TE_SYSEX.STATUS_BAD_REQUEST) return 'bad-request';
  if (
    status >= TE_SYSEX.STATUS_SPECIFIC_ERROR_START &&
    status < TE_SYSEX.STATUS_SPECIFIC_SUCCESS_START
  ) {
    return 'command-specific-error';
  }
  return 'unknown';
}

export function packToBuffer(data: Uint8Array, outBuffer: Uint8Array) {
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

export function getNextRequestId(outputId: string): number {
  if (!requestIds.has(outputId)) {
    requestIds.set(outputId, Math.floor(Math.random() * 4095));
  }
  const nextId = ((requestIds.get(outputId) ?? 0) + 1) % 4096;
  requestIds.set(outputId, nextId);
  return nextId;
}

export function parseNullTerminatedString(buffer: Uint8Array, startIndex: number) {
  let endIndex = startIndex;

  while (endIndex < buffer.length && buffer[endIndex] !== 0) {
    endIndex++;
  }

  return new TextDecoder().decode(buffer.subarray(startIndex, endIndex));
}

export function writeStringToView(
  dataView: DataView,
  offset: number,
  str: string,
  nullTerminate = false,
) {
  let pos = offset;
  for (let i = 0; i < str.length; i++) {
    dataView.setUint8(pos++, str.charCodeAt(i));
  }
  if (nullTerminate && pos > 0) {
    dataView.setUint8(pos++, 0);
  }
  return pos;
}

export function sanitizeBrokenJson(input: string) {
  return input.replace(/:"([^"]*?)"([^,}]*)/g, (_, part1, part2) => {
    const fixed = (part1 + part2).replace(/"/g, '\\"');
    return `:"${fixed}"`;
  });
}
