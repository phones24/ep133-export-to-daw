import { Pattern } from './parsers';

export function calcMaxLength(patterns: Pattern[]) {
  return Math.max(...patterns.flatMap((p) => p.notes.map((n) => n.position + n.duration)));
}
