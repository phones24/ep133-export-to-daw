import {
  TE_SYSEX_FILE_DELETE,
  TE_SYSEX_FILE_GET,
  TE_SYSEX_FILE_GET_TYPE_DATA,
  TE_SYSEX_FILE_GET_TYPE_INIT,
  TE_SYSEX_FILE_INFO,
  TE_SYSEX_FILE_INIT,
  TE_SYSEX_FILE_LIST,
  TE_SYSEX_FILE_METADATA,
  TE_SYSEX_FILE_METADATA_GET,
  TE_SYSEX_FILE_METADATA_SET,
  TE_SYSEX_FILE_METADATA_SET_PAGED,
  TE_SYSEX_FILE_METADATA_SET_PAGED_TYPE_DATA,
  TE_SYSEX_FILE_METADATA_SET_PAGED_TYPE_INIT,
  TE_SYSEX_FILE_MOVED,
  TE_SYSEX_FILE_PLAYBACK,
  TE_SYSEX_FILE_PUT,
  TE_SYSEX_FILE_PUT_TYPE_DATA,
  TE_SYSEX_FILE_PUT_TYPE_INIT,
} from './constants';

function parseNullTerminatedString(buffer, startIndex) {
  let endIndex = startIndex;
  while (endIndex < buffer.length && buffer[endIndex] !== 0) {
    endIndex++;
  }
  return new TextDecoder().decode(buffer.subarray(startIndex, endIndex));
}

function writeStringToView(dataView, offset, str, nullTerminate = false) {
  let pos = offset;
  for (let i = 0; i < str.length; i++) {
    dataView.setUint8(pos++, str.charCodeAt(i));
  }
  if (nullTerminate && pos > 0) {
    dataView.setUint8(pos++, 0);
  }
  return pos;
}

export class SysExGetFileInitRequest {
  constructor(fileId, offset, extraArgs = null) {
    this.fileId = fileId;
    this.offset = offset;
    this.extraArgs = extraArgs;
  }

  asBytes() {
    // Allocate buffer: 8 bytes minimum, 16 + extraArgs.length if extraArgs exist
    const length = this.extraArgs ? 16 + this.extraArgs.length : 8;
    const buffer = new Uint8Array(length);
    const view = new DataView(buffer.buffer);

    // Standard SysEx headers
    view.setUint8(0, TE_SYSEX_FILE_GET);
    view.setUint8(1, TE_SYSEX_FILE_GET_TYPE_INIT);

    // File ID and offset
    view.setUint16(2, this.fileId);
    view.setUint32(4, this.offset);

    // If extra arguments exist, reserve 8 bytes zero and append them
    if (this.extraArgs != null) {
      view.setBigUint64(8, 0n); // Reserved
      for (let i = 0; i < this.extraArgs.length; i++) {
        view.setUint8(16 + i, this.extraArgs[i]);
      }
    }

    return new Uint8Array(buffer);
  }
}

export class SysexGetFileInitResponse {
  constructor(bytes) {
    this.fileId = (bytes[0] << 8) | bytes[1];
    this.flags = bytes[2];
    this.fileSize = (bytes[3] << 24) | (bytes[4] << 16) | (bytes[5] << 8) | bytes[6];
    this.fileName = parseNullTerminatedString(bytes, 7);
  }
}

export class SysExGetFileDataRequest {
  constructor(page) {
    this.page = page;
  }

  asBytes() {
    const buffer = new Uint8Array(4);
    const view = new DataView(buffer.buffer);

    view.setUint8(0, TE_SYSEX_FILE_GET);
    view.setUint8(1, TE_SYSEX_FILE_GET_TYPE_DATA);
    view.setUint16(2, this.page);

    return new Uint8Array(buffer);
  }
}

export class SysExGetFileDataResponse {
  constructor(bytes) {
    this.page = (bytes[0] << 8) | bytes[1];
    this.nextPage = (this.page + 1) & 0xffff;
    this.data = bytes.subarray(2);
  }
}

// Request to initialize SysEx file communication
export class SysExFileInitRequest {
  constructor(maxResponseLength, flags) {
    this.maxResponseLength = maxResponseLength;
    this.flags = flags;
  }

  asBytes() {
    const buffer = new Uint8Array(6);
    const view = new DataView(buffer.buffer);
    view.setUint8(0, TE_SYSEX_FILE_INIT);
    view.setUint8(1, this.flags);
    view.setUint32(2, this.maxResponseLength);
    return new Uint8Array(buffer);
  }
}

// Response to SysEx file init
export class SysExFileInitResponse {
  constructor(data) {
    this.chunkSize = (data[1] << 24) | (data[2] << 16) | (data[3] << 8) | data[4];
  }
}

