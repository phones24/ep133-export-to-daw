// This file was obtained from the original sources owned by Teenage Engineering
// and is NOT covered by the GNU Affero General Public License that applies to the rest of the project.

import {
  TE_SYSEX_FILE,
  TE_SYSEX_FILE_CAPABILITY_READ,
  TE_SYSEX_FILE_EVENT,
  TE_SYSEX_FILE_FILE_TYPE_DIR,
  TE_SYSEX_FILE_FILE_TYPE_FILE,
  TE_SYSEX_FILE_INIT_SUBSCRIBE,
  TE_SYSEX_FILE_PLAYBACK_START,
  TE_SYSEX_FILE_PLAYBACK_STOP,
} from './constants';
import { MetadataParseError, TeSysexError } from './errors';
import { FileType, FSFile, FSFolder, FSNode } from './fs';
import { MutexManager } from './mutex';
import {
  SysExFileAddedUpdatedEventMessage,
  SysExFileDeletedEventMessage,
  SysExFileDeleteRequest,
  SysExFileGetMetadataRequest,
  SysExFileGetMetadataResponse,
  SysExFileInfoRequest,
  SysExFileInitRequest,
  SysExFileInitResponse,
  SysExFileListRequest,
  SysExFileListResponse,
  SysExFileMetadataUpdatedEventMessage,
  SysExFileMovedEventMessage,
  SysExFileMoveRequest,
  SysExFileMoveResponse,
  SysExFilePlaybackRequest,
  SysExFilePutDataRequest,
  SysExFilePutInitRequest,
  SysExFilePutInitResponse,
  SysExFileSetMetadataPagedDataRequest,
  SysExFileSetMetadataPagedInitRequest,
  SysExFileSetMetadataRequest,
  SysExGetFileDataRequest,
  SysExGetFileDataResponse,
  SysExGetFileInitRequest,
  SysexFileInfoResponse,
  SysexGetFileInitResponse,
} from './sysex-protocol';
import { calculateMaxPayloadLength, crc32, sanitizeBrokenJson } from './utils';

export class SysExFileHandler {
  constructor(sysExApi, subscribeToEvents = true, timeoutMs = 5000) {
    this.deviceChunkSizes = new Map();
    this.beforeRequestHandler = null;
    this.lastFileEventCallback = new Map();
    this.afterRequestHandler = null;
    this.maxResponseLength = 4 * 1024 * 1024;
    this.flags = 0;
    this.sysExApi = sysExApi;
    this.sysExTimeoutMs = timeoutMs;
    this.mutexManager = new MutexManager();
    this.commandMutex = 'operation';

    if (subscribeToEvents) {
      this.flags |= TE_SYSEX_FILE_INIT_SUBSCRIBE;
    }
  }

  async init(serial) {
    const request = new SysExFileInitRequest(this.maxResponseLength, this.flags);
    try {
      await this.mutexManager.acquire(this.commandMutex);
      const response = await this.sendSysExFileRequest(serial, request);
      const parsed = new SysExFileInitResponse(response.data);
      this.deviceChunkSizes.set(serial, parsed.chunkSize);
    } finally {
      this.mutexManager.release(this.commandMutex);
    }
  }

  async sendSysExFileRequest(serial, request, timeoutOverride = null) {
    let response, error;
    if (this.beforeRequestHandler) {
      this.beforeRequestHandler(request);
    }
    try {
      await this.mutexManager.acquire('sysex');
      response = await this.sysExApi.sendAndReceiveTeSysexBySerial(
        serial,
        TE_SYSEX_FILE,
        request.asBytes(),
        null,
        timeoutOverride || this.sysExTimeoutMs,
      );
    } catch (err) {
      if (err instanceof TeSysexError) error = err;
      throw err;
    } finally {
      this.mutexManager.release('sysex');
      if (this.afterRequestHandler) {
        this.afterRequestHandler(request, response, error);
      }
    }
    if (!response) {
      throw new Error('could not send sysex message to device');
    }
    return response;
  }

