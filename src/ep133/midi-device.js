// This file was obtained from the original sources owned by Teenage Engineering
// and is NOT covered by the GNU Affero General Public License that applies to the rest of the project.

import { TE_SYSEX } from './constants';
import { asHexString, metadataStringToObject } from './utils';

export class MidiDevice {
  constructor(sendAndReceiveFn, sku, outputPort, inputPort, deviceId, metadata) {
    this.name = outputPort.name ?? 'unknown';
    this.sku = sku;
    this.serial = metadata.serial;
    this.outputId = outputPort.id;
    this.output = outputPort;
    this.inputId = inputPort.id;
    this.input = inputPort;
    this.deviceId = deviceId;
    this.metadata = metadata;

    this._sendAndReceive = sendAndReceiveFn;
    this.debug = true;
    this.onEnterBootloader = undefined;
    this.onEnterNormal = undefined;
    this.onDeviceLostTimeout = null;
    this.rebootRequestedAt = null;
    this.deviceLostCallback = null;
    this.locked = false;
  }

  log(...args) {
    if (this.debug) {
      console.debug('MIDI:Device', ...args);
    }
  }

  sendAndReceive(command, payload = [], expectedStatus = null, timeout) {
    if (!this.output) {
      throw new Error('Missing output port');
    }
    return this._sendAndReceive(
      this.output,
      this.deviceId,
      command,
      payload,
      expectedStatus,
      timeout,
    );
  }

  getObject() {
    return JSON.parse(
      JSON.stringify({
        name: this.name,
        sku: this.sku,
        serial: this.metadata.serial,
        metadata: this.metadata,
        outputId: this.outputId,
        inputId: this.inputId,
      }),
    );
  }

  updateOnGreeted({ input, output, metadata }) {
    this.input = input;
    this.output = output;
    this.onMetadataUpdated(metadata);
  }

  onMetadataUpdated(newMetadata) {
    const oldMode = this.metadata.mode;
    const newMode = newMetadata.mode;
    this.log(
      `onMetadataUpdated: from ${oldMode} to ${newMode} metadata=${JSON.stringify(newMetadata)}`,
    );
    this.metadata = newMetadata;

    if (newMode === 'bootloader' && this.onEnterBootloader) {
      this.onEnterBootloader();
    } else if (newMode === 'normal' && this.onEnterNormal) {
      this.onEnterNormal();
    }
  }

  echo(data) {
    return this.sendAndReceive(TE_SYSEX.ECHO, data).then((response) => {
      const sentHex = asHexString(data);
      const receivedHex = asHexString(response.data);
      if (sentHex !== receivedHex) {
        throw `Echo failed: send=${sentHex} received=${receivedHex}`;
      }
    });
  }

  matchesInput(id) {
    return this.inputId === id;
  }

  matchesOutput(id) {
    return this.outputId === id;
  }

  inputLost(callback) {
    this.deviceLostCallback = callback;
    this.input = null;
    this.checkAndTriggerDeviceLost();
  }

  outputLost(callback) {
    this.deviceLostCallback = callback;
    this.output = null;
    this.checkAndTriggerDeviceLost();
  }

  async closePorts() {
    if (this.output) await this.output.close();
    if (this.input) await this.input.close();
  }

  setDeviceLostLock(lockState) {
    this.locked = lockState;
  }

  checkAndTriggerDeviceLost() {
    if (this.input === null && this.output === null && this.onDeviceLostTimeout === null) {
      this.log('Lost all I/O for device');
      let timeoutDelay = 200;

      if (this.rebootRequestedAt && Date.now() - this.rebootRequestedAt.getTime() < 3000) {
        timeoutDelay = 30000;
      }

      this.onDeviceLostTimeout = setTimeout(() => {
        this.onDeviceLostTimeout = null;
        if (this.input === null && this.output === null && this.deviceLostCallback) {
          this.log('Triggered device lost!');
          if (!this.locked) {
            this.deviceLostCallback(this);
          }
        }
      }, timeoutDelay);
    }
  }

  ensureDeviceInBootloader() {
    return new Promise((resolve, reject) => {
      if (this.metadata.mode === 'bootloader') {
        this.log('Device already in bootloader');
        return resolve();
      }

      this.log('Switching to bootloader');
      this.rebootRequestedAt = new Date();
      const payload = [TE_SYSEX.DFU_ENTER, TE_SYSEX.DFU_ENTER_MIDI, 0, 200];
      let bootloaderTimeout;

      this.sendAndReceive(TE_SYSEX.DFU, payload)
        .then(async () => {
          const setupTimeout = () => {
            this.onEnterBootloader = () => {
              clearTimeout(bootloaderTimeout);
              this.onEnterBootloader = undefined;
              resolve();
            };

            bootloaderTimeout = setTimeout(async () => {
              this.log('Reboot timeout triggered');
              if (this.onEnterBootloader) {
                try {
                  const greetResponse = await this.sendAndReceive(TE_SYSEX.GREET, []);
                  this.log('Got greet message', greetResponse);
                  const metadata = metadataStringToObject(greetResponse.string);
                  this.onMetadataUpdated(metadata);
                } catch (err) {
                  this.log('Reboot timeout', err);
                  reject('Failed to enter bootloader');
                }
              }
            }, 20000);
          };

          try {
            const closeResult = await this.output?.close();
            this.log('Close success', closeResult);
          } catch (err) {
            this.log('Close error', err);
          } finally {
            setupTimeout();
          }
        })
        .catch(reject);
    });
  }

  awaitDeviceReboot() {
    return new Promise((resolve) => {
      this.setDeviceLostLock(true);
      this.onEnterNormal = () => {
        this.setDeviceLostLock(false);
        this.onEnterNormal = undefined;
        this.onEnterBootloader = undefined;
        resolve();
      };
      this.onEnterBootloader = () => {
        this.setDeviceLostLock(false);
        this.onEnterNormal = undefined;
        this.onEnterBootloader = undefined;
        resolve();
      };
    });
  }

  async exitBootloader() {
    await this.sendAndReceive(TE_SYSEX.DFU, [TE_SYSEX.DFU_EXIT]);
  }
}