// Request to start uploading a file
export class SysExFilePutInitRequest {
  constructor(fileId, parentId, flags, fileSize, filename, metadata = null) {
    this.fileId = fileId;
    this.parentId = parentId;
    this.flags = flags;
    this.fileSize = fileSize;
    this.filename = filename.slice(0, 54); // limit filename length
    this.metadata = metadata;
  }

  asBytes() {
    const baseLength = 11 + (this.filename.length + 1);
    const buffer = new Uint8Array(baseLength);
    const view = new DataView(buffer.buffer);

    view.setUint8(0, TE_SYSEX_FILE_PUT);
    view.setUint8(1, TE_SYSEX_FILE_PUT_TYPE_INIT);
    view.setUint8(2, this.flags);
    view.setUint16(3, this.fileId);
    view.setUint16(5, this.parentId);
    view.setUint32(7, this.fileSize);
    writeStringToView(view, 11, this.filename, true);

    let metadataBytes = new Uint8Array(0);
    if (this.metadata != null) {
      metadataBytes = new Uint8Array(this.metadata.length);
      const metaView = new DataView(metadataBytes.buffer);
      writeStringToView(metaView, 0, this.metadata, true);
    }

    return new Uint8Array([...buffer, ...metadataBytes]);
  }
}

// Response after file upload initialization
export class SysExFilePutInitResponse {
  constructor(data) {
    this.fileId = (data[0] << 8) | data[1];
  }
}

// Request to upload file data chunk
export class SysExFilePutDataRequest {
  constructor(page, data) {
    this.page = page;
    this.data = data;
  }

  asBytes() {
    const buffer = new Uint8Array(4 + this.data.byteLength);
    const view = new DataView(buffer.buffer);

    view.setUint8(0, TE_SYSEX_FILE_PUT);
    view.setUint8(1, TE_SYSEX_FILE_PUT_TYPE_DATA);
    view.setUint16(2, this.page);

    for (let i = 0; i < this.data.byteLength; i++) {
      view.setUint8(4 + i, this.data[i]);
    }

    return buffer;
  }
}

// Request to list files
export class SysExFileListRequest {
  constructor(page, nodeId) {
    this.page = page;
    this.nodeId = nodeId;
  }

  asBytes() {
    const buffer = new Uint8Array(5);
    const view = new DataView(buffer.buffer);

    view.setUint8(0, TE_SYSEX_FILE_LIST);
    view.setUint16(1, this.page);
    view.setUint16(3, this.nodeId);

    return buffer;
  }
}

// Response containing file list info
export class SysExFileListResponse {
  constructor(data) {
    this.nodeId = (data[0] << 8) | data[1];
    this.flags = data[2];
    this.fileSize = (data[3] << 24) | (data[4] << 16) | (data[5] << 8) | data[6];
    this.fileName = parseNullTerminatedString(data, 7);
    this.length = 7 + this.fileName.length;
  }

  static *iter(data) {
    let offset = 0;
    while (offset < data.byteLength) {
      const entry = new SysExFileListResponse(data.slice(offset));
      yield entry;
      offset += entry.length + 1;
    }
  }
}

// Request to delete a file
export class SysExFileDeleteRequest {
  constructor(fileId) {
    this.fileId = fileId;
  }

  asBytes() {
    const buffer = new Uint8Array(3);
    const view = new DataView(buffer.buffer);

    view.setUint8(0, TE_SYSEX_FILE_DELETE);
    view.setUint16(1, this.fileId);

    return buffer;
  }
}

// Request to set metadata for a file
export class SysExFileSetMetadataRequest {
  constructor(fileId, metadata) {
    this.fileId = fileId;
    this.metadata = metadata;
  }

  asBytes() {
    const buffer = new Uint8Array(4 + this.metadata.length + 1);
    const view = new DataView(buffer.buffer);

    view.setUint8(0, TE_SYSEX_FILE_METADATA);
    view.setUint8(1, TE_SYSEX_FILE_METADATA_SET);
    view.setUint16(2, this.fileId);
    writeStringToView(view, 4, this.metadata, true);

    return new Uint8Array(buffer);
  }
}

// Request to get metadata for a file
export class SysExFileGetMetadataRequest {
  constructor(fileId, page, key = null) {
    this.fileId = fileId;
    this.page = page;
    this.key = key;
  }

  asBytes() {
    const extraLength = this.key && this.key.length ? this.key.length + 1 : 0;
    const buffer = new Uint8Array(6 + extraLength);
    const view = new DataView(buffer.buffer);

    view.setUint8(0, TE_SYSEX_FILE_METADATA);
    view.setUint8(1, TE_SYSEX_FILE_METADATA_GET);
    view.setUint16(2, this.fileId);
    view.setUint16(4, this.page);

    if (this.key != null) {
      writeStringToView(view, 6, this.key, true);
    }

    return new Uint8Array(buffer);
  }
}