  async *iterNodes(serial, parentId) {
    let page = 0;
    while (true) {
      let response;
      try {
        await this.mutexManager.acquire(this.commandMutex);
        const request = new SysExFileListRequest(page, parentId);
        response = await this.sendSysExFileRequest(serial, request);
      } finally {
        this.mutexManager.release(this.commandMutex);
      }

      if (response.data.byteLength <= 2) break;

      const pageNumber = ((response.data[0] << 8) | response.data[1]) & 0xffff;
      if (pageNumber !== page) {
        throw new Error(`unexpected page ${pageNumber}, expected ${page}`);
      }
      page += 1;

      const payload = response.data.slice(2);
      for (const entry of SysExFileListResponse.iter(payload)) {
        yield new FSNode(entry.nodeId, parentId, entry.fileName, entry.flags, entry.fileSize);
      }
    }
  }

  async getNode(serial, nodeId) {
    try {
      await this.mutexManager.acquire(this.commandMutex);
      const request = new SysExFileInfoRequest(nodeId);
      const response = await this.sendSysExFileRequest(serial, request);
      const parsed = new SysexFileInfoResponse(response.data);
      return new FSNode(
        parsed.nodeId,
        parsed.parentId,
        parsed.fileName,
        parsed.flags,
        parsed.fileSize,
      );
    } finally {
      this.mutexManager.release(this.commandMutex);
    }
  }

  async tree(serial, parentId = 0) {
    const rootFolder = new FSFolder(parentId, -1, '', -1, '');
    return await this.list(serial, rootFolder);
  }

  async list(serial, folder) {
    for await (const node of this.iterNodes(serial, folder.id)) {
      const path = [folder.path, node.name].join('/');
      if (node.type === FileType.File) {
        folder.addChild(new FSFile(node.id, node.parentId, node.name, node.flags, node.size, path));
      } else {
        const subFolder = new FSFolder(node.id, node.parentId, node.name, node.flags, path);
        await this.list(serial, subFolder);
        folder.children.push(subFolder);
      }
    }
    return folder;
  }

  async put(
    serial,
    fileData,
    parentId,
    name,
    flags = 0,
    metadata = null,
    progressCallback = null,
    isDirectory = false,
    capabilities = [TE_SYSEX_FILE_CAPABILITY_READ],
    timeoutOverride = null,
  ) {
    try {
      await this.mutexManager.acquire(this.commandMutex);
      const fileSize = fileData.byteLength;
      const chunkSize = this.deviceChunkSizes.get(serial);
      if (!chunkSize) return;

      let capabilityFlags = capabilities.reduce((acc, cap) => acc | cap, 0);
      capabilityFlags |= isDirectory ? TE_SYSEX_FILE_FILE_TYPE_DIR : TE_SYSEX_FILE_FILE_TYPE_FILE;

      const initRequest = new SysExFilePutInitRequest(
        flags,
        name,
        capabilityFlags,
        fileSize,
        parentId,
        metadata != null ? JSON.stringify(metadata) : null,
      );
      const initResponseRaw = await this.sendSysExFileRequest(serial, initRequest, timeoutOverride);
      const initResponse = new SysExFilePutInitResponse(initResponseRaw.data);

      const status = { fileId: initResponse.fileId, status: 'sending' };
      progressCallback?.(0, fileSize, status);

      let bytesSent = 0;
      let pageIndex = 0;
      const maxPayload = calculateMaxPayloadLength(chunkSize - 6, true);

      while (bytesSent < fileSize) {
        const chunkLen = Math.min(maxPayload, fileSize - bytesSent);
        const chunk = new Uint8Array(fileData.slice(bytesSent, bytesSent + maxPayload));
        const chunkRequest = new SysExFilePutDataRequest(pageIndex, chunk);
        await this.sendSysExFileRequest(serial, chunkRequest, timeoutOverride);

        bytesSent += chunkLen;
        progressCallback?.(bytesSent, fileSize, status);
        pageIndex += 1;
      }

      const finalRequest = new SysExFilePutDataRequest(pageIndex, new Uint8Array(0));
      await this.sendSysExFileRequest(serial, finalRequest, timeoutOverride);
      return initResponse.fileId;
    } finally {
      this.mutexManager.release(this.commandMutex);
    }
  }

