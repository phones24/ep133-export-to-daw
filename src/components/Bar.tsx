import { ComponentChild as ReactNode } from 'preact';

export function Bar({ children, length }: { children: ReactNode; length: number }) {
  return (
    <div className="bg-red-200/10 h-full" style={{ width: length * 16 * 24 }}>
      {children}
    </div>
  );
}
