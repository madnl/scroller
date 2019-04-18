import * as React from 'react';
import VerticalSegment from './VerticalSegment';

export interface RunwayRef {
  measureSegment(): VerticalSegment;
}

type Props = {
  height: number;
  children: React.ReactNode;
  setRef: (ref: RunwayRef | void) => void;
};

export default class Runway extends React.Component<Props> {
  render() {
    const { height, children } = this.props;
    return (
      <div
        ref={this.handleRef}
        style={{ position: 'relative', height: `${height}px` }}
      >
        {children}
      </div>
    );
  }

  private handleRef = (element: HTMLElement | null) => {
    const ref: RunwayRef | void = element
      ? {
          measureSegment() {
            const rect = element.getBoundingClientRect();
            return new VerticalSegment(rect.top, rect.height);
          }
        }
      : undefined;
    const { setRef } = this.props;
    setRef(ref);
  };
}
