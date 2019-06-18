export type ItemKey = string;

export interface Item {
  key: ItemKey;
  node: React.ReactNode;
}

export type RenderedItem = Readonly<{ item: Item; offset: number }>;

export type Rendition = ReadonlyArray<RenderedItem>;

export type List = ReadonlyArray<Item>;
