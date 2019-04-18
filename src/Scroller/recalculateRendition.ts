import { Rendition, Item, RenderedItem, List } from './types';
import VerticalSegment from './VerticalSegment';
import { minBy } from '../util';
import { relative } from 'path';
import HeightCache from './HeightCache';
import Layout, { Decision } from './Layout';

type Params = {
  list: ReadonlyArray<Item>;
  currentRendition: Rendition;
  viewport: VerticalSegment;
  heightCache: HeightCache;
};

export default function recalculateRendition({
  currentRendition,
  viewport,
  list,
  heightCache
}: Params): Rendition {
  if (list.length === 0) {
    return [];
  }

  const pivot = findPivot(currentRendition, viewport) || {
    item: list[0],
    offset: 0
  };

  const pivotIndex = list.findIndex(item => item.key === pivot.item.key);

  const layout = Layout.createFromPivot({
    list,
    pivotIndex,
    pivotOffset: pivot.offset,
    heightCache
  });
  if (!layout) {
    return currentRendition;
  }

  const buffer: Array<RenderedItem> = [];

  const consumer = (item: Item, itemSegment: VerticalSegment) => {
    if (itemSegment.overlapsWith(viewport)) {
      buffer.push({ item, offset: itemSegment.top });
      return Decision.Continue;
    } else {
      return Decision.Stop;
    }
  };

  layout.traverseUpwards({
    includePivot: false,
    consumer
  });

  layout.traverseDownwards({
    includePivot: true,
    consumer
  });

  layout;

  return buffer;
}

const findPivot = (
  rendition: Rendition,
  relativeViewport: VerticalSegment
): RenderedItem | void => {
  return minBy(rendition, ({ offset }) =>
    Math.abs(offset - relativeViewport.top)
  );
};
