import { ViewNote } from '../../lib/transformers/webView';

export function SingleNote({ note }: { note: ViewNote }) {
  return (
    <div
      className="p-1 rounded-sm bg-[#192a3c] h-[40px] text-white text-[8px] border-l-1 border-white absolute overflow-hidden truncate"
      style={{
        left: note.position,
        width: Math.max(note.duration, 2),
        zIndex: note.position,
      }}
    >
      {note.duration > 16 ? note.name : null}
    </div>
  );
}
