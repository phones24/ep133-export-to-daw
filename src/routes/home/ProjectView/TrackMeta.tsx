import { ViewPattern } from '~/lib/transformers/webView';
import { getPadDisplayName } from '~/lib/utils';

function TrackMeta({ pattern }: { pattern: ViewPattern }) {
  let name = pattern.soundName;

  if (!name && pattern.midiChannel) {
    name = `[MIDI ch. ${pattern.midiChannel}]`;
  }

  if (!name && pattern.soundId >= 1000) {
    name = `[SUPERTONE]`;
  }

  const isEmptyWithSample = pattern.notes.length === 0 && pattern.soundId > 0;
  const padDisplay = getPadDisplayName(pattern.group, pattern.padNumber);

  return (
    <div className="p-2 h-10 bg-[#b0babe] rounded w-[200px] flex items-center gap-2 ">
      <div className="shrink-0 text-sm capitalize whitespace-nowrap font-bold size-[28px] gap-0.5 bg-[#9ba4a7] rounded-sm flex justify-center items-center">
        <span className="text-white/80">{padDisplay[0]}</span>
        <span className="text-white">{padDisplay.slice(2)}</span>
      </div>
      <div className={`truncate text-sm ${isEmptyWithSample ? 'text-gray-500' : ''}`} title={name}>
        {name}
      </div>
    </div>
  );
}

export default TrackMeta;
