import {
  DEVICE_AUDIO_FORMAT,
  DEVICE_SAMPLE_RATE,
  GROUPS,
  PADS,
  TE_SYSEX_FILE_CAPABILITY_READ,
  TE_SYSEX_FILE_EVENT,
} from './constants';
import { DeviceError, DeviceInitError, MetadataParseError, UnsupportedAudio } from './errors';
import { BiMap, mapAsync } from './map';
import { MutexManager } from './mutex';
import { SpeedProfiler } from './speed-profiler';
import {
  audioFormatAsBitDepth,
  cleanTeenageMeta,
  decodeAudioData,
  generatePathsFromPath,
  normalizeFileName,
  pick,
  prepareTeenageMeta,
  sleep,
  validateDeviceVersion,
} from './utils';

export class DeviceService extends EventTarget {
  constructor(device, fileHandler, resampler, debug = false) {
    super();

    validateDeviceVersion(device);

    this.device = device;
    this.fileHandler = fileHandler;
    this.resampler = resampler;
    this.debug = debug;

    this.fileNodes = new BiMap();
    this.initialized = false;
    this.soundFormats = undefined;
    this.mutexManager = new MutexManager();
    this.speedStats = new SpeedProfiler();
  }

  getSupportedFormatFor(file) {
    return this.soundFormats
      ?.filter((f) => f.type === 'pcm')
      .flatMap((f) => f.formats)
      .find((f) => f.format.includes(DEVICE_AUDIO_FORMAT) && f.channels.includes(file.channels));
  }

  getTargetSampleRate(file) {
    const format = this.getSupportedFormatFor(file);
    const maxRate = format?.['samplerate.range']?.[1];
    const nativeRate = format?.['samplerate.native'];
    const rate = maxRate || nativeRate;
    return rate ? Math.min(file.sample_rate, rate) : DEVICE_SAMPLE_RATE;
  }

  async uploadSound(file, progressCallback, offset = 0) {
    if (!file.type.includes('audio')) throw new UnsupportedAudio('file is not audio');

    await this.assertInitialized();

    const nodeId = await this.getNodeIdByPath('/sounds');
    const fileName = file.name;
    let buffer = await file.arrayBuffer();
    let audioMeta;

    try {
      audioMeta = this.resampler.getAudioMeta(fileName, buffer);
    } catch {
      throw new UnsupportedAudio('could not read audio meta');
    }

    let channels = audioMeta.channels;
    const targetRate = this.getTargetSampleRate(audioMeta);
    const meta = {
      ...prepareTeenageMeta(audioMeta, targetRate),
      channels: channels,
      samplerate: targetRate,
    };

    let audioData, formatType;

    if ((audioMeta?.length ?? 0) > 20)
      throw new UnsupportedAudio('max sample length is 20 seconds');

    if (audioMeta.sample_rate < 3000 || audioMeta.sample_rate > 768000)
      throw new UnsupportedAudio('invalid sample rate');

    const dataStart = audioMeta.extra?.data_start ?? 0;
    const dataEnd = audioMeta.extra?.data_end ?? 0;

    if (
      dataStart > 0 &&
      dataEnd > dataStart &&
      audioMeta.container === 'WAV' &&
      audioMeta.format === DEVICE_AUDIO_FORMAT &&
      audioMeta.sample_rate === DEVICE_SAMPLE_RATE &&
      (channels === 1 || channels === 2)
    ) {
      audioData = buffer.slice(dataStart, dataEnd);
    } else {
      if (progressCallback) progressCallback(0, 100, { status: 'resampling' });
      if (audioMeta.container !== 'AIFF') {
        [buffer, channels] = await decodeAudioData(buffer, audioMeta.sample_rate);
        formatType = 'pcm';
      } else {
        formatType = 'aiff';
      }

      if (!channels) throw new UnsupportedAudio('could not find number of channels');

      const bitDepth = audioFormatAsBitDepth(DEVICE_AUDIO_FORMAT);
      try {
        audioData = await this.resampler.resampleAudioData(
          buffer,
          audioMeta.sample_rate,
          targetRate,
          formatType,
          'pcm',
          bitDepth,
          channels,
        );
      } catch (err) {
        throw err instanceof Error && err.name === 'EncodingError'
          ? new UnsupportedAudio('this browser does not support the supplied audio format.')
          : err;
      }
    }

    const uploadMeta = {
      name: meta.name,
      channels: meta.channels,
      samplerate: meta.samplerate,
      format: meta.format,
      crc: meta.crc,
    };

    const nodeId1 = await this.put(
      this.device.serial,
      audioData,
      normalizeFileName(fileName),
      nodeId,
      offset,
      uploadMeta,
      progressCallback,
    );
    if (nodeId1 == null) throw new DeviceError('missing node id for uploaded file');

    await this.fileHandler.setMetadata(this.device.serial, nodeId, meta);
    await this.fileHandler.init(this.device.serial);
  }

