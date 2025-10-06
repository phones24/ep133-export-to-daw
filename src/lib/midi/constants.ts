export const TE_SYSEX = {
  STATUS_OK: 0,
  STATUS_ERROR: 1,
  STATUS_COMMAND_NOT_FOUND: 2,
  STATUS_BAD_REQUEST: 3,
  STATUS_SPECIFIC_ERROR_START: 16,
  STATUS_SPECIFIC_SUCCESS_START: 64,
};

export const BIT_IS_REQUEST = 64;
export const BIT_REQUEST_ID_AVAILABLE = 32;
export const MIDI_SYSEX_START = 240;
export const MIDI_SYSEX_END = 247;
export const TE_MIDI_ID_0 = 0;
export const TE_MIDI_ID_1 = 32;
export const TE_MIDI_ID_2 = 118;
export const MIDI_SYSEX_TE = 64;

export const IDENTITY_SYSEX = [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7];

export const TE_SYSEX_GREET = 1;
export const TE_SYSEX_FILE = 5;
export const TE_SYSEX_FILE_INIT = 1;
export const TE_SYSEX_FILE_GET = 3;
export const TE_SYSEX_FILE_GET_TYPE_INIT = 0;
export const TE_SYSEX_FILE_GET_TYPE_DATA = 1;
export const TE_SYSEX_FILE_LIST = 4;
export const TE_SYSEX_FILE_METADATA = 7;
export const TE_SYSEX_FILE_METADATA_GET = 2;
export const TE_SYSEX_FILE_FILE_TYPE_FILE = 1;
export const TE_SYSEX_FILE_INFO = 11;
