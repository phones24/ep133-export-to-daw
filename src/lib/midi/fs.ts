import { TE_SYSEX_FILE, TE_SYSEX_FILE_FILE_TYPE_FILE } from './constants';
import { sendSysexToDevice } from './device';
import {
  buildSysExFileGetMetadataRequest,
  buildSysExFileInitRequest,
  buildSysExFileListRequest,
  buildSysExGetFileDataRequest,
  buildSysExGetFileInitRequest,
  parseGetMetadataResponse,
  parseSysExFileListResponse,
  parseSysExGetFileDataResponse,
  parseSysexGetFileInitResponse,
} from './fsSysex';
import { TEFileListEntry, TEGetFileResponse } from './types';
import { sanitizeBrokenJson } from './utils';

export async function getFile(
  nodeId: number,
  progressCallback?: (bytesRead: number, totalBytes: number) => void,
): Promise<TEGetFileResponse> {
  const offset = 0;
  const options = null;
  const chunks = [];
  let bytesRead = 0;
  let pageIndex = 0;

  const initResponseRaw = await sendSysexToDevice(
    TE_SYSEX_FILE,
    buildSysExGetFileInitRequest(nodeId, offset, options),
  );

  if (!initResponseRaw) {
    throw new Error('Failed to get file init response from device');
  }

  const initResponse = parseSysexGetFileInitResponse(initResponseRaw.rawData);
  const totalRemaining = initResponse.fileSize - offset;

  while (bytesRead < totalRemaining) {
    const chunkResponseRaw = await sendSysexToDevice(
      TE_SYSEX_FILE,
      buildSysExGetFileDataRequest(pageIndex),
    );

    if (!chunkResponseRaw) {
      throw new Error('Failed to get file data response from device');
    }

    const chunkResponse = parseSysExGetFileDataResponse(chunkResponseRaw.rawData);

    if (chunkResponse.page !== pageIndex) {
      throw new Error(`Unexpected page number ${chunkResponse.page}, expected ${pageIndex}`);
    }

    if (chunkResponse.data.byteLength === 0) {
      break;
    }

    chunks.push(chunkResponse.data);

    bytesRead += chunkResponse.data.byteLength;
    progressCallback?.(bytesRead, totalRemaining);
    pageIndex = chunkResponse.nextPage;
  }

  return { name: initResponse.fileName, size: initResponse.fileSize, data: chunks };
}

export async function getFileList(
  nodeId: number = 0,
  filesList: TEFileListEntry[] = [],
  path = '/',
): Promise<TEFileListEntry[]> {
  let page = 0;

  await sendSysexToDevice(TE_SYSEX_FILE, buildSysExFileInitRequest(4 * 1024 * 1024, 0));

  while (true) {
    const fileListRequest = buildSysExFileListRequest(page, nodeId);
    const fileListResponse = await sendSysexToDevice(TE_SYSEX_FILE, fileListRequest);

    if (!fileListResponse || !fileListResponse.rawData || fileListResponse.rawData.length < 2) {
      break;
    }

    const pageNumber = ((fileListResponse.rawData[0] << 8) | fileListResponse.rawData[1]) & 0xffff;
    if (pageNumber !== page) {
      throw new Error(`Unexpected page ${pageNumber}, expected ${page}`);
    }

    page += 1;

    const payload = fileListResponse?.rawData.slice(2);
    const list = parseSysExFileListResponse(payload);

    if (list.length === 0) {
      break;
    }

    for await (const entry of list) {
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

export async function getFileMetadata<T extends Record<string, any>>(nodeId: number, pages = null) {
  const result: T = {} as T;

  for (const pageSelector of pages || [null]) {
    let metadataStr = '';
    let page = 0;

    while (true) {
      const response = await sendSysexToDevice(
        TE_SYSEX_FILE,
        buildSysExFileGetMetadataRequest(nodeId, page, pageSelector),
      );

      if (!response || response?.rawData.byteLength <= 2) {
        break;
      }

      const parsed = parseGetMetadataResponse(response.rawData);

      if (parsed.page !== page) {
        throw new Error(`unexpected page ${parsed.page}, expected ${page}`);
      }

      page += 1;
      metadataStr += parsed.metadata;

      if (response.rawData.slice(-1)[0] === 0) {
        break;
      }
    }

    try {
      Object.assign(result, JSON.parse(sanitizeBrokenJson(metadataStr)));
    } catch (err) {
      throw new Error(`Could not parse ${metadataStr}: ${(err as Error).message}`);
    }
  }
  return result;
}
