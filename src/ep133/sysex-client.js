// This file was obtained from the original sources owned by Teenage Engineering
// and is NOT covered by the GNU Affero General Public License that applies to the rest of the project.

import {
  BIT_IS_REQUEST,
  BIT_REQUEST_ID_AVAILABLE,
  MIDI_SYSEX_END,
  MIDI_SYSEX_START,
  MIDI_SYSEX_TE,
  TE_MIDI_ID_0,
  TE_MIDI_ID_1,
  TE_MIDI_ID_2,
  TE_SYSEX,
} from './constants';
import { TeSysexError, TeSysexTimeoutError } from './errors';
import {
  asHexString,
  binToString,
  packToBuffer,
  parseMidiIdentityResponse,
  sysexStatusToString,
  unpackInPlace,
} from './utils';

export class SysexClient {
  constructor(devices, dispatchMidiEvent, onIdentityResponse) {
    this.debugEnabled = false;
    this.requests = new Map(); // requestId → callback
    this.devices = devices; // All known devices
    this.deviceRequests = new Map(); // device.serial → Map(requestId → callback)
    this.requestIds = new Map(); // device.id → last requestId used
    this.onIdentityResponse = onIdentityResponse;
    this.dispatchMidiEvent = dispatchMidiEvent;
  }

  setDebug(enabled) {
    this.debugEnabled = enabled;
  }

  log(...args) {
    if (this.debugEnabled) console.debug(...args);
  }

  send(midiOutput, identityCode, command, data = []) {
    const packedLength = data.length > 0 ? data.length + Math.ceil(data.length / 7) : 0;

    const message = new Uint8Array(10 + packedLength);
    const requestId = this.getNextRequestId(midiOutput.id);

    message[0] = MIDI_SYSEX_START;
    message[1] = TE_MIDI_ID_0;
    message[2] = TE_MIDI_ID_1;
    message[3] = TE_MIDI_ID_2;
    message[4] = identityCode;
    message[5] = MIDI_SYSEX_TE;
    message[6] = BIT_IS_REQUEST | BIT_REQUEST_ID_AVAILABLE | ((requestId >> 7) & 0x1f);
    message[7] = requestId & 0x7f;
    message[8] = command;
    message[message.length - 1] = MIDI_SYSEX_END;

    packToBuffer(data, message.subarray(9, 9 + packedLength));

    this.log(`MIDI:SysexClient: -> id=#${requestId} cmd=${command} data=${asHexString(data)}`);
    midiOutput.send(message);

    return requestId;
  }

  /**
   * Generate next requestId for a given MIDI output.
   */
  getNextRequestId(outputId) {
    if (!this.requestIds.has(outputId)) {
      this.requestIds.set(outputId, Math.floor(Math.random() * 4095));
    }
    const nextId = ((this.requestIds.get(outputId) ?? 0) + 1) % 4096;
    this.requestIds.set(outputId, nextId);
    return nextId;
  }

  /**
   * Send a SysEx request and wait for the matching response.
   */
  sendAndReceive(
    midiOutput,
    identityCode,
    command,
    data = [],
    onPartialResponse = null,
    timeoutMs = 20000,
  ) {
    const startTime = performance.now();
    const requestId = this.send(midiOutput, identityCode, command, data);
    const deviceObj = [...this.devices.values()].find((dev) => dev.output_id === midiOutput.id);

    return new Promise((resolve, reject) => {
      const timeoutHandler = () => {
        const pendingRequest = this.requests.get(requestId);
        this.requests.delete(requestId);

        if (deviceObj && this.deviceRequests.has(deviceObj.serial)) {
          this.deviceRequests.get(deviceObj.serial)?.delete(requestId);
        }

        reject(
          new TeSysexTimeoutError(
            `failed to receive message with request_id=${requestId} in ${timeoutMs}ms`,
            { cause: { request: pendingRequest } },
          ),
        );
      };

      let timeoutId = setTimeout(timeoutHandler, timeoutMs);

      const responseHandler = (response) => {
        const isMostlyAscii = (str, threshold = 0.8) =>
          [...str].filter((c) => c.charCodeAt(0) <= 127).length / str.length >= threshold;

        this.log(
          '\x1B[36m%s\x1B[0m',
          `MIDI:SysexClient: <- id=#${requestId} cmd=${response.command} ` +
            `roundtrip=${(performance.now() - startTime).toFixed(2)}ms ` +
            `data=${isMostlyAscii(response.string) ? response.string : response.hex_data}`,
        );

        clearTimeout(timeoutId);

        if (response.status === TE_SYSEX.STATUS_OK) {
          resolve(response);
        } else if (response.status === TE_SYSEX.STATUS_SPECIFIC_SUCCESS_START) {
          // Partial/multi-part response
          timeoutId = setTimeout(timeoutHandler, timeoutMs);
          onPartialResponse && onPartialResponse(response);
        } else {
          this.log('MIDI:SysexClient: rejected', response);
          reject(new TeSysexError(response, deviceObj?.getObject()));
        }
      };

      if (deviceObj) {
        if (!this.deviceRequests.has(deviceObj.serial)) {
          this.deviceRequests.set(deviceObj.serial, new Map());
        }
        this.deviceRequests.get(deviceObj.serial)?.set(requestId, responseHandler);
        return;
      }

      this.requests.set(requestId, responseHandler);
    });
  }

