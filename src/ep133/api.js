import { Midi } from './midi';

const instance = new Midi();

export const api = {
  init: (options) => instance.init(options),

  requestMidi: () => instance.requestMidi(),

  hasDevice: (serial) => !!instance.deviceBySerial(serial),

  sendTeSysexBySerial: (serial, command, data) =>
    instance.sendTeSysexBySerial(serial, command, data),

  sendAndReceiveTeSysexBySerial: async (serial, command, data, options = null, timeout) =>
    await instance.sendAndReceiveTeSysexBySerial(serial, command, data, options, timeout),

  sendMidi: (serial, midiMessage) => instance.sendMidiBySerial(serial, midiMessage),

  addMidiEventListener: (key, handler) => instance.addMidiEventListener(key, handler),

  removeMidiEventListener: (key, handler) => instance.removeMidiEventListener(key, handler),

  exitBootloader: async (serial) => {
    const device = instance.deviceBySerial(serial);
    if (!device) return false;
    await device.exitBootloader();
    return true;
  },

  ensureDeviceInBootloader: async (serial) => await instance.ensureDeviceInBootloader(serial),

  setDeviceLostLock: (serial, lock) => instance.setDeviceLostLock(serial, lock),

  awaitDeviceReboot: (serial) => instance.awaitDeviceReboot(serial),

  closePorts: async (serial) => await instance.closePorts(serial),
};