  async setMetadata(serial, nodeId, metadata) {
    try {
      await this.mutexManager.acquire(this.commandMutex);
      const chunkSize = this.deviceChunkSizes.get(serial);
      if (!chunkSize) return;

      const headerSize = 8;
      const metadataStr = JSON.stringify(metadata);

      if (metadataStr.length <= chunkSize - headerSize) {
        const request = new SysExFileSetMetadataRequest(nodeId, metadataStr);
        await this.sendSysExFileRequest(serial, request);
        return;
      }

      const encoded = new TextEncoder().encode(metadataStr);
      const totalLength = encoded.byteLength;
      const initRequest = new SysExFileSetMetadataPagedInitRequest(nodeId, totalLength);
      await this.sendSysExFileRequest(serial, initRequest);

      let bytesSent = 0;
      let pageIndex = 0;
      const maxPayload = calculateMaxPayloadLength(chunkSize - headerSize, true);

      while (bytesSent < totalLength) {
        const chunkLen = Math.min(maxPayload, totalLength - bytesSent);
        const chunk = new Uint8Array(encoded.slice(bytesSent, bytesSent + maxPayload));
        const chunkRequest = new SysExFileSetMetadataPagedDataRequest(pageIndex, chunk);
        await this.sendSysExFileRequest(serial, chunkRequest);

        bytesSent += chunkLen;
        pageIndex += 1;
      }

      const finalRequest = new SysExFileSetMetadataPagedDataRequest(pageIndex, new Uint8Array(0));
      await this.sendSysExFileRequest(serial, finalRequest);
    } finally {
      this.mutexManager.release(this.commandMutex);
    }
  }

  async getMetadata(serial, nodeId, pages = null) {
    try {
      await this.mutexManager.acquire(this.commandMutex);
      const result = {};
      for (const pageSelector of pages || [null]) {
        let metadataStr = '';
        let page = 0;
        while (true) {
          const request = new SysExFileGetMetadataRequest(nodeId, page, pageSelector);
          const response = await this.sendSysExFileRequest(serial, request);
          if (response.data.byteLength <= 2) break;

          const parsed = new SysExFileGetMetadataResponse(response.data);
          if (parsed.page !== page) {
            throw new Error(`unexpected page ${parsed.page}, expected ${page}`);
          }
          page += 1;
          metadataStr += parsed.metadata;
          if (response.data.slice(-1)[0] === 0) break;
        }
        try {
          Object.assign(result, JSON.parse(sanitizeBrokenJson(metadataStr)));
        } catch (err) {
          throw new MetadataParseError(`could not parse ${metadataStr}: ${err.message}`);
        }
      }
      return result;
    } finally {
      this.mutexManager.release(this.commandMutex);
    }
  }

  async *iterGet(serial, nodeId, progressCallback = null, options = null, offset = 0) {
    try {
      await this.mutexManager.acquire(this.commandMutex);
      const initRequest = new SysExGetFileInitRequest(nodeId, offset, options);
      const initResponseRaw = await this.sendSysExFileRequest(serial, initRequest);
      const initResponse = new SysexGetFileInitResponse(initResponseRaw.data);

      let bytesRead = 0;
      let pageIndex = 0;
      const totalRemaining = initResponse.fileSize - offset;

      while (bytesRead < totalRemaining) {
        const chunkRequest = new SysExGetFileDataRequest(pageIndex);
        const chunkResponseRaw = await this.sendSysExFileRequest(serial, chunkRequest);
        const chunkResponse = new SysExGetFileDataResponse(chunkResponseRaw.data);

        if (chunkResponse.page !== pageIndex) {
          throw new Error(`unexpected page ${chunkResponse.page}, expected ${pageIndex}`);
        }
        if (chunkResponse.data.byteLength === 0) break;

        yield {
          name: initResponse.fileName,
          size: initResponse.fileSize,
          data: chunkResponse.data,
          crc32: crc32(chunkResponse.data),
        };

        bytesRead += chunkResponse.data.byteLength;
        progressCallback?.(bytesRead, totalRemaining);
        pageIndex = chunkResponse.nextPage;
      }
    } finally {
      this.mutexManager.release(this.commandMutex);
    }
  }

