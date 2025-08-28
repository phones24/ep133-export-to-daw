import {
  TE_MIDI_ID_0,
  TE_MIDI_ID_1,
  TE_MIDI_ID_2,
  TE_SYSEX,
  TE_SYSEX_FOOTER_OVERHEAD,
  TE_SYSEX_HEADER_OVERHEAD,
  versionsJson,
} from './constants';
import { FirmwareVersionError } from './errors';

/**
 * Convert a byte array to a hex string like: "[0a,ff,32]"
 */
export function asHexString(byteArray) {
  return '[' + asHexArray(byteArray).join(',') + ']';
}

/**
 * Convert a byte array to an array of two-digit hex strings.
 * Null/undefined values become "UU".
 */
export function asHexArray(byteArray) {
  const result = [];
  for (const value of byteArray.values()) {
    result.push(value == null ? 'UU' : value.toString(16).padStart(2, '0'));
  }
  return result;
}

/**
 * Format two numbers into a TE SKU string like: "TE005AS012"
 */
export function formatTeSku(teNumber, asNumber) {
  const pad3 = (num) => num.toString().padStart(3, '0');
  return `TE${pad3(teNumber)}AS${pad3(asNumber)}`;
}

/**
 * Convert an array of character codes to a string.
 */
export function binToString(byteArray) {
  return String.fromCharCode.apply(null, Array.from(byteArray));
}

/**
 * Parse a semicolon-separated "key:value" metadata string into an object.
 */
