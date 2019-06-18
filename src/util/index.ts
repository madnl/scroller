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

export const minBy = <T>(
  list: ReadonlyArray<T>,
  fn: (item: T) => number
): T | void => {
  if (list.length === 0) {
    return undefined;
  }
  let best = list[0];
  let minValue = fn(best);
  for (let i = 1; i < list.length; i++) {
    const item = list[i];
    const value = fn(item);
    if (value < minValue) {
      minValue = value;
      best = item;
    }
  }
  return best;
};

export const filterKeys = <K, V>(
  map: ReadonlyMap<K, V>,
  predicate: (value: V, key: K) => boolean
): Set<K> => {
  const result: Set<K> = new Set();
  map.forEach((v, k) => {
    if (predicate(v, k)) {
      result.add(k);
    }
  });
  return result;
};

export const constant = <V>(value: V) => (): V => value;

export const emptySet: <V>() => ReadonlySet<V> = constant(new Set());
