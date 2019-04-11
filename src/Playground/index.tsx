import * as React from 'react';
import Scroller from '../Scroller';
import Box from './Box';
import { repeat, insertBeforeIndex, insertAfterIndex } from '../util';

type Props = {
  itemCount: number;
};

type Item = {
  id: string;
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

  const render = React.useCallback(
    (item: Item) => (
      <Box
        context={item}
        onInsertAbove={handleInsertAbove}
        onInsertBelow={handleInsertBelow}
        label={item.label}
        color={item.color}
      />
    ),
    [handleInsertAbove, handleInsertBelow]
  );
  const keyProvider = React.useCallback((item: Item) => item.id, []);

  return <Scroller keyProvider={keyProvider} items={items} render={render} />;
}

const createItem = (index: number): Item => ({
  id: String(index),
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
