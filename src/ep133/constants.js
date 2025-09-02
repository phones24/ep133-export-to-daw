// This file was obtained from the original sources owned by Teenage Engineering
// and is NOT covered by the GNU Affero General Public License that applies to the rest of the project.

export const BIT_IS_REQUEST = 64;
export const BIT_REQUEST_ID_AVAILABLE = 32;
export const MIDI_SYSEX_START = 240;
export const MIDI_SYSEX_END = 247;
export const TE_MIDI_ID_0 = 0;
export const TE_MIDI_ID_1 = 32;
export const TE_MIDI_ID_2 = 118;
export const MIDI_SYSEX_TE = 64;

export const TE_SYSEX = {
  GREET: 1,
  ECHO: 2,
  DFU: 3,
  DFU_ENTER: 1,
  DFU_ENTER_MIDI: 1,
  DFU_EXIT: 5,
  PRODUCT_SPECIFIC: 127,
  STATUS_OK: 0,
  STATUS_ERROR: 1,
  STATUS_COMMAND_NOT_FOUND: 2,
  STATUS_BAD_REQUEST: 3,
  STATUS_SPECIFIC_ERROR_START: 16,
  STATUS_SPECIFIC_ERROR_END: 63,
  STATUS_SPECIFIC_SUCCESS_START: 64,
};

export const DEVICE_SAMPLE_RATE = 46875;
export const DEVICE_AUDIO_FORMAT = 's16';

export const TE_SYSEX_FILE = 5;
export const TE_SYSEX_FILE_INIT = 1;
export const TE_SYSEX_FILE_INIT_SUBSCRIBE = 1;
export const TE_SYSEX_FILE_PUT = 2;
export const TE_SYSEX_FILE_PUT_TYPE_INIT = 0;
export const TE_SYSEX_FILE_PUT_TYPE_DATA = 1;
export const TE_SYSEX_FILE_GET = 3;
export const TE_SYSEX_FILE_GET_TYPE_INIT = 0;
export const TE_SYSEX_FILE_GET_TYPE_DATA = 1;
export const TE_SYSEX_FILE_LIST = 4;
export const TE_SYSEX_FILE_PLAYBACK = 5;
export const TE_SYSEX_FILE_DELETE = 6;
export const TE_SYSEX_FILE_METADATA = 7;
export const TE_SYSEX_FILE_METADATA_SET = 1;
export const TE_SYSEX_FILE_METADATA_GET = 2;
export const TE_SYSEX_FILE_METADATA_SET_PAGED = 4;
export const TE_SYSEX_FILE_METADATA_SET_PAGED_TYPE_INIT = 0;
export const TE_SYSEX_FILE_METADATA_SET_PAGED_TYPE_DATA = 1;
export const TE_SYSEX_FILE_FILE_TYPE_FILE = 1;
export const TE_SYSEX_FILE_FILE_TYPE_DIR = 2;
export const TE_SYSEX_FILE_CAPABILITY_READ = 4;
export const TE_SYSEX_FILE_CAPABILITY_WRITE = 8;
export const TE_SYSEX_FILE_CAPABILITY_DELETE = 16;
export const TE_SYSEX_FILE_CAPABILITY_MOVE = 32;
export const TE_SYSEX_FILE_CAPABILITY_PLAYBACK = 64;
export const TE_SYSEX_FILE_PLAYBACK_START = 1;
export const TE_SYSEX_FILE_PLAYBACK_STOP = 2;
export const TE_SYSEX_HEADER_OVERHEAD = 8;
export const TE_SYSEX_FOOTER_OVERHEAD = 1;
export const TE_SYSEX_FILE_INFO = 11;
export const TE_SYSEX_FILE_MOVED = 12;

export const TE032AS001 = {
  beta: '0.100.38',
  production: '2.0.0',
};

export const TE032AS005 = {
  beta: '0.2.13',
  production: '1.0.2',
};

// Aggregate versions
export const versionsJson = {
  TE032AS001,
  TE032AS005,
};

// Project identifiers
export const PROJECTS = ['01', '02', '03', '04', '05', '06', '07', '08', '09'];

// Group identifiers
export const GROUPS = ['A', 'B', 'C', 'D'];

// Pad identifiers
export const PADS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

export const TE_SYSEX_FILE_EVENT = {
  3: 'METADATA_UPDATED',
  8: 'FILE_ADDED',
  9: 'FILE_UPDATED',
  10: 'FILE_DELETED',
  13: 'FILE_MOVED',
  METADATA_UPDATED: 3,
  FILE_ADDED: 8,
  FILE_UPDATED: 9,
  FILE_DELETED: 10,
  FILE_MOVED: 13,
};
