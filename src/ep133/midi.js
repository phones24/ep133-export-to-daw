import { DeviceIdentification } from './device-identification';
import { eventEmitter } from './events';
import { MidiIO } from './midi-io';
import { SysexClient } from './sysex-client';

export class Midi {
  constructor() {
    this.inited = false;
    this.debug = false;
    this.devices = new Map();
    this.ident = new DeviceIdentification(this);
    this._midiAccess = null;
    this._statechangeMidiEventHandler = undefined;
    this.io = new MidiIO(this);

    // SysexClient takes callbacks for MIDI events and identity responses
    this.client = new SysexClient(
      this.devices,
      (device, message) => this.dispatchMidiEvent(device, message),
      (input, idResponse) => this.ident.onIdentityResponse(input, idResponse),
    );

    // Event callbacks
    this.callbacks = new Map([
      ['found', null],
      ['lost', null],
      ['no-midi', null],
      ['inited', null],
      ['updated', null],
      ['uses_winrt', null],
    ]);
  }

  getDebug() {
    return this.debug;
  }

  log(...args) {
    if (this.debug) {
      console.debug('MIDI', ...args);
    }
  }

  addCallback(name, handler) {
    if (!this.callbacks.has(name)) {
      throw new Error(`not a valid callback ${name}`);
    }
    this.callbacks.set(name, handler);
  }

  deviceBySerial(serial) {
    return this.devices.get(serial);
  }

  triggerCallback(name, ...args) {
    this.log(`triggering callback ${name}`, this.callbacks);
    const handler = this.callbacks.get(name);
    if (handler) {
      this.log('found callback', handler);
      handler(...args);
    }
  }

  periodicallyCheck() {
    if (navigator.requestMIDIAccess !== undefined) {
      if (!this.inited || this.devices.size === 0) {
        this.requestMidi();
      }
      setTimeout(() => this.periodicallyCheck(), 4000);
    }
  }

  init(options) {
    if (options) {
      if (options.debug !== undefined) {
        this.debug = options.debug;
        this.client.setDebug(this.debug);
        this.ident.setDebug(this.debug);
        this.io.setDebug(this.debug);
      }

      this.addCallback('found', options.onDeviceFound || null);
      this.addCallback('lost', options.onDeviceLost || null);
      this.addCallback('updated', options.onDeviceUpdated || null);
      this.addCallback('no-midi', options.onNoMidi || null);
      this.addCallback('inited', options.onMidiInited || null);
      this.addCallback('uses_winrt', options.onDetectedWindowsRtMidi || null);
    }

    this.requestMidi();
    setTimeout(() => this.periodicallyCheck(), 1000);
  }

  setDeviceLostLock(serial, lock) {
    const device = this.deviceBySerial(serial);
    if (device) {
      device.setDeviceLostLock(lock);
    } else {
      this.log(`could not find device ${serial} to lock`);
    }
  }

  async closePorts(serial) {
    const device = this.deviceBySerial(serial);
    if (device) {
      await device.closePorts();
    } else {
      this.log(`could not find device ${serial} to close ports`);
    }
  }

  sendTeSysexBySerial(serial, command, data) {
    const device = this.deviceBySerial(serial);
    return device?.output ? this.client.send(device.output, device.device_id, command, data) : null;
  }

  async sendAndReceiveTeSysexBySerial(serial, command, data, options, timeout) {
    const device = this.deviceBySerial(serial);
    return device ? device.sendAndReceive(command, data, options, timeout) : undefined;
  }

  addMidiEventListener(key, handler) {
    eventEmitter.add('device-midi', key, handler);
  }

  removeMidiEventListener(key, handler) {
    eventEmitter.remove('device-midi', key, handler);
  }

  dispatchMidiEvent(device, message) {
    eventEmitter.dispatch('device-midi', device, message);
  }

  sendMidiBySerial(serial, midiMessage) {
    const device = this.deviceBySerial(serial);
    return device?.output ? device.output.send(midiMessage) : null;
  }

  async ensureDeviceInBootloader(serial) {
    const device = this.deviceBySerial(serial);
    if (device) {
      return await device.ensureDeviceInBootloader();
    }
    throw new Error('no such device');
  }

  async awaitDeviceReboot(serial) {
    const device = this.deviceBySerial(serial);
    if (device) {
      await device.awaitDeviceReboot();
      return device.getObject();
    }
    throw new Error('no such device');
  }

  onDetectedWindowsRtMidi(usesWinRT) {
    this.triggerCallback('uses_winrt', usesWinRT);
  }

  onDeviceFound(device) {
    const serial = device.serial;
    this.log('onDeviceFound', serial);

    if (this.devices.has(serial)) {
      const existing = this.devices.get(serial);
      existing?.updateOnGreeted(device);
      this.triggerCallback('updated', device.getObject());
    } else {
      this.devices.set(serial, device);
      this.triggerCallback('found', device.getObject());
    }
  }

  onDeviceLost(device) {
    this.log('onDeviceLost', device.serial);
    this.devices.delete(device.serial);
    this.triggerCallback('lost', device.getObject());
  }

  requestMidi() {
    if (navigator.requestMIDIAccess === undefined) {
      this._onMidiFailed('no-midi-support');
      return;
    }

    navigator.requestMIDIAccess({ sysex: true }).then(
      (access) => this._onMidiReady(access),
      () => this._onMidiFailed('denied'),
    );
  }

  _onMidiReady(midiAccess) {
    this.io.onFirstMidiAccess(midiAccess);

    if (this._midiAccess) {
      if (this._statechangeMidiEventHandler !== null) {
        this._midiAccess.removeEventListener('statechange', this._statechangeMidiEventHandler);
      }
      this._midiAccess = midiAccess;
    } else {
      this._midiAccess = midiAccess;
      this._statechangeMidiEventHandler = (event) => this.io.onMidiStateChange(event);
    }

    if (this._statechangeMidiEventHandler !== undefined) {
      midiAccess.addEventListener('statechange', this._statechangeMidiEventHandler);
    }

    if (!this.inited) {
      this.inited = true;
      this.triggerCallback('inited');
    }
  }

  _onMidiFailed(reason) {
    this.triggerCallback('no-midi', reason);
  }

  findDeviceByPort(port) {
    for (const [, device] of this.devices.entries()) {
      if (port.type === 'output') {
        if (device.matchesOutput(port.id)) {
          return device;
        }
      } else if (device.matchesInput(port.id)) {
        return device;
      }
    }
  }
}
