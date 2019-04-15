import * as React from 'react';

type Props = { height: number; children: React.ReactNode };

export default function Runway({ height, children }: Props) {
  return (
    <div style={{ position: 'relative', height: `${height}px` }}>
      {children}
    </div>
  );
}
