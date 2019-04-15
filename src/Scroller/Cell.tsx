import * as React from 'react';

type Props = { offset: number; children: React.ReactNode };

export default class Cell extends React.Component<Props> {
  render() {
    const { offset, children } = this.props;
    return (
      <div
        style={{
          position: 'absolute',
          transform: `translateY(${offset}px)`,
          width: '100%'
        }}
      >
        {children}
      </div>
    );
  }
}