  /**
   * Parse a Teenage Engineering SysEx message into a structured object.
   */
  parseTeenageSysex(bytes) {
    const validHeader =
      bytes.length >= 9 &&
      bytes[0] === MIDI_SYSEX_START &&
      bytes[1] === TE_MIDI_ID_0 &&
      bytes[2] === TE_MIDI_ID_1 &&
      bytes[3] === TE_MIDI_ID_2 &&
      bytes[5] === MIDI_SYSEX_TE &&
      bytes[bytes.length - 1] === MIDI_SYSEX_END;

    if (!validHeader) {
      // Debug log of non-TE messages
      if (
        this.debugEnabled &&
        bytes.length >= 8 &&
        bytes[0] === MIDI_SYSEX_START &&
        bytes[1] === TE_MIDI_ID_0 &&
        bytes[2] === TE_MIDI_ID_1 &&
        bytes[3] === TE_MIDI_ID_2 &&
        bytes[5] === 51
      ) {
        console.log('🪵' + binToString(bytes.subarray(6, bytes.length - 1)));
      }
      return;
    }

    const msg = {
      kind: 'te-sysex',
      identity_code: bytes[4],
      request_id: 0,
      has_request_id: false,
      status: -1,
      h_status: '',
      command: bytes[8],
      type: bytes[6] & BIT_IS_REQUEST ? 'request' : 'response',
      data: new Uint8Array(),
      hex_data: '',
      hex_command: '',
      string: '',
    };

    if (bytes[6] & BIT_REQUEST_ID_AVAILABLE) {
      msg.has_request_id = true;
      msg.request_id = ((bytes[6] & 0x1f) << 7) | (bytes[7] & 0x7f);
    }

    let index = 9;

    if (msg.type === 'response') {
      msg.status = bytes[index++];
    }

    msg.h_status = sysexStatusToString(msg.status);
    if (msg.h_status === undefined) {
      console.error(`cannot handle message with status ${msg.status}`);
      return;
    }

    msg.data = unpackInPlace(bytes.subarray(index, bytes.length - 1));
    msg.string = binToString(msg.data);

    if (this.debugEnabled) {
      msg.hex_data = asHexString(msg.data);
      msg.hex_command = msg.command.toString(16).padStart(2, '0');
    }

    return msg;
  }

  /**
   * Handle incoming MIDI messages for all devices.
   */
  handleMidiMessages(inputPort, midiMessage) {
    // Check for MIDI Identity Response
    const identityResponse = parseMidiIdentityResponse(midiMessage);
    if (identityResponse) {
      this.onIdentityResponse(inputPort, identityResponse);
      return;
    }

    // Parse TE SysEx
    const sysex = this.parseTeenageSysex(midiMessage.data);
    if (sysex) {
      if (sysex.has_request_id) {
        // Try device-specific request handler
        for (const [serial, device] of this.devices.entries()) {
          if (device.input_id === inputPort.id && this.deviceRequests.has(serial)) {
            const handler = this.deviceRequests.get(serial)?.get(sysex.request_id);
            if (handler) {
              handler(sysex);
              if (sysex.status < TE_SYSEX.STATUS_SPECIFIC_SUCCESS_START) {
                this.deviceRequests.get(serial)?.delete(sysex.request_id);
              }
              return;
            }
          }
        }

        // Try global request handler
        if (this.requests.has(sysex.request_id)) {
          const handler = this.requests.get(sysex.request_id);
          if (handler) handler(sysex);
          if (sysex.status < TE_SYSEX.STATUS_SPECIFIC_SUCCESS_START) {
            this.requests.delete(sysex.request_id);
          }
        } else {
          this.log(
            'MIDI:SysexClient: ignoring message with request_id we are not waiting for',
            sysex,
          );
        }
      } else {
        // Unsolicited message: dispatch to matching device
        for (const [serial, device] of this.devices.entries()) {
          if (device.input_id === inputPort.id) {
            this.dispatchMidiEvent(serial, sysex);
            return;
          }
        }
      }
    } else {
      // Raw MIDI message
      for (const [serial, device] of this.devices.entries()) {
        if (device.input_id === inputPort.id) {
          const rawEvent = {
            kind: 'raw',
            data: [...midiMessage.data],
            hex_data: '',
          };
          if (this.debugEnabled) {
            rawEvent.hex_data = asHexString(rawEvent.data);
          }
          this.dispatchMidiEvent(serial, rawEvent);
          return;
        }
      }
    }
  }
}
