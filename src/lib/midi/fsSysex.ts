import {
  TE_SYSEX_FILE_GET,
  TE_SYSEX_FILE_GET_TYPE_DATA,
  TE_SYSEX_FILE_GET_TYPE_INIT,
  TE_SYSEX_FILE_INFO,
  TE_SYSEX_FILE_INIT,
  TE_SYSEX_FILE_LIST,
  TE_SYSEX_FILE_METADATA,
  TE_SYSEX_FILE_METADATA_GET,
} from './constants';
import { parseNullTerminatedString, writeStringToView } from './utils';

export function buildSysExFileInitRequest(maxResponseLength: number, flags: number) {
  const buffer = new Uint8Array(6);
  const view = new DataView(buffer.buffer);

  view.setUint8(0, TE_SYSEX_FILE_INIT);
  view.setUint8(1, flags);
  view.setUint32(2, maxResponseLength);

  return buffer;
}

export function buildSysExFileInfoRequest(fileId: number) {
  const buffer = new Uint8Array(3);
  const view = new DataView(buffer.buffer);

  view.setUint8(0, TE_SYSEX_FILE_INFO);
  view.setUint16(1, fileId);

  return buffer;
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

  return buffer;
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

export function buildSysExFileGetMetadataRequest(
  fileId: number,
  page: number,
  key: string | null = null,
) {
  const extraLength = key?.length ? key.length + 1 : 0;
  const buffer = new Uint8Array(6 + extraLength);
  const view = new DataView(buffer.buffer);

  view.setUint8(0, TE_SYSEX_FILE_METADATA);
  view.setUint8(1, TE_SYSEX_FILE_METADATA_GET);
  view.setUint16(2, fileId);
  view.setUint16(4, page);

  if (key != null) {
    writeStringToView(view, 6, key, true);
  }

  return buffer;
}

export function parseGetMetadataResponse(data: Uint8Array) {
  const page = (data[0] << 8) | data[1];
  const metadata = parseNullTerminatedString(data, 2);

  return { page, metadata };
}
