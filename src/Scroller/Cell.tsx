import * as React from 'react';
import { Item } from './types';

export interface CellRef {
  measureHeight(): number;
}

const MUTATION_CONFIG = {
  attributes: true,
  childList: true,
  subtree: true
};

type Props<TItem> = {
  item: TItem;
  offset: number;
  children: React.ReactNode;
  onLayoutChange: (key: string) => void;
  setRef: (key: string, ref: CellRef | void) => void;
};

export default class Cell<TItem extends Item> extends React.Component<
  Props<TItem>
> {
  private element: HTMLElement | void = undefined;
  private mutationObserver: MutationObserver | void = undefined;

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

  private handleMutation = () => {
    const { onLayoutChange, item } = this.props;
    onLayoutChange(item.key);
  };

  private setRef = (element: HTMLElement | null) => {
    const {
      setRef,
      item: { key }
    } = this.props;
    if (element) {
      setRef(key, {
        measureHeight() {
          return element.offsetHeight;
        }
      });
      this.startMutationTracking(element);
    } else {
      setRef(key, undefined);
      this.stopMutationTracking();
    }
  };

  private startMutationTracking(target: HTMLElement) {
    this.stopMutationTracking();
    if (target) {
      this.mutationObserver = new MutationObserver(this.handleMutation);
      this.mutationObserver.observe(target, MUTATION_CONFIG);
    }
  }

  private stopMutationTracking() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = undefined;
    }
  }
}
