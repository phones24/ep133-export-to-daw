import { create } from 'xmlbuilder2';

const MIN_ID = 22000;
const START_ID = 22000;

let _id = START_ID;
const templateCache: Record<string, any> = {};

export async function loadTemplate<T>(templateName: string): Promise<T> {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }

  let templateModule: any;
  switch (templateName) {
    case 'midiClip':
      templateModule = await import('./templates/midiClip.xml?raw');
      break;
    case 'midiTrack':
      templateModule = await import('./templates/midiTrack.xml?raw');
      break;
    case 'project':
      templateModule = await import('./templates/project.xml?raw');
      break;
    case 'sampler':
      templateModule = await import('./templates/sampler.xml?raw');
      break;
    case 'simpler':
      templateModule = await import('./templates/simpler.xml?raw');
      break;
    case 'scene':
      templateModule = await import('./templates/scene.xml?raw');
      break;
    case 'groupTrack':
      templateModule = await import('./templates/groupTrack.xml?raw');
      break;
    case 'drumRack':
      templateModule = await import('./templates/drumRack.xml?raw');
      break;
    case 'drumBranch':
      templateModule = await import('./templates/drumBranch.xml?raw');
      break;
    default:
      throw new Error(`Unknown template: ${templateName}`);
  }

  const parsed = create(templateModule.default).toObject();
  templateCache[templateName] = parsed;
  return parsed as T;
}

export function koEnvRangeToSeconds(value: number, maxSeconds: number) {
  if (value < 0 || value > 255) {
    throw new RangeError('Value must be between 0 and 255');
  }
  return (value / 255) * maxSeconds;
}

export function fixIds(node: any): any {
  if (Array.isArray(node)) {
    return node.map((n) => fixIds(n));
  }

  if (node?.['@Id']) {
    const idNum = parseInt(String(node['@Id']), 10);

    if (idNum > MIN_ID) {
      node['@Id'] = _id;

      _id++;
    }
  }

  if (typeof node === 'object') {
    Object.keys(node).forEach((key) => {
      if (!key.startsWith('@')) {
        node[key] = fixIds(node[key]);
      }
    });
  }

  return node;
}

export function getId() {
  return _id;
}

export async function gzipString(content: string) {
  const encoder = new TextEncoder();
  const input = encoder.encode(content);

  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();

  writer.write(input);
  writer.close();

  const compressed = await new Response(cs.readable).arrayBuffer();

  return compressed;
}
