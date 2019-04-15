import * as React from 'react';
import Runway from './Runway';
import Cell from './Cell';

type Props<Item> = {
  items: ReadonlyArray<Item>;
  render: (item: Item) => React.ReactNode;
  keyProvider: (item: Item) => string;
};

type State<Item> = {
  rendition: ReadonlyArray<{ item: Item; offset: number }>;
  runwayHeight: number;
};

export default class Scroller<Item> extends React.Component<
  Props<Item>,
  State<Item>
> {
  private readonly heights: Map<string, number>;

  constructor(props: Props<Item>) {
    super(props);
    const initialRendition =
      props.items.length > 0 ? [{ item: props.items[0], offset: 0 }] : [];
    const initialRunwayHeight = 1000;
    this.state = {
      rendition: initialRendition,
      runwayHeight: initialRunwayHeight
    };
    this.heights = new Map();
  }

  render() {
    const { items, render, keyProvider } = this.props;
    const { runwayHeight, rendition } = this.state;
    return (
      <Runway height={runwayHeight}>
        {rendition.map(({ item, offset }) => (
          <Cell offset={offset} key={keyProvider(item)}>
            {render(item)}
          </Cell>
        ))}
      </Runway>
    );
  }
}
