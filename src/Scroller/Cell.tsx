import * as React from 'react';
import { Item } from './types';

export interface CellRef {
  measureHeight(): number;
}

type Props<TItem> = {
  item: TItem;
  offset: number;
  children: React.ReactNode;
  setRef: (key: string, ref: CellRef | void) => void;
};

export default class Cell<TItem extends Item> extends React.Component<
  Props<TItem>
> {
  private element: HTMLElement | void = undefined;

  render() {
    const { offset, children } = this.props;
    return (
      <div
        ref={this.setRef}
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

  private setRef = (element: HTMLElement | null) => {
    const cellRef: CellRef | void = element
      ? {
          measureHeight() {
            return element.offsetHeight;
          }
        }
      : undefined;
    const { setRef, item } = this.props;
    setRef(item.key, cellRef);
  };
}
