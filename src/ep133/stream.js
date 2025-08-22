const ERR_ITERATOR_COMPLETED_TOO_SOON = 'Writer iterator completed too soon';
const HTTP_HEADER_CONTENT_TYPE = 'Content-Type';
const DEFAULT_CHUNK_SIZE = 64 * 1024;
const PROPERTY_NAME_WRITABLE = 'writable';

export class Stream {
  constructor() {
    this.size = 0;
    this.initialized = false;
  }

  init() {
    this.initialized = true;
  }
}

export class Reader extends Stream {
  get readable() {
    const self = this;
    const chunkSize = self.chunkSize ?? DEFAULT_CHUNK_SIZE;

    return new ReadableStream({
      start() {
        this.chunkOffset = 0;
      },
      async pull(controller) {
        const { offset = 0, size, diskNumberStart } = self;
        const { chunkOffset } = this;

        const chunk = await readUint8Array(
          self,
          offset + chunkOffset,
          Math.min(chunkSize, size - chunkOffset),
          diskNumberStart,
        );
        controller.enqueue(chunk);
        this.chunkOffset += chunkSize;

        if (chunkOffset + chunkSize >= size) {
          controller.close();
        }
      },
    });
  }
}

export class BlobReader extends Reader {
  constructor(blob) {
    super();
    this.blob = blob;
    this.size = blob.size;
  }

  async readUint8Array(offset, length) {
    const end = offset + length;
    let buffer = await (offset || end < this.size
      ? this.blob.slice(offset, end)
      : this.blob
    ).arrayBuffer();

    if (buffer.byteLength > length) buffer = buffer.slice(offset, end);
    return new Uint8Array(buffer);
  }
}

export class BlobWriter extends Stream {
  constructor(contentType) {
    super();
    const transformStream = new TransformStream();
    const headers = contentType ? [[HTTP_HEADER_CONTENT_TYPE, contentType]] : [];

    Object.defineProperty(this, PROPERTY_NAME_WRITABLE, {
      get: () => transformStream.writable,
    });
    this.blob = new Response(transformStream.readable, { headers }).blob();
  }

  getData() {
    return this.blob;
  }
}

export class SplitDataReader extends Reader {
  constructor(readers) {
    super();
    this.readers = readers;
    this.lastDiskNumber = 0;
    this.lastDiskOffset = 0;
  }

  async init() {
    let offset = 0;
    for (const reader of this.readers) {
      await reader.init();
      this.lastDiskOffset = offset;
      offset += reader.size;
      this.size += reader.size;
    }
    super.init();
  }

  async readUint8Array(offset, length, readerIndex = 0) {
    const readers = this.readers;
    let idx = readerIndex === -1 ? readers.length - 1 : readerIndex;
    let localOffset = offset;
    let result;

    // Find the correct reader
    while (localOffset >= readers[idx].size) {
      localOffset -= readers[idx].size;
      idx++;
    }

    const reader = readers[idx];
    if (localOffset + length <= reader.size) {
      result = await readUint8Array(reader, localOffset, length);
    } else {
      const partLength = reader.size - localOffset;
      result = new Uint8Array(length);
      result.set(await readUint8Array(reader, localOffset, partLength));
      result.set(
        await this.readUint8Array(offset + partLength, length - partLength, idx + 1),
        partLength,
      );
    }

    this.lastDiskNumber = Math.max(idx, this.lastDiskNumber);
    return result;
  }
}

export class SplitDataWriter extends Stream {
  constructor(iterator, maxSize = 0xffffffff) {
    super();
    this.diskNumber = 0;
    this.diskOffset = 0;
    this.size = 0;
    this.maxSize = maxSize;
    this.availableSize = maxSize;

    let currentDisk, writableStream, writer;

    const writable = new WritableStream({
      write: async (chunk) => {
        while (chunk.length) {
          if (!writer) {
            const { value, done } = await iterator.next();
            if (done && !value) throw new Error(ERR_ITERATOR_COMPLETED_TOO_SOON);

            currentDisk = value;
            currentDisk.size = 0;
            if (currentDisk.maxSize) this.maxSize = currentDisk.maxSize;

            this.availableSize = this.maxSize;
            await initStream(currentDisk);

            writableStream = currentDisk.writable;
            writer = writableStream.getWriter();
          }

          const toWrite = Math.min(chunk.length, this.availableSize);
          await writer.ready;
          await writer.write(chunk.slice(0, toWrite));

          currentDisk.size += toWrite;
          this.size += toWrite;
          this.availableSize -= toWrite;

          if (toWrite === chunk.length) {
            chunk = new Uint8Array(0);
          } else {
            chunk = chunk.slice(toWrite);
            writer = null;
            this.diskOffset += currentDisk.size;
            this.diskNumber++;
          }
        }
      },
      close: async () => {
        await writer.ready;
        await writer.close();
      },
    });

    Object.defineProperty(this, PROPERTY_NAME_WRITABLE, {
      get: () => writable,
    });
  }
}
