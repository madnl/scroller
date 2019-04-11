export const repeat = <T>(times: number, generator: () => T): Array<T> => {
  const result = new Array(times);
  for (let i = 0; i < times; i++) {
    result[i] = generator();
  }
  return result;
};

export const insertBeforeIndex = <T>(
  items: ReadonlyArray<T>,
  index: number,
  item: T
): ReadonlyArray<T> => {
  if (index < 0) {
    return items;
  }
  return [...items.slice(0, index), item, ...items.slice(index)];
};

export const insertAfterIndex = <T>(
  items: ReadonlyArray<T>,
  index: number,
  item: T
): ReadonlyArray<T> => insertBeforeIndex(items, index + 1, item);
