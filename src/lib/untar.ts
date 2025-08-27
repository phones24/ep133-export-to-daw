class UntarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UntarError';
  }
}

interface TarHeader {
  name: string;
  mode: number;
  uid: number;
  gid: number;
  size: number;
  mtime: number;
  checksum: number;
  type: string;
  linkname: string;
  magic: string;
  version: string;
  uname: string;
  gname: string;
  devmajor: number;
  devminor: number;
  prefix: string;
  fullName: string;
}

export class TarFile {
  name: string;
  size: number;
  data: Uint8Array | null;
  type: string;
  mode: number;
  uid: number;
  gid: number;
  mtime: Date;
  linkname: string;
  uname: string;
  gname: string;

  constructor(name: string, size: number, data: Uint8Array | null, type: string = 'file') {
    this.name = name;
    this.size = size;
    this.data = data;
    this.type = type;
    this.mode = 0;
    this.uid = 0;
    this.gid = 0;
    this.mtime = new Date();
    this.linkname = '';
    this.uname = '';
    this.gname = '';
  }
}

function parseTarHeader(buffer: ArrayBuffer, offset: number): TarHeader | null {
  const view = new Uint8Array(buffer, offset, 512);

  if (view.every((byte) => byte === 0)) {
    return null;
  }

  function readString(start: number, length: number): string {
    let str = '';
    for (let i = start; i < start + length && view[i] !== 0; i++) {
      str += String.fromCharCode(view[i]);
    }
    return str;
  }

  function readOctal(start: number, length: number): number {
    const str = readString(start, length).trim();
    return str ? parseInt(str, 8) : 0;
  }

  const header: TarHeader = {
    name: readString(0, 100),
    mode: readOctal(100, 8),
    uid: readOctal(108, 8),
    gid: readOctal(116, 8),
    size: readOctal(124, 12),
    mtime: readOctal(136, 12),
    checksum: readOctal(148, 8),
    type: String.fromCharCode(view[156]) || '0',
    linkname: readString(157, 100),
    magic: readString(257, 6),
    version: readString(263, 2),
    uname: readString(265, 32),
    gname: readString(297, 32),
    devmajor: readOctal(329, 8),
    devminor: readOctal(337, 8),
    prefix: readString(345, 155),
    fullName: '',
  };

  let fullName = header.name;
  if (header.prefix) {
    fullName = `${header.prefix}/${header.name}`;
  }
  header.fullName = fullName;

  return header;
}

function validateChecksum(buffer: ArrayBuffer, offset: number, expectedChecksum: number): boolean {
  const view = new Uint8Array(buffer, offset, 512);
  let sum = 0;

  for (let i = 0; i < 512; i++) {
    if (i >= 148 && i < 156) {
      sum += 32;
    } else {
      sum += view[i];
    }
  }

  return sum === expectedChecksum;
}

export async function untar(file: File): Promise<TarFile[]> {
  if (!(file instanceof File)) {
    throw new UntarError('Input must be a File object');
  }

  const buffer = await file.arrayBuffer();
  const files: TarFile[] = [];
  let offset = 0;

  while (offset < buffer.byteLength) {
    const header = parseTarHeader(buffer, offset);

    if (!header) {
      break;
    }

    if (header.checksum > 0) {
      if (!validateChecksum(buffer, offset, header.checksum)) {
        throw new UntarError(`Invalid checksum for file: ${header.fullName}`);
      }
    }

    offset += 512;

    let fileData: Uint8Array | null = null;
    if (header.size > 0) {
      fileData = new Uint8Array(buffer, offset, header.size);
    }

    let fileType = 'file';
    switch (header.type) {
      case '0':
      case '\0':
        fileType = 'file';
        break;
      case '1':
        fileType = 'hard-link';
        break;
      case '2':
        fileType = 'symbolic-link';
        break;
      case '3':
        fileType = 'character-device';
        break;
      case '4':
        fileType = 'block-device';
        break;
      case '5':
        fileType = 'directory';
        break;
      case '6':
        fileType = 'fifo';
        break;
      case '7':
        fileType = 'contiguous-file';
        break;
      default:
        fileType = 'unknown';
    }

    const tarFile = new TarFile(header.fullName, header.size, fileData, fileType);

    tarFile.mode = header.mode;
    tarFile.uid = header.uid;
    tarFile.gid = header.gid;
    tarFile.mtime = new Date(header.mtime * 1000);
    tarFile.linkname = header.linkname;
    tarFile.uname = header.uname;
    tarFile.gname = header.gname;

    files.push(tarFile);

    const paddedSize = Math.ceil(header.size / 512) * 512;
    offset += paddedSize;
  }

  return files;
}

export function arrayBufferToText(data: Uint8Array, encoding: string = 'utf-8'): string {
  const decoder = new TextDecoder(encoding);
  return decoder.decode(data);
}

export function createBlobUrl(
  tarFile: TarFile,
  mimeType: string = 'application/octet-stream',
): string {
  if (!tarFile.data) {
    throw new Error('Tar file data is null');
  }
  const blob = new Blob([new Uint8Array(tarFile.data)], { type: mimeType });
  return URL.createObjectURL(blob);
}
