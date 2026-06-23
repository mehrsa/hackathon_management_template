import { useMemo } from 'react';

export function useNextSortOrder<T extends { sortOrder: number }>(items: T[]) {
  return useMemo(
    () =>
      items.reduce(
        (maxSortOrder, item) => Math.max(maxSortOrder, item.sortOrder),
        0
      ) + 1,
    [items]
  );
}