  async uploadProjectArchive(file, progressCallback) {
    const match = file.name.match(/\w*P(\d{2})\.tar/);
    if (!match || match[1] == null) throw new Error(`${file.name} is not a valid project archive`);

    const projectId = match[1];
    const projectsNodeId = await this.getNodeIdByPath('/projects');
    const projectNodeId = await this.getNodeIdByPath(`/projects/${projectId}`);
    const buffer = await file.arrayBuffer();

    await this.put(
      this.device.serial,
      buffer,
      projectId,
      projectsNodeId,
      projectNodeId,
      null,
      progressCallback,
      true,
      [TE_SYSEX_FILE_CAPABILITY_READ],
      15000,
    );
    await this.fileHandler.init(this.device.serial);
  }

  async get(o, _, j, $, _e) {
    performance.now();
    const result = await this.fileHandler.get(o, _, j, $, _e);
    performance.now();
    return result;
  }

  async put(o, _, j, $, _e, et, tt, rt, it, at) {
    performance.now();
    const result = await this.fileHandler.put(o, _, j, $, _e, et, tt, rt, it, at);
    performance.now();
    return result;
  }

  async downloadProjectArchive(path, _) {
    await this.assertInitialized();
    const nodeId = await this.getNodeIdByPath(path);
    return await this.get(this.device.serial, nodeId, _);
  }

  async downloadSound(path, _) {
    await this.assertInitialized();
    const nodeId = await this.getNodeIdByPath(path);
    return await this.get(this.device.serial, nodeId, _);
  }

  async downloadSoundAsWav(path, _) {
    await this.assertInitialized();
    const nodeId = await this.getNodeIdByPath(path);
    const fileData = await this.get(this.device.serial, nodeId, _);
    const meta = await this.getMetadata(path);
    const length = fileData.data.reduce((acc, buf) => acc + buf.length, 0);
    const combined = new Uint8Array(length);
    let offset = 0;

    for (const buf of fileData.data) {
      combined.set(buf, offset);
      offset += buf.length;
    }

    if (!meta || !meta.channels || !meta.samplerate || !meta.format)
      throw new DeviceError('missing required metadata');

    return await this.resampler.createWav(
      fileData.name,
      {
        channels: meta.channels,
        sample_rate: meta.samplerate,
        format: meta.format,
        length: 0,
        bit_rate: 0,
        container: '',
        extra: {
          midi_root_note: meta['sound.rootnote'],
          loop_start: meta['sound.loopstart'],
          loop_end: meta['sound.loopend'],
          bpm: meta['sound.bpm'],
          json: JSON.stringify(
            cleanTeenageMeta(
              pick(
                meta,
                'sound.loopstart',
                'sound.loopend',
                'sound.playmode',
                'sound.rootnote',
                'sound.bpm',
                'sound.pitch',
                'sound.pan',
                'sound.amplitude',
                'envelope.attack',
                'envelope.release',
                'time.mode',
                'sample.mode',
                'regions',
              ),
            ),
          ),
        },
      },
      combined,
    );
  }

  async *iterDownloadSound(path, _) {
    await this.assertInitialized();
    const nodeId = await this.getNodeIdByPath(path);
    yield* this.fileHandler.iterGet(this.device.serial, nodeId, _);
  }

  async *iterDownloadSoundPreview(path, start, end) {
    await this.assertInitialized();
    const nodeId = await this.getNodeIdByPath(path);
    const range = [1, (start >> 8) & 255, start & 255, (end >> 8) & 255, end & 255];
    yield* this.fileHandler.iterGet(this.device.serial, nodeId, undefined, range);
  }

