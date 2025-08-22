import { TE_SYSEX } from './constants';
import { MidiDevice } from './midi-device';
import { metadataStringToObject } from './utils';

export class DeviceIdentification {
  constructor(midi) {
    this.identQueue = [];
    this.midi = midi;
    this.activeDeviceIdCallback = null;
    this.activeDeviceIdTimeout = null;
    this.debug = midi.debug;
  }

  // log(...args) {
  // 	if (this.debug) {
  // 		console.log('MIDI:Ident', ...args);
  // 	}
  // }

  setDebug(enabled) {
    this.debug = enabled;
  }

  queue(outputPort) {
    this.identQueue.push(outputPort);
    setTimeout(() => this.handle(), 0);
  }

  onIdentityResponse(inputPort, idResponse) {
    console.log('MIDI:Ident', 'identity_response', idResponse);

    if (this.activeDeviceIdCallback !== null) {
      this.activeDeviceIdCallback(inputPort, idResponse);
      this.activeDeviceIdCallback = null;

      if (this.activeDeviceIdTimeout !== null) {
        clearTimeout(this.activeDeviceIdTimeout);
        this.activeDeviceIdTimeout = null;
      }
    }
  }

  identify(outputPort) {
    const sendIdRequest = (port) => {
      console.log('MIDI:Ident', 'sending id request');
      port.send([240, 126, 127, 6, 1, 247]); // Standard MIDI Identity Request SysEx
    };

    return new Promise((resolve, reject) => {
      if (this.activeDeviceIdCallback !== null) {
        console.error('MIDI:Ident', 'id process already in progress');
        reject('identification already in progress');
        return;
      }

      const maxTries = 1;
      const totalTimeout = 5000; // ms
      let triesLeft = maxTries;

      const retry = () => {
        if (triesLeft--) {
          console.log('MIDI:Ident', `trying again, tries left ${triesLeft}/${maxTries}`);
          sendIdRequest(outputPort);
          this.activeDeviceIdTimeout = setTimeout(retry, totalTimeout / maxTries);
        } else {
          this.activeDeviceIdCallback = null;
          this.activeDeviceIdTimeout = null;
          console.log('MIDI:Ident', 'device id timed out');
        }
      };

      this.activeDeviceIdTimeout = setTimeout(retry, totalTimeout / maxTries);

      this.activeDeviceIdCallback = (inputPort, idResponse) => {
        console.log('MIDI:Ident', 'got device id response', idResponse);
        this.activeDeviceIdCallback = null;
        resolve({
          output: outputPort,
          input: inputPort,
          id_response: idResponse,
        });
      };

      sendIdRequest(outputPort);
    });
  }

  handle() {
    console.log('MIDI:Ident', 'midiIdentHandle');

    const greetDevice = async (deviceInfo) => {
      console.log('MIDI:Ident', 'greeting');
      const greetResponse = await this.midi.client.sendAndReceive(
        deviceInfo.output,
        deviceInfo.id_response.id,
        TE_SYSEX.GREET,
        [],
      );

      console.log('MIDI:Ident', 'greetResponse', greetResponse);

      return new MidiDevice(
        this.midi.client.sendAndReceive.bind(this.midi.client),
        deviceInfo.id_response.sku,
        deviceInfo.output,
        deviceInfo.input,
        deviceInfo.id_response.id,
        metadataStringToObject(greetResponse.string),
      );
    };

    const processQueue = async () => {
      if (this.activeDeviceIdCallback !== null) {
        setTimeout(processQueue, 500);
        return;
      }

      const queuedOutput = this.identQueue.pop();
      if (queuedOutput !== undefined) {
        const idResult = await this.identify(queuedOutput);
        const device = await greetDevice(idResult);
        this.midi.onDeviceFound(device);
        setTimeout(processQueue, 0);
      }
    };

    setTimeout(processQueue, 500);
  }
}
