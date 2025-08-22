export class TeSysexError extends Error {
  constructor(sysexMessage, device) {
    super(sysexMessage.string); // Error message comes from the SysEx object's string property
    this.name = 'TeSysexError';
    this.sysexMsg = sysexMessage;
    this.device = device;
  }
}

export class TeSysexTimeoutError extends Error {
  constructor(message, details) {
    super(message, details); // Note: second arg to super is ignored in native Error
    this.name = 'TeSysexTimeoutError';
  }
}

export class MIDINotSupportedError extends Error {}

export class MIDIDisallowedError extends Error {}

export class MetadataParseError extends Error {}

export class UserAbortError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserAbortError';
  }
}

export class DeviceServiceError extends Error {
  constructor(message = 'no device service') {
    super(message);
    this.name = 'DeviceServiceError';
  }
}

export class SkuMismatchError extends Error {
  constructor(message = 'skus do not match') {
    super(message);
    this.name = 'SkuMismatchError';
  }
}

export class InvalidFileFormatError extends Error {
  constructor(message = 'invalid file format') {
    super(message);
    this.name = 'InvalidFileFormatError';
  }
}

export class CorruptFileError extends Error {
  constructor(message = 'file may be damaged or corrupt') {
    super(message);
    this.name = 'CorruptFileError';
  }
}

export class FirmwareVersionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FirmwareVersionError';
  }
}

export class UnsupportedAudio extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnsupportedAudioFormat';
  }
}

export class DeviceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DeviceError';
  }
}

export class DeviceInitError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = 'DeviceInitError';
  }
}
