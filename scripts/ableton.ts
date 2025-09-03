import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import xml2js from 'xml2js';
import testData from './test-data.js';

const MIN_ID = 22000;
const START_ID = 22000;
let _id = START_ID;

function koTrimRangeToSeconds(value: number, maxSeconds: number) {
  if (value < 0 || value > 65535) {
    throw new RangeError('Value must be between 0 and 65535');
  }
  return (value / 65535) * maxSeconds;
}

function koEnvRangeToSeconds(value: number, maxSeconds: number) {
  if (value < 0 || value > 255) {
    throw new RangeError('Value must be between 0 and 255');
  }
  return (value / 255) * maxSeconds;
}

function secondsToSamples(seconds: number, sampleRate: number) {
  return Math.round(seconds * sampleRate);
}

function fixIds(node: any) {
  if (Array.isArray(node)) {
    return node.map((n) => fixIds(n));
  }

  if (node?._attrs?.Id) {
    const idNum = parseInt(node._attrs.Id, 10);

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

const mainXml = await readFile(
  path.resolve(import.meta.dirname, '../src/lib/exporters/templates/project.xml'),
);

const midiTrackXml = await readFile(
  path.resolve(import.meta.dirname, '../src/lib/exporters/templates/midiTrack.xml'),
);

const midiClipXml = await readFile(
  path.resolve(import.meta.dirname, '../src/lib/exporters/templates/midiClip.xml'),
);

const samplerXml = await readFile(
  path.resolve(import.meta.dirname, '../src/lib/exporters/templates/sampler.xml'),
);

const simplerXml = await readFile(
  path.resolve(import.meta.dirname, '../src/lib/exporters/templates/simpler.xml'),
);

const parser = new xml2js.Parser({
  attrkey: '_attrs',
  charkey: '_text',
  explicitArray: false,
  explicitCharkey: true,
});

const root = await parser.parseStringPromise(mainXml);
const midiTrackTemplate = await parser.parseStringPromise(midiTrackXml);
const midiClipTemplate = await parser.parseStringPromise(midiClipXml);
const samplerTemplate = await parser.parseStringPromise(samplerXml);
const simplerTemplate = await parser.parseStringPromise(simplerXml);

root.Ableton.LiveSet.MainTrack.DeviceChain.Mixer.Tempo.Manual._attrs.Value = '117';
root.Ableton.LiveSet.Tracks.MidiTrack = [];
// console.log(root.Ableton.LiveSet.Tracks);

testData.tracks.forEach((koTrack, trackIdx) => {
  const midiTrack = structuredClone(midiTrackTemplate.MidiTrack);

  midiTrack._attrs.Id = trackIdx;
  midiTrack._attrs.SelectedToolPanel = '2';
  midiTrack._attrs.SelectedTransformationName = '';
  midiTrack._attrs.SelectedGeneratorName = '';
  midiTrack.Name.EffectiveName._attrs.Value = koTrack.name;
  midiTrack.Name.UserName._attrs.Value = koTrack.name;
  midiTrack.Color._attrs.Value = 8 + trackIdx;
  midiTrack.DeviceChain.MainSequencer.ClipTimeable.ArrangerAutomation.Events.MidiClip = [];
  midiTrack.DeviceChain.Mixer.Volume.Manual._attrs.Value = koTrack.volume / 2;

  if (koTrack.sampleName) {
    midiTrack.DeviceChain.DeviceChain.Devices = structuredClone(simplerTemplate);
    midiTrack.DeviceChain.DeviceChain.Devices.OriginalSimpler.LastPresetRef = {};
    midiTrack.DeviceChain.DeviceChain.Devices.OriginalSimpler.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleRef.FileRef.RelativePath._attrs.Value = `Samples/Imported/${koTrack.sampleName}`;
    midiTrack.DeviceChain.DeviceChain.Devices.OriginalSimpler.Player.MultiSampleMap.SampleParts.MultiSamplePart.Name._attrs.Value =
      koTrack.name;

    midiTrack.DeviceChain.DeviceChain.Devices.OriginalSimpler.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleStart._attrs.Value =
      koTrack.trimLeft;

    midiTrack.DeviceChain.DeviceChain.Devices.OriginalSimpler.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleEnd._attrs.Value =
      koTrack.trimRight;

    midiTrack.DeviceChain.DeviceChain.Devices.OriginalSimpler.VolumeAndPan.Envelope.ReleaseTime.Manual._attrs.Value =
      koEnvRangeToSeconds(koTrack.release, koTrack.soundLength) * 1000;

    midiTrack.DeviceChain.DeviceChain.Devices.OriginalSimpler.Pitch.TransposeKey.Manual._attrs.Value =
      koTrack.pitch || 0;
  }
  // if (koTrack.sampleName) {
  //   midiTrack.DeviceChain.DeviceChain.Devices = structuredClone(samplerTemplate);
  //   midiTrack.DeviceChain.DeviceChain.Devices.MultiSampler.LastPresetRef = {};
  //   midiTrack.DeviceChain.DeviceChain.Devices.MultiSampler.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleRef.FileRef.RelativePath._attrs.Value = `Samples/Imported/${koTrack.sampleName}`;
  //   midiTrack.DeviceChain.DeviceChain.Devices.MultiSampler.Player.MultiSampleMap.SampleParts.MultiSamplePart.Name._attrs.Value =
  //     koTrack.name;

  //   midiTrack.DeviceChain.DeviceChain.Devices.MultiSampler.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleStart._attrs.Value =
  //     koTrack.trimLeft;

  //   midiTrack.DeviceChain.DeviceChain.Devices.MultiSampler.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleEnd._attrs.Value =
  //     koTrack.trimRight;

  //   midiTrack.DeviceChain.DeviceChain.Devices.MultiSampler.VolumeAndPan.Envelope.ReleaseTime.Manual._attrs.Value =
  //     koEnvRangeToSeconds(koTrack.release, koTrack.soundLength) * 1000;
  // }

  const koLane = testData.lanes.find((l) => l.padCode === koTrack.padCode);

  if (!koLane) {
    return;
  }

  koLane.clips.forEach((koClip, clipIdx) => {
    const midiClip = structuredClone(midiClipTemplate.MidiClip);
    const time = koClip.offset * 4;
    const start = time;
    const end = time + koClip.sceneBars * 4;

    midiClip._attrs.Id = clipIdx;
    midiClip._attrs.Time = time;
    midiClip.CurrentStart._attrs.Value = start;
    midiClip.CurrentEnd._attrs.Value = end;
    midiClip.Loop.LoopOn._attrs.Value = 'true';
    midiClip.Loop.LoopStart._attrs.Value = 0;
    midiClip.Loop.LoopEnd._attrs.Value = koClip.bars * 4;
    midiClip.Loop.HiddenLoopStart._attrs.Value = 0;
    midiClip.Loop.HiddenLoopEnd._attrs.Value = koClip.bars * 4;
    midiClip.Color._attrs.Value = midiTrack.Color._attrs.Value;

    // ableton group notes
    const grouppedNotes = koClip.notes.reduce<Record<number, any>>((acc, note) => {
      const group = note.note;
      acc[group] = acc[group] || [];
      acc[group].push(note);

      return acc;
    }, {});

    midiClip.Notes.KeyTracks.KeyTrack = [];
    let _noteId = 0;

    Object.entries(grouppedNotes).forEach(([note, notes], groupIndex) => {
      midiClip.Notes.KeyTracks.KeyTrack.push({
        _attrs: {
          Id: groupIndex,
        },
        Notes: {
          MidiNoteEvent: notes.map((note, noteIndex) => {
            let dur = note.duration / 96;
            const nextNote = notes[noteIndex + 1];

            if (nextNote && dur > nextNote.position / 96) {
              // making sure same notes are not overlapping
              dur = nextNote.position / 96 - note.position / 96;
            }

            return {
              _attrs: {
                Time: note.position / 96,
                Duration: dur,
                Velocity: note.velocity,
                OffVelocity: 64,
                NoteId: _noteId++,
              },
            };
          }),
        },
        MidiKey: {
          _attrs: {
            Value: note,
          },
        },
      });
    });

    midiTrack.DeviceChain.MainSequencer.ClipTimeable.ArrangerAutomation.Events.MidiClip.push(
      midiClip,
    );
  });

  root.Ableton.LiveSet.Tracks.MidiTrack.push(midiTrack);
});

// console.log(root.Ableton.LiveSet.Tracks.MidiTrack[0]);

const builder = new xml2js.Builder({
  attrkey: '_attrs',
  charkey: '_text',
});

const fixedRoot = fixIds(root);
fixedRoot.Ableton.LiveSet.NextPointeeId._attrs.Value = _id + 1;

const newXml = builder.buildObject(fixedRoot);

console.log(newXml);

const gzipped = gzipSync(newXml);

await writeFile('/home/yura/Downloads/5/project_NEW Project/project_NEW.als', gzipped);