  async playback(path, delay = false) {
    await this.assertInitialized();
    const nodeId = await this.getNodeIdByPath(path);
    const delayMs = delay ? 1000 : 0;
    await this.fileHandler.startPlayback(this.device.serial, nodeId, 0, delayMs);
  }

  async stopPlayback(path) {
    await this.assertInitialized();
    const nodeId = await this.getNodeIdByPath(path);
    await this.fileHandler.stopPlayback(this.device.serial, nodeId);
  }

  async deleteSound(path) {
    await this.assertInitialized();
    const nodeId = await this.getNodeIdByPath(path);
    await this.fileHandler.delete(this.device.serial, nodeId);
    this.fileNodes.delete(path);
    await this.fileHandler.init(this.device.serial);
  }

  async assignSound(path, target) {
    await this.assertInitialized();
    const sourceNode = await this.getNodeIdByPath(path);
    const targetNode = await this.getNodeIdByPath(target);
    await this.fileHandler.setMetadata(this.device.serial, targetNode, {
      sym: sourceNode,
    });
  }

  async setSoundMetadataFromFile(path, file) {
    await this.assertInitialized();
    const buffer = await file.arrayBuffer();
    let audioMeta;
    try {
      audioMeta = this.resampler.getAudioMeta(file.name, buffer);
    } catch {
      throw new UnsupportedAudio('could not read audio meta');
    }
    const targetRate = this.getTargetSampleRate(audioMeta);
    const meta = prepareTeenageMeta(audioMeta, targetRate);
    await this.setMetadata(path, meta);
  }

  async getAudioMetadataFromFile(file) {
    const buffer = await file.arrayBuffer();
    let audioMeta;
    try {
      audioMeta = this.resampler.getAudioMeta(file.name, buffer);
    } catch {
      throw new UnsupportedAudio('could not read audio meta');
    }
    return audioMeta;
  }

  async setMetadata(path, meta) {
    await this.assertInitialized();
    const nodeId = await this.getNodeIdByPath(path);
    await this.fileHandler.setMetadata(this.device.serial, nodeId, meta);
  }

  async internalGetMetadata(deviceSerial, nodeId, retries = 2) {
    for (let i = retries; i >= 0; i--) {
      try {
        return await this.fileHandler.getMetadata(deviceSerial, nodeId);
      } catch (err) {
        if (i >= 0 && err instanceof MetadataParseError) await sleep(200);
        if (i === 0 || !(err instanceof MetadataParseError)) throw err;
      }
    }
  }

  async getMetadata(path) {
    await this.assertInitialized();
    const nodeId = await this.getNodeIdByPath(path);
    return await this.internalGetMetadata(this.device.serial, nodeId);
  }

  async setActiveProject(path) {
    await this.assertInitialized();
    const nodeId = await this.getNodeIdByPath(path);
    const projectsNodeId = await this.getNodeIdByPath('/projects');
    await this.fileHandler.setMetadata(this.device.serial, projectsNodeId, {
      active: nodeId,
    });
  }

  async setActiveGroup(path) {
    await this.assertInitialized();
    const project = await this.getActiveProject();
    if (!project) throw new DeviceError('no active project');
    const groupNode = await this.getNodeIdByPath(path);
    const groupsNode = await this.getNodeIdByPath(`/projects/${project.node.name}/groups`);
    await this.fileHandler.setMetadata(this.device.serial, groupsNode, {
      active: groupNode,
    });
  }

  async setActivePad(path) {
    await this.assertInitialized();
    const group = await this.getActiveGroup();
    if (!group) throw new DeviceError('no active group');
    const padNode = await this.getNodeIdByPath(path);
    await this.fileHandler.setMetadata(this.device.serial, group.node.id, {
      active: padNode,
    });
  }

  async setSoundName(path, name) {
    await this.assertInitialized();
    const nodeId = await this.getNodeIdByPath(path);
    name = normalizeFileName(name);
    await this.fileHandler.setMetadata(this.device.serial, nodeId, { name });
    this.dispatchEvent(new CustomEvent('SOUND_UPDATED', { detail: { path } }));
  }

  async getActiveProject() {
    await this.assertInitialized();
    const projectsNode = await this.getNodeIdByPath('/projects');
    const activeId = (await this.fileHandler.getMetadata(this.device.serial, projectsNode)).active;
    const node = await this.fileHandler.getNode(this.device.serial, activeId);
    if (!node.isWritable) return null;
    const path = `/projects/${node.name}`;
    this.fileNodes.set(path, node.id);
    return { node, path };
  }

