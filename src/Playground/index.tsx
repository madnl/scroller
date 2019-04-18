import * as React from 'react';
import Scroller from '../Scroller';
import Box from './Box';
import { repeat, insertBeforeIndex, insertAfterIndex } from '../util';

type Props = {
  itemCount: number;
};

type Item = {
  key: string;
  label: string;
  color: string;
};

export default function Playground({ itemCount }: Props) {
  const counter = React.useRef(0);

  const generateItem = () => {
    const index = counter.current;
    counter.current++;
    return createItem(index);
  };

  const initialItemList: ReadonlyArray<Item> = React.useMemo(
    () => repeat(itemCount, generateItem),
    [itemCount]
  );

  const [items, setItems] = React.useState(initialItemList);
  console.log('Render', { items });

  const handleInsertAbove = React.useCallback(
    (item: Item) => {
      setItems(insertBeforeIndex(items, items.indexOf(item), generateItem()));
    },
    [items]
  );

  const handleInsertBelow = React.useCallback(
    (item: Item) => {
      setItems(insertAfterIndex(items, items.indexOf(item), generateItem()));
    },
    [items]
  );

  const list = React.useMemo(
    () =>
      items.map(item => ({
        key: item.key,
        node: (
          <Box
            context={item}
            onInsertAbove={handleInsertAbove}
            onInsertBelow={handleInsertBelow}
            label={item.label}
            color={item.color}
          />
        )
      })),
    [items, handleInsertAbove, handleInsertBelow]
  );

  return <Scroller itemHeightEstimate={100} list={list} />;
}

const createItem = (index: number): Item => ({
  key: String(index),
  label: String(index),
  color: palette[index % palette.length]
});

const palette = [
  'rgba(228, 87, 46, 1)',
  'rgba(23, 190, 187, 1)',
  'rgba(255, 201, 20, 1)',
  'rgba(46, 40, 42, 1)',
  'rgba(118, 176, 65, 1)'
];
