import { ViewPattern } from '~/lib/transformers/webView';

function TrackMeta({ pattern }: { pattern: ViewPattern }) {
  let name = pattern.soundName;

  if (!name && pattern.midiChannel) {
    name = `[MIDI ch. ${pattern.midiChannel}]`;
  }

  if (!name && pattern.isSynth) {
    name = `[SUPERTONE]`;
  }

  return (
    <div className="p-2 h-10 bg-[#b0babe] rounded w-[200px] flex items-center gap-2 ">
      <div className="text-sm capitalize text-gray-100 whitespace-nowrap font-bold min-w-[26px]">
        {pattern.group}
        {pattern.padNumber}
      </div>
      <div className="truncate text-sm" title={name}>
        {name}
      </div>
    </div>
  );
}

export default TrackMeta;
