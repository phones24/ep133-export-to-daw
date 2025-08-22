import { ComponentChild as ReactNode } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

function TrackGrid({
  cellWidth,
  cellHeight,
  color1 = '#eee',
  color2 = '#ddd',
}: {
  cellWidth: number;
  cellHeight: number;
  color1?: string;
  color2?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  const { width, height } = size;
  const cols = Math.floor(width / cellWidth);
  const rows = Math.floor(height / cellHeight);
  const cells = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const blockX = Math.floor(x / 4);
      const blockY = Math.floor(y / 4);
      const flip = (blockX + blockY) % 2 === 1;

      const color = flip ? color2 : color1;

      cells.push(
        <rect
          key={`${x}-${y}`}
          x={x * cellWidth}
          y={y * cellHeight}
          width={cellWidth}
          height={cellHeight}
          fill={color}
          stroke="#999"
        />,
      );
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="none">
        {cells}
      </svg>
    </div>
  );
}

function Track({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[40px] bg-gray-200 full-w">
      <TrackGrid cellWidth={24} cellHeight={40} />
      <div className="absolute top-0 left-0 right-0 h-full">{children}</div>
    </div>
  );
}

export default Track;