  async getActiveGroup() {
    await this.assertInitialized();
    const project = await this.getActiveProject();
    if (!project) return null;
    const groupsNode = await this.getNodeIdByPath(`${project.path}/groups`);
    const groupsMeta = await this.fileHandler.getMetadata(this.device.serial, groupsNode);
    const node = await this.fileHandler.getNode(this.device.serial, groupsMeta.active);
    const path = `${project.path}/groups/${node.name}`;
    this.fileNodes.set(path, node.id);
    const meta = await this.fileHandler.getMetadata(this.device.serial, node.id);
    return { node, path, meta };
  }

  async *getActivePads() {
    await this.assertInitialized();
    const group = await this.getActiveGroup();
    if (!group) return;
    const iter = this.fileHandler.iterNodes(this.device.serial, group.node.id);
    yield* mapAsync(iter, async (node) => {
      const meta = await this.fileHandler.getMetadata(this.device.serial, node.id);
      const path = `${group.path}/${node.name}`;
      this.fileNodes.set(path, node.id);
      let assignedPath = null;
      if (meta.sym) {
        const symId = meta.sym;
        if (symId > 0) assignedPath = symId ? await this.getPathByNodeId(symId) : null;
      }
      return { node, meta, path, assignedPath };
    });
  }

  async *getProjectPadMeta(projectId) {
    const iter = GROUPS.flatMap((group) =>
      PADS.map((pad) => this.getMetadata(`/projects/${projectId}/groups/${group}/${pad}`)),
    );
    for (const p of iter) yield await p;
  }

  async *getAllSounds() {
    await this.assertInitialized();
    const soundsNode = await this.getNodeIdByPath('/sounds');
    const iter = this.fileHandler.iterNodes(this.device.serial, soundsNode);
    yield* mapAsync(iter, async (node) => {
      const path = `/sounds/${node.name}`;
      this.fileNodes.set(path, node.id);
      return { node, path };
    });
  }

  async getSound(path) {
    const nodeId = await this.getNodeIdByPath(path);
    const node = await this.fileHandler.getNode(this.device.serial, nodeId);
    const meta = await this.fileHandler.getMetadata(this.device.serial, node.id);
    this.fileNodes.set(path, node.id);
    return { node, meta, path };
  }

  async getPad(path) {
    const nodeId = await this.getNodeIdByPath(path);
    const node = await this.fileHandler.getNode(this.device.serial, nodeId);
    const meta = await this.fileHandler.getMetadata(this.device.serial, node.id);
    this.fileNodes.set(path, node.id);
    const symId = meta.sym ? meta.sym : null;
    let assignedPath = null;
    if (symId && symId > 0) assignedPath = symId ? await this.getPathByNodeId(symId) : null;
    return { node, meta, path, assignedPath };
  }

  async getPathByNodeId(nodeId) {
    let path = this.fileNodes.inverse.get(nodeId);
    if (!path) {
      const node = await this.fileHandler.getNode(this.device.serial, nodeId);
      let parentId = node.parentId;
      const segments = [];
      let counter = 0;
      while (parentId !== 0) {
        const cached = this.fileNodes.inverse.get(parentId);
        if (cached != null) {
          segments.push(cached);
          break;
        }
        const parentNode = await this.fileHandler.getNode(this.device.serial, parentId);
        segments.unshift(`/${parentNode.name}`);
        this.fileNodes.set(segments.join(''), parentNode.id);
        parentId = parentNode.parentId;
        counter++;
        if (counter > 100) throw new DeviceError(`could not find path for node ${nodeId}`);
      }
      segments.push(`/${node.name}`);
      path = segments.join('');
      this.fileNodes.set(path, node.id);
    }
    return path;
  }

