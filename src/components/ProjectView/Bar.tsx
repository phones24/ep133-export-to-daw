import clsx from 'clsx';
import { ComponentChild as ReactNode } from 'preact';

export function Bar({
  children,
  length,
  barLength,
  index,
}: {
  children: ReactNode;
  length: number;
  barLength: number;
  index: number;
}) {
  return (
    <div
      className={clsx('h-full relative overflow-hidden', {
        hidden: length === 0,
        'bg-red-500/10': index % 2 === 0,
        'bg-blue-500/10': index % 2 === 1,
      })}
      style={{ width: length * barLength * 24 }}
    >
      {children}
    </div>
  );
}
