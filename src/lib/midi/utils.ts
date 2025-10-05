import {
  TE_SYSEX,
  TE_SYSEX_FILE_GET,
  TE_SYSEX_FILE_GET_TYPE_DATA,
  TE_SYSEX_FILE_GET_TYPE_INIT,
  TE_SYSEX_FILE_INFO,
  TE_SYSEX_FILE_INIT,
  TE_SYSEX_FILE_LIST,
} from './constants';
import { TESysexMetadata } from './types';

const requestIds: Map<string, number> = new Map();

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

export function parseMidiIdentityResponse(data: Uint8Array) {
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
  const result: TESysexMetadata = {
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

export function buildSysExFileInitRequest(maxResponseLength: number, flags: number) {
  const buffer = new Uint8Array(6);
  const view = new DataView(buffer.buffer);

  view.setUint8(0, TE_SYSEX_FILE_INIT);
  view.setUint8(1, flags);
  view.setUint32(2, maxResponseLength);

  return new Uint8Array(buffer);
}

export function buildSysExFileInfoRequest(fileId: number) {
  const buffer = new Uint8Array(3);
  const view = new DataView(buffer.buffer);

  view.setUint8(0, TE_SYSEX_FILE_INFO);
  view.setUint16(1, fileId);

  return new Uint8Array(buffer);
}

export function parseNullTerminatedString(buffer: Uint8Array, startIndex: number) {
  let endIndex = startIndex;

  while (endIndex < buffer.length && buffer[endIndex] !== 0) {
    endIndex++;
  }

  return new TextDecoder().decode(buffer.subarray(startIndex, endIndex));
}

export function parseFileInfoResponse(data: Uint8Array) {
  const nodeId = (data[0] << 8) | data[1];
  const parentId = (data[2] << 8) | data[3];
  const flags = data[4];
  const fileSize = (data[5] << 24) | (data[6] << 16) | (data[7] << 8) | data[8];
  const fileName = parseNullTerminatedString(data, 9);

  return {
    nodeId,
    parentId,
    flags,
    fileSize,
    fileName,
  };
}

export function buildSysExFileListRequest(page: number, nodeId: number) {
  const buffer = new Uint8Array(5);
  const view = new DataView(buffer.buffer);

  view.setUint8(0, TE_SYSEX_FILE_LIST);
  view.setUint16(1, page);
  view.setUint16(3, nodeId);

  return buffer;
}

export function parseSysExFileListResponse(data: Uint8Array) {
  const entries = [];
  let offset = 0;

  while (offset < data.byteLength) {
    const nodeId = (data[offset] << 8) | data[offset + 1];
    const flags = data[offset + 2];
    const fileSize =
      (data[offset + 3] << 24) |
      (data[offset + 4] << 16) |
      (data[offset + 5] << 8) |
      data[offset + 6];
    const fileName = parseNullTerminatedString(data, offset + 7);
    const length = 7 + fileName.length;

    entries.push({
      nodeId,
      flags,
      fileSize,
      fileName,
    });

    offset += length + 1;
  }

  return entries;
}

export function buildSysExGetFileInitRequest(
  fileId: number,
  offset: number,
  extraArgs: Uint8Array | null = null,
) {
  const length = extraArgs ? 16 + extraArgs.length : 8;
  const buffer = new Uint8Array(length);
  const view = new DataView(buffer.buffer);

  view.setUint8(0, TE_SYSEX_FILE_GET);
  view.setUint8(1, TE_SYSEX_FILE_GET_TYPE_INIT);
  view.setUint16(2, fileId);
  view.setUint32(4, offset);

  if (extraArgs != null) {
    view.setBigUint64(8, 0n);
    for (let i = 0; i < extraArgs.length; i++) {
      view.setUint8(16 + i, extraArgs[i]);
    }
  }

  return new Uint8Array(buffer);
}

export function parseSysexGetFileInitResponse(bytes: Uint8Array) {
  const fileId = (bytes[0] << 8) | bytes[1];
  const flags = bytes[2];
  const fileSize = (bytes[3] << 24) | (bytes[4] << 16) | (bytes[5] << 8) | bytes[6];
  const fileName = parseNullTerminatedString(bytes, 7);

  return {
    fileId,
    flags,
    fileSize,
    fileName,
  };
}

export function buildSysExGetFileDataRequest(page: number) {
  const buffer = new Uint8Array(4);
  const view = new DataView(buffer.buffer);

  view.setUint8(0, TE_SYSEX_FILE_GET);
  view.setUint8(1, TE_SYSEX_FILE_GET_TYPE_DATA);
  view.setUint16(2, page);

  return new Uint8Array(buffer);
}

export function parseSysExGetFileDataResponse(bytes: Uint8Array) {
  return {
    page: (bytes[0] << 8) | bytes[1],
    nextPage: ((bytes[0] << 8) | (bytes[1] + 1)) & 0xffff,
    data: bytes.subarray(2),
  };
}
