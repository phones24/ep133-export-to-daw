import { Note, noteNumberToName } from '../lib/parsers';

export function SingleNote({ note }: { note: Note }) {
  return (
    <div
      className="p-1 rounded-sm bg-[#192a3c] h-[40px] text-white text-xs border-l-1 border-white absolute overflow-hidden"
      style={{
        left: note.position,
        width: note.duration,
      }}
    >
      {noteNumberToName(note.note)}
    </div>
  );
}