  async get(serial, nodeId, progressCallback = null, options = null, offset = 0) {
    const chunks = [];
    let fileName = '';
    let fileSize = 0;
    let crc = 0;

    for await (const chunk of this.iterGet(serial, nodeId, progressCallback, options, offset)) {
      chunks.push(chunk.data);
      fileSize = chunk.size;
      fileName = chunk.name;
      crc = crc32(chunk.data, chunk.crc32);
    }

    return { name: fileName, size: fileSize, data: chunks, crc32: crc };
  }

  async delete(serial, nodeId) {
    try {
      await this.mutexManager.acquire(this.commandMutex);
      const request = new SysExFileDeleteRequest(nodeId);
      await this.sendSysExFileRequest(serial, request);
    } finally {
      this.mutexManager.release(this.commandMutex);
    }
  }

  async playback(serial, nodeId, action, offset, duration) {
    try {
      await this.mutexManager.acquire(this.commandMutex);
      const request = new SysExFilePlaybackRequest(nodeId, action, offset, duration);
      await this.sendSysExFileRequest(serial, request);
    } finally {
      this.mutexManager.release(this.commandMutex);
    }
  }

  async startPlayback(serial, nodeId, offset = 0, duration = 0) {
    await this.playback(serial, nodeId, TE_SYSEX_FILE_PLAYBACK_START, offset, duration);
  }

  async stopPlayback(serial, nodeId, offset = 0) {
    await this.playback(serial, nodeId, TE_SYSEX_FILE_PLAYBACK_STOP, offset, 0);
  }

  async move(serial, sourceNodeId, targetNodeId, flags = 0) {
    try {
      await this.mutexManager.acquire(this.commandMutex);
      const request = new SysExFileMoveRequest(sourceNodeId, targetNodeId, flags);
      const response = await this.sendSysExFileRequest(serial, request);
      return new SysExFileMoveResponse(response.data);
    } finally {
      this.mutexManager.release(this.commandMutex);
    }
  }

  onBeforeRequest(callback) {
    this.beforeRequestHandler = callback;
  }

  onAfterRequest(callback) {
    this.afterRequestHandler = callback;
  }

  onFileEvent(serial, callback) {
    const listener = (event) => {
      const detail = event.detail;
      if (!('command' in detail) || detail.command !== TE_SYSEX_FILE || detail.data.length === 0)
        return;

      const eventType = detail.data[0];
      const eventClass = {
        [TE_SYSEX_FILE_EVENT.FILE_ADDED]: SysExFileAddedUpdatedEventMessage,
        [TE_SYSEX_FILE_EVENT.FILE_UPDATED]: SysExFileAddedUpdatedEventMessage,
        [TE_SYSEX_FILE_EVENT.FILE_DELETED]: SysExFileDeletedEventMessage,
        [TE_SYSEX_FILE_EVENT.METADATA_UPDATED]: SysExFileMetadataUpdatedEventMessage,
        [TE_SYSEX_FILE_EVENT.FILE_MOVED]: SysExFileMovedEventMessage,
      }[eventType];

      if (!eventClass) return;
      const parsedEvent = new eventClass(detail.data.slice(1));
      callback?.(eventType, parsedEvent);
    };

    if (!callback) {
      const prevListener = this.lastFileEventCallback.get(serial);
      if (prevListener) {
        this.sysExApi.removeMidiEventListener(serial, prevListener);
      }
    } else {
      this.lastFileEventCallback.set(serial, listener);
      this.sysExApi.addMidiEventListener(serial, listener);
    }
  }
}
