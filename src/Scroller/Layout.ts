import { List, Item } from './types';
import VerticalSegment from './VerticalSegment';
import HeightCache from './HeightCache';

export type Consumer = (item: Item, segment: VerticalSegment) => Decision;

export enum Decision {
  Continue,
  Stop
}

type Params = {
  list: List;
  pivotIndex: number;
  pivotOffset: number;
  heightCache: HeightCache;
};

export default class Layout {
  private readonly pivotIndex: number;
  private readonly list: List;
  private readonly pivotOffset: number;
  private readonly heightCache: HeightCache;

  static createFromPivot(params: Params): Layout | void {
    return indexWithinBounds(params.list, params.pivotIndex)
      ? new Layout(params)
      : undefined;
  }

  private constructor({ list, pivotIndex, pivotOffset, heightCache }: Params) {
    this.list = list;
    this.pivotIndex = pivotIndex;
    this.pivotOffset = pivotOffset;
    this.heightCache = heightCache;
  }

  traverseUpwards(options: { consumer: Consumer; includePivot: boolean }) {
    const { consumer, includePivot } = options;
    let previousTop = includePivot ? this.pivotBottom() : this.pivotTop();
    let index = includePivot ? this.pivotIndex : this.pivotIndex - 1;

    while (indexWithinBounds(this.list, index)) {
      const item = this.list[index];
      const itemHeight = this.heightCache.get(item.key);
      const itemBottom = previousTop;
      const segment = new VerticalSegment(itemBottom - itemHeight, itemHeight);
      const decision = consumer(item, segment);
      if (decision === Decision.Stop) {
        return;
      }
      previousTop = segment.top;
      index = index - 1;
    }
  }

  traverseDownwards(options: { consumer: Consumer; includePivot: boolean }) {
    const { consumer, includePivot } = options;
    let previousBottom = includePivot ? this.pivotTop() : this.pivotBottom();
    let index = includePivot ? this.pivotIndex : this.pivotIndex + 1;
    while (indexWithinBounds(this.list, index)) {
      const item = this.list[index];
      const itemHeight = this.heightCache.get(item.key);
      const itemTop = previousBottom;
      const segment = new VerticalSegment(itemTop, itemHeight);
      const decision = consumer(item, segment);
      if (decision === Decision.Stop) {
        return;
      }
      previousBottom = segment.bottom;
      index = index + 1;
    }
  }

  private pivotBottom() {
    return this.pivotOffset + this.heightCache.get(this.pivotKey());
  }

  private pivotTop() {
    return this.pivotOffset;
  }

  private pivotKey() {
    return this.list[this.pivotIndex].key;
  }
}

const indexWithinBounds = (list: List, index: number) =>
  index >= 0 && index < list.length;