// Response with file metadata
export class SysExFileGetMetadataResponse {
  constructor(data) {
    this.page = (data[0] << 8) | data[1];
    this.metadata = parseNullTerminatedString(data, 2);
  }
}

// Request to control file playback
export class SysExFilePlaybackRequest {
  constructor(fileId, action, offset, length) {
    this.fileId = fileId;
    this.action = action;
    this.offset = offset;
    this.length = length;
  }

  asBytes() {
    const buffer = new Uint8Array(12);
    const view = new DataView(buffer.buffer);

    view.setUint8(0, TE_SYSEX_FILE_PLAYBACK);
    view.setUint8(1, this.action);
    view.setUint16(2, this.fileId);
    view.setUint32(4, this.offset);
    view.setUint32(8, this.length);

    return new Uint8Array(buffer);
  }
}

// Request for file info
export class SysExFileInfoRequest {
  constructor(fileId) {
    this.fileId = fileId;
  }

  asBytes() {
    const buffer = new Uint8Array(3);
    const view = new DataView(buffer.buffer);

    view.setUint8(0, TE_SYSEX_FILE_INFO);
    view.setUint16(1, this.fileId);

    return new Uint8Array(buffer);
  }
}

// Response with file info
export class SysexFileInfoResponse {
  constructor(data) {
    this.nodeId = (data[0] << 8) | data[1];
    this.parentId = (data[2] << 8) | data[3];
    this.flags = data[4];
    this.fileSize = (data[5] << 24) | (data[6] << 16) | (data[7] << 8) | data[8];
    this.fileName = parseNullTerminatedString(data, 9);
  }
}

// Event: File added or updated
export class SysExFileAddedUpdatedEventMessage {
  constructor(data) {
    this.nodeId = (data[0] << 8) | data[1];
    this.fileSize = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
    this.name = parseNullTerminatedString(data, 8);
  }
}

// Event: File deleted
export class SysExFileDeletedEventMessage {
  constructor(data) {
    this.nodeId = (data[0] << 8) | data[1];
  }
}

// Event: File metadata updated
export class SysExFileMetadataUpdatedEventMessage {
  constructor(data) {
    this.nodeId = (data[0] << 8) | data[1];
    this.metadata = JSON.parse(parseNullTerminatedString(data, 2));
  }
}

// Event: File moved
export class SysExFileMovedEventMessage {
  constructor(data) {
    this.oldNodeId = (data[0] << 8) | data[1];
    this.parentId = (data[2] << 8) | data[3];
    this.nodeId = (data[4] << 8) | data[5];
  }
}

// Request to move a file
export class SysExFileMoveRequest {
  constructor(fileId, parentId, newFileId) {
    this.fileId = fileId;
    this.parentId = parentId;
    this.newFileId = newFileId;
  }

  asBytes() {
    const buffer = new Uint8Array(7);
    const view = new DataView(buffer.buffer);

    view.setUint8(0, TE_SYSEX_FILE_MOVED);
    view.setUint16(1, this.fileId);
    view.setUint16(3, this.parentId);
    view.setUint16(5, this.newFileId);

    return new Uint8Array(buffer);
  }
}

// Response after moving a file
export class SysExFileMoveResponse {
  constructor(data) {
    this.oldFileId = (data[0] << 8) | data[1];
    this.parentId = (data[2] << 8) | data[3];
    this.newFileId = (data[4] << 8) | data[5];
  }
}

// Request to init paged metadata setting
export class SysExFileSetMetadataPagedInitRequest {
  constructor(fileId, size) {
    this.fileId = fileId;
    this.size = size;
  }

  asBytes() {
    const buffer = new Uint8Array(9);
    const view = new DataView(buffer.buffer);

    view.setUint8(0, TE_SYSEX_FILE_METADATA);
    view.setUint8(1, TE_SYSEX_FILE_METADATA_SET_PAGED);
    view.setUint8(2, TE_SYSEX_FILE_METADATA_SET_PAGED_TYPE_INIT);
    view.setUint16(3, this.fileId);
    view.setUint32(5, this.size);

    return buffer;
  }
}

// Request to send paged metadata data
export class SysExFileSetMetadataPagedDataRequest {
  constructor(page, data) {
    this.page = page;
    this.data = data;
  }

  asBytes() {
    const buffer = new Uint8Array(5 + this.data.byteLength);
    const view = new DataView(buffer.buffer);

    view.setUint8(0, TE_SYSEX_FILE_METADATA);
    view.setUint8(1, TE_SYSEX_FILE_METADATA_SET_PAGED);
    view.setUint8(2, TE_SYSEX_FILE_METADATA_SET_PAGED_TYPE_DATA);
    view.setUint16(3, this.page);

    for (let i = 0; i < this.data.byteLength; i++) {
      view.setUint8(5 + i, this.data[i]);
    }

    return buffer;
  }
}
