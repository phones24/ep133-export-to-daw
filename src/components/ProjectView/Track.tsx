import { ComponentChild as ReactNode } from 'preact';

function Track({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative h-[40px] bg-gray-200 full-w bg-[url(/track-bg.svg)] bg-repeat-x flex"
      style={{ backgroundSize: 'auto 100%' }}
    >
      {children}
    </div>
  );
}

export default Track;