export function metadataStringToObject(metaString) {
  const result = {
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
    if (key in result) {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Unpack a 7-bit packed MIDI SysEx byte array *in place*.
 * This removes the packing bytes and returns the actual 8-bit values.
 */
export function unpackInPlace(packedBytes) {
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

/**
 * Pack an array of 8-bit bytes into MIDI SysEx 7-bit format and store in buffer.
 * @param {Uint8Array} data - 8-bit data to pack
 * @param {Uint8Array} outBuffer - Buffer to write the packed data into
 */
export function packToBuffer(data, outBuffer) {
  let outIndex = 1; // First byte is reserved for MSB flags
  let msbIndex = 0; // Index of MSB byte

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

/**
 * Parse a MIDI Identity Response SysEx message to extract device info.
 * @param {MIDIMessageEvent} midiMessage - The incoming MIDI message event.
 * @returns {{id: number, sku: string} | null}
 */
export function parseMidiIdentityResponse(midiMessage) {
  const data = midiMessage.data;

  // MIDI Identity Response SysEx messages should be exactly 17 bytes
  if (data.length !== 17) return null;

  const isUniversalSysEx = data[0] === 0xf0 && data[1] === 0x7e;
  const isTeenageEngineering =
    data[5] === TE_MIDI_ID_0 && data[6] === TE_MIDI_ID_1 && data[7] === TE_MIDI_ID_2;

  if (isUniversalSysEx && isTeenageEngineering) {
    // SKU bytes are stored with 7-bit packing, hence the XOR/shift trick
    const productCode = data[8] ^ (data[9] << 7);
    const assemblyCode = data[10] ^ (data[11] << 7);
    const sku = formatTeSku(productCode, assemblyCode);

    return {
      id: data[2], // Device ID
      sku,
    };
  }

  return null;
}

/**
 * Convert a TE SysEx status code into a readable string.
 * @param {number} status
 * @returns {string}
 */
export function sysexStatusToString(status) {
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

// Generates all intermediate paths for a given path string
export function generatePathsFromPath(path) {
  const paths = ['']; // Start with root
  const segments = path.split('/').filter((segment) => segment !== '');

  for (let i = 1; i <= segments.length; i++) {
    const partialPath = '/' + segments.slice(0, i).join('/');
    paths.push(partialPath);
  }

  return paths;
}

// Normalizes a file name to a safe, lowercased, ASCII string of max 16 chars
export function normalizeFileName(fileName) {
  // Remove leading 3-digit numbers followed by space
  fileName = fileName.replace(/^\d{3}\s/, '');

  // Remove file extension if present
  fileName = fileName.split('.').slice(0, -1).join('.') || fileName;

  // Remove all slashes
  fileName = fileName.replace(/\//g, '');

  // Trim whitespace
  fileName = fileName.trim();

  // Remove diacritics
  fileName = fileName.normalize('NFD').replace(/\p{Diacritic}/gu, '');

  // Replace non-ASCII characters with '?'
  fileName = fileName.replace(/[^\x20-\x7F]/g, '?');

  // Remove backslashes and double quotes
  fileName = fileName.replace(/[\\"]/g, '');

  // Limit length to 16 characters
  fileName = fileName.substring(0, 16);

  // Convert to lowercase
  return fileName.toLowerCase();
}

export function semverCompare(versionA, versionB) {
  // If versionA starts with versionB + "-", then versionA is considered smaller
  if (versionA.startsWith(versionB + '-')) {
    return -1;
  }

  // If versionB starts with versionA + "-", then versionA is considered larger
  if (versionB.startsWith(versionA + '-')) {
    return 1;
  }

  // Otherwise, compare normally using locale-aware numeric sorting
  return versionA.localeCompare(versionB, undefined, {
    numeric: true,
    sensitivity: 'case',
    caseFirst: 'upper',
  });
}

// Validates that the device firmware version is sufficient
export function validateDeviceVersion(device) {
  const osVersion = device.metadata.os_version;

  // If it's an early 0.1.0 version, allow it
  if (osVersion.startsWith('0.1.0')) return true;

  // Determine release type: beta or production
  const releaseType = osVersion.startsWith('0.') ? 'beta' : 'production';

  const minVersion = versionsJson[device.sku]?.[releaseType];
  if (!minVersion) throw new FirmwareVersionError('unknown device');

  // Compare device version with minimum required version
  if (semverCompare(osVersion, minVersion) === -1) {
    throw new FirmwareVersionError(`minimum version is ${minVersion}`);
  }
}

export function calculateMaxPayloadLength(s, a) {
  const o = TE_SYSEX_HEADER_OVERHEAD + 2 + TE_SYSEX_FOOTER_OVERHEAD;
  if (s <= o) return 0;
  {
    const _ = s - 1 - o;
    return _ - Math.floor(_ / 8);
  }
}

const validators = {
  'sound.loopstart': (s) => s != null && s >= 0,
  'sound.loopend': (s) => s != null && s >= 0,
  'sound.rootnote': (s) => s != null && s > 0 && s <= 127,
  'sound.bpm': (s) => s != null && s >= 60 && s <= 180,
  'sound.pitch': (s) => s != null && s >= -12 && s <= 12,
  'sound.pan': (s) => s != null && s >= -16 && s <= 16,
  'sound.amplitude': (s) => s != null && s >= 0 && s <= 200,
  'envelope.attack': (s) => s != null && s >= 0 && s <= 255,
  'envelope.release': (s) => s != null && s >= 0 && s <= 255,
  'sound.playmode': (s) => s != null && (s == null ? void 0 : s.length) > 0,
  'time.mode': (s) => s != null && (s == null ? void 0 : s.length) > 0,
};

export function prepareTeenageMeta(sample, sampleLength) {
  const extra = sample?.extra;
  if (!extra) return {};

  const parsedJson = extra.json ? JSON.parse(extra.json) : {};
  let meta = {};

  // If parsed JSON is a plain object, start with its values
  if (parsedJson?.constructor === Object) {
    meta = parsedJson;
  }

  // Adjust loop points if they are valid
  if (
    validators['sound.loopstart'](extra.loop_start) &&
    validators['sound.loopend'](extra.loop_end)
  ) {
    const ratio = sampleLength / (sample.sample_rate ?? sampleLength);
    meta['sound.loopstart'] = Math.floor((extra.loop_start ?? 0) * ratio);
    meta['sound.loopend'] = Math.floor((extra.loop_end ?? 0) * ratio);
  }

  // Copy root note if valid
  if (validators['sound.rootnote'](extra.midi_root_note)) {
    meta['sound.rootnote'] = extra.midi_root_note;
  }

  // Copy BPM if valid
  if (validators['sound.bpm'](extra.bpm)) {
    meta['sound.bpm'] = extra.bpm;
  }

  return cleanTeenageMeta(meta);
}

export function cleanTeenageMeta(meta) {
  const cleanedMeta = {};
  for (const [key, value] of Object.entries(meta)) {
    if (!(validators[key]?.(value) === false)) {
      cleanedMeta[key] = value;
    }
  }
  return cleanedMeta;
}

export async function decodeAudioData(arrayBuffer, sampleRate) {
  // Decode audio data using an AudioContext
  const audioBuffer = await new AudioContext({ sampleRate }).decodeAudioData(arrayBuffer);

  // Create a Float32Array to hold interleaved audio samples
  const interleaved = new Float32Array(audioBuffer.length * audioBuffer.numberOfChannels);

  // Get separate channel data
  const channels = new Array(audioBuffer.numberOfChannels);
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    channels[channel] = audioBuffer.getChannelData(channel);
  }

  // Interleave the channel data into a single array
  let index = 0;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      interleaved[index++] = channels[channel][i];
    }
  }

  return [interleaved.buffer, audioBuffer.numberOfChannels];
}

export function audioFormatAsBitDepth(format) {
  switch (format) {
    case 's16':
      return 16;
    case 's24':
      return 24;
    case 'float':
      return 32;
    default:
      throw new Error('Unknown bit depth');
  }
}

// Throttle a function to limit how often it can be called
export const throttle = (fn, delay) => {
  let isThrottled = false;
  let timeoutId;
  let isCanceled = false;

  // The throttled function
  const throttledFn = (...args) => {
    if (isCanceled || isThrottled) return;

    const result = fn(...args);
    isThrottled = true;

    timeoutId = window.setTimeout(() => {
      isThrottled = false;
    }, delay);

    return result;
  };

  // Cancel function to stop further calls
  const cancel = () => {
    isCanceled = true;
    clearTimeout(timeoutId);
  };

  return [throttledFn, cancel];
};

// Pick only specified keys from an object
export const pick = (obj, ...keys) =>
  Object.fromEntries(keys.filter((key) => key in obj).map((key) => [key, obj[key]]));

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const crc32 = (data, initial = 0) => {
  const normalize = (value) => (value >= 0 ? value : 0xffffffff + value + 1);

  let crc = normalize(initial) ^ 0xffffffff;

  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }

  return normalize(crc ^ 0xffffffff);
};

export function sanitizeBrokenJson(input) {
  return input.replace(/:"([^"]*?)"([^,}]*)/g, (_, part1, part2) => {
    const fixed = (part1 + part2).replace(/"/g, '\\"');
    return `:"${fixed}"`;
  });
}
