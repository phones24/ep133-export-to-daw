import { create } from 'xmlbuilder2';

export const TIME_SIGNATURES: { [key: string]: number } = {
  '1/4': 196,
  '2/4': 198,
  '3/4': 200,
  '4/4': 201,
  '5/4': 202,
  '6/4': 203,
  '7/4': 204,
  '8/4': 205,
  '5/8': 206,
  '6/8': 207,
  '7/8': 208,
  '9/8': 209,
  '12/8': 210,
  '3/2': 211,
  '4/2': 212,
  '5/2': 213,
  '6/2': 214,
  '7/2': 215,
  '1/2': 216,
  '1/1': 217,
  '2/1': 218,
  '3/1': 219,
  '4/1': 220,
  '5/1': 221,
  '3/8': 299,
};
const MIN_ID = 22000;
const START_ID = 22000;

let _id = START_ID;
const templateCache: Record<string, any> = {};

const templateMap: Record<string, () => Promise<any>> = {
  midiClip: () => import('./templates/midiClip.xml?raw'),
  midiTrack: () => import('./templates/midiTrack.xml?raw'),
  project: () => import('./templates/project.xml?raw'),
  sampler: () => import('./templates/sampler.xml?raw'),
  simpler: () => import('./templates/simpler.xml?raw'),
  scene: () => import('./templates/scene.xml?raw'),
  groupTrack: () => import('./templates/groupTrack.xml?raw'),
  drumRack: () => import('./templates/drumRack.xml?raw'),
  drumBranch: () => import('./templates/drumBranch.xml?raw'),
  returnTrack: () => import('./templates/returnTrack.xml?raw'),
  trackSendHolder: () => import('./templates/trackSendHolder.xml?raw'),
  effectReverb: () => import('./templates/effectReverb.xml?raw'),
  effectDelay: () => import('./templates/effectDelay.xml?raw'),
  effectChorus: () => import('./templates/effectChorus.xml?raw'),
  effectDistortion: () => import('./templates/effectDistortion.xml?raw'),
  effectFilter: () => import('./templates/effectFilter.xml?raw'),
  effectCompressor: () => import('./templates/effectCompressor.xml?raw'),
};

export async function loadTemplate<T>(templateName: string): Promise<T> {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }

  const importFn = templateMap[templateName];
  if (!importFn) {
    throw new Error(`Unknown template: ${templateName}`);
  }

  const templateModule = await importFn();
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
