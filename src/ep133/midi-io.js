// This file was obtained from the original sources owned by Teenage Engineering
// and is NOT covered by the GNU Affero General Public License that applies to the rest of the project.

const io_to_s = (s) => `t:${s.type} s:${s.state} c:${s.connection} id:${s.id} name: ${s.name}`;

export class MidiIO {
  constructor(midiManager) {
    // Properties
    this.midiManager = midiManager; // Main MIDI manager reference
    this.debugEnabled = true; // Debug logging flag
    this.deviceIdentifier = midiManager.ident; // Device identification manager
    this.windowsEventCheckDone = false; // Whether we handled the Windows MIDI detection quirk
    this.outputs = new Map(); // Map of connected MIDI outputs
    this.inputs = new Map(); // Map of connected MIDI inputs
  }

  log(...args) {
    if (this.debugEnabled) {
      console.debug('MIDI:IO', ...args);
    }
  }

  setDebug(enabled) {
    this.debugEnabled = enabled;
  }

  addOutputIfNeeded(outputPort) {
    // One-time Windows platform quirk handling
    if (!this.windowsEventCheckDone) {
      if (navigator.userAgentData && navigator.userAgentData.platform === 'Windows') {
        const isNotRtMidi = !outputPort.id.startsWith('output');
        this.midiManager.onDetectedWindowsRtMidi(isNotRtMidi);
      }
      this.windowsEventCheckDone = true;
    }

    if (this.outputs.has(outputPort.id)) {
      this.log(`--> output (seen) ${io_to_s(outputPort)}`);
    } else {
      this.outputs.set(outputPort.id, outputPort);
      this.deviceIdentifier.queue(outputPort);
      this.log(`--> output (new) ${io_to_s(outputPort)}`);
    }
  }

  addInputIfNeeded(inputPort) {
    if (this.inputs.has(inputPort.id)) {
      this.log(`<-- input (seen) ${io_to_s(inputPort)}`);
    } else {
      this.inputs.set(inputPort.id, inputPort);
      inputPort.onmidimessage = (event) => {
        this.midiManager.client.handleMidiMessages(inputPort, event);
      };
      this.log(`<-- input (new) ${io_to_s(inputPort)}`);
    }
  }

  onFirstMidiAccess(midiAccess) {
    midiAccess.outputs.forEach((outputPort) => {
      console.log(`midiAccess ${io_to_s(outputPort)}`);
      this.addOutputIfNeeded(outputPort);
    });

    midiAccess.inputs.forEach((inputPort) => {
      console.log(`midiAccess ${io_to_s(inputPort)}`);
      this.addInputIfNeeded(inputPort);
    });
  }

  onMidiStateChange(event) {
    console.log(`midiStateChange ${io_to_s(event.port)}`);

    const port = event.port;
    const portId = port.id;
    const state = port.state;
    const portMap = port.type === 'input' ? this.inputs : this.outputs;

    if (state === 'connected') {
      if (port.type === 'output') {
        this.addOutputIfNeeded(port);
      } else {
        this.addInputIfNeeded(port);
      }
    } else if (state === 'disconnected') {
      portMap.delete(portId);

      const device = this.midiManager.findDeviceByPort(port);
      if (device) {
        if (port.type === 'output') {
          device.outputLost((lostDevice) => {
            this.midiManager.onDeviceLost(lostDevice);
          });
        } else {
          device.inputLost((lostDevice) => {
            this.midiManager.onDeviceLost(lostDevice);
          });
        }
      }
    }
  }
}
