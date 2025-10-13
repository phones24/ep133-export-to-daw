import { ViewNote } from '../../lib/transformers/webView';

export function SingleNote({ note }: { note: ViewNote }) {
  return (
    <div
      className="p-1 rounded-sm bg-[#192a3c] h-[40px] text-white text-xs border-l-1 border-white absolute overflow-hidden"
      style={{
        left: note.position,
        width: note.duration,
        zIndex: note.position,
      }}
    >
      {note.name}
    </div>
  );
}
