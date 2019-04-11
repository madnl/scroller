import * as React from 'react';

type Props<Item> = {
  items: ReadonlyArray<Item>;
  render: (item: Item) => React.ReactNode;
  keyProvider: (item: Item) => string;
};

export default class Scroller<Item> extends React.Component<Props<Item>> {
  render() {
    const { items, render, keyProvider } = this.props;
    return (
      <div>
        {items.map(item => (
          <div key={keyProvider(item)}>{render(item)}</div>
        ))}
      </div>
    );
  }
}
