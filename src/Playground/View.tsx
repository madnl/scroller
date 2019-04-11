import * as React from 'react';

type Props = {
  direction?: 'row' | 'column';
  style?: React.CSSProperties;
  children?: React.ReactNode;
  justifyContent?: 'center' | 'space-around';
  alignItems?: 'center';
};

export default function View({
  direction,
  style,
  children,
  justifyContent,
  alignItems
}: Props) {
  return (
    <div
      style={{
        ...style,
        display: 'flex',
        flexDirection: direction || 'column',
        justifyContent: justifyContent || 'space-around',
        alignItems: alignItems || 'center'
      }}
    >
      {children}
    </div>
  );
}
