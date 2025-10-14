import clsx from 'clsx';
import { ComponentChild as ReactNode } from 'preact';

export function Bar({
  children,
  lengthInBars,
  barLength,
  index,
}: {
  children: ReactNode;
  lengthInBars: number;
  barLength: number;
  index: number;
}) {
  return (
    <div
      className={clsx('h-full relative overflow-hidden', {
        hidden: lengthInBars === 0,
        'bg-red-500/10': index % 2 === 0,
        'bg-blue-500/10': index % 2 === 1,
      })}
      style={{ width: lengthInBars * barLength * 24 }}
    >
      {children}
    </div>
  );
}
