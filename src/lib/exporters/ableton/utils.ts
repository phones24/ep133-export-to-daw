import xml2js from 'xml2js';

const MIN_ID = 22000;
const START_ID = 22000;

let _id = START_ID;
const templateCache: Record<string, any> = {};

export async function loadTemplate<T>(templateName: string): Promise<T> {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }

  const parser = new xml2js.Parser({
    attrkey: '_attrs',
    charkey: '_text',
    explicitArray: false,
    explicitCharkey: true,
    preserveChildrenOrder: true,
    // explicitChildren: true,
  });

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
    default:
      throw new Error(`Unknown template: ${templateName}`);
  }

  const parsed = await parser.parseStringPromise(templateModule.default);
  templateCache[templateName] = parsed;
  return parsed;
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

  if (node?._attrs?.Id) {
    const idNum = parseInt(String(node._attrs.Id), 10);

    if (idNum > MIN_ID) {
      node._attrs.Id = _id;

      _id++;
    }
  }

  if (typeof node === 'object') {
    Object.keys(node).forEach((key) => {
      if (key !== '_attrs') {
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
