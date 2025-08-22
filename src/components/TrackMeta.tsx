import { ViewPattern } from '../lib/renderViewTransformer';

function TrackMeta({ pattern }: { pattern: ViewPattern }) {
  return (
    <div className="p-2 h-[40px] bg-[#b0babe] rounded w-[200px] flex items-center gap-2">
      <div className="text-sm capitalize text-gray-100 whitespace-nowrap font-bold min-w-[26px]">
        {pattern.group}
        {pattern.padNumber}
      </div>
      <div className="truncate">{pattern.soundName}</div>
    </div>
  );
}

export default TrackMeta;
