export type TESysexMetadata = {
  chip_id: string;
  mode: string;
  os_version: string;
  product: string;
  serial: string;
  sku: string;
  sw_version: string;
};

export type TESysexMessage = {
  kind: 'te-sysex';
  identityCode: number;
  requestId: number;
  hasRequestId: boolean;
  status: number;
  hStatus: string;
  command: number;
  type: 'request' | 'response';
  rawData: Uint8Array;
  hexData: string;
  hexCommand: string;
  string: string;
};

export type FileListEntry = {
  nodeId: number;
  flags: number;
  fileSize: number;
  fileName: string;
  fileType: 'file' | 'folder';
};