  async getNodeIdByPath(path) {
    let nodeId = this.fileNodes.get(path);
    if (nodeId) return nodeId;

    const rootId = 0;
    if (path === '/') {
      this.fileNodes.set(path, rootId);
      return rootId;
    }

    const parentPath = path.split('/').slice(0, -1).join('/');
    const parentNodeId = this.fileNodes.get(parentPath);
    if (parentNodeId) {
      const lastSegment = path.split('/').pop();
      const iter = this.fileHandler.iterNodes(this.device.serial, parentNodeId);
      let foundId = null;
      for await (const node of iter) {
        const nodePath = parentPath + `/${node.name}`;
        this.fileNodes.set(nodePath, node.id);
        if (node.name === lastSegment) {
          foundId = node.id;
          break;
        }
      }
      if (!foundId) throw new DeviceError(`no such path ${path}`);
      return foundId;
    }

    let currentId = rootId;
    for (const partialPath of generatePathsFromPath(path)) {
      if (partialPath === path) continue;
      const iter = this.fileHandler.iterNodes(this.device.serial, currentId);
      let foundNode = null;
      for await (const node of iter) {
        const nodePath = partialPath + `/${node.name}`;
        this.fileNodes.set(nodePath, node.id);
        if (!foundNode && path.startsWith(nodePath)) foundNode = node;
      }
      if (!foundNode) break;
      currentId = foundNode.id;
    }

    nodeId = this.fileNodes.get(path);
    if (!nodeId) throw new DeviceError(`no such path ${path}`);
    return nodeId;
  }

  async assertInitialized() {
    try {
      await this.mutexManager.acquire('init');
      if (this.initialized) return;

      await this.fileHandler.init(this.device.serial);

      if (!this.soundFormats) {
        const soundsNode = await this.getNodeIdByPath('/sounds');
        const metadata = await this.internalGetMetadata(this.device.serial, soundsNode, 10);
        if (metadata) this.soundFormats = metadata.formats;
      }

      this.fileHandler.onBeforeRequest(() =>
        this.dispatchEvent(new CustomEvent('REQUEST_STARTED')),
      );
      this.fileHandler.onAfterRequest(() =>
        this.dispatchEvent(new CustomEvent('REQUEST_FINISHED')),
      );

      this.fileHandler.onFileEvent(this.device.serial, async (eventType, payload) => {
        this.log(`🔔 ${TE_SYSEX_FILE_EVENT[eventType]}: ${JSON.stringify(payload)}`);
        const path = await this.getPathByNodeId(payload.nodeId);

        switch (eventType) {
          case TE_SYSEX_FILE_EVENT.METADATA_UPDATED:
            {
              const data = payload;
              for (const [key, value] of Object.entries(data.metadata)) {
                if (key === 'active' && typeof value === 'number') {
                  const targetPath = await this.getPathByNodeId(value);
                  const depth = path.split('/').length;
                  let evtName;
                  if (depth === 2) evtName = 'PROJECT_CHANGED';
                  else if (depth === 4) evtName = 'GROUP_CHANGED';
                  else if (depth === 5) evtName = 'PAD_CHANGED';
                  else continue;
                  this.dispatchEvent(
                    new CustomEvent(evtName, {
                      detail: { path: targetPath },
                    }),
                  );
                  continue;
                }
                if (key === 'free_space_in_bytes' && typeof value === 'number') {
                  this.dispatchEvent(
                    new CustomEvent('FREE_SPACE_CHANGED', {
                      detail: { path, freeSpace: value },
                    }),
                  );
                  continue;
                }
                let assignedPath;
                if (key === 'sym' && typeof value === 'number') {
                  assignedPath = null;
                  if (value > 0) assignedPath = await this.getPathByNodeId(value);
                }
                this.dispatchEvent(
                  new CustomEvent('PAD_META_CHANGED', {
                    detail: { path, attribute: key, value, assignedPath },
                  }),
                );
              }
            }
            break;

          case TE_SYSEX_FILE_EVENT.FILE_ADDED:
          case TE_SYSEX_FILE_EVENT.FILE_UPDATED:
            {
              const meta = payload;
              const evt =
                eventType === TE_SYSEX_FILE_EVENT.FILE_UPDATED ? 'SOUND_UPDATED' : 'SOUND_ADDED';
              this.dispatchEvent(new CustomEvent(evt, { detail: { path, ...meta } }));
            }
            break;

          case TE_SYSEX_FILE_EVENT.FILE_DELETED:
            this.dispatchEvent(new CustomEvent('SOUND_ERASED', { detail: { path } }));
            break;

          default:
            throw new DeviceError('Unknown event');
        }
      });

      this.initialized = true;
    } catch (err) {
      throw new DeviceInitError('device initialization failed', err);
    } finally {
      this.mutexManager.release('init');
    }
  }

  log(message) {
    if (this.debug) console.log(message);
  }
}
