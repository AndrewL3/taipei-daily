export interface PaginateAllOptions {
  maxPages?: number;
}

export async function paginateAll<T>(
  fetcher: (page: number, size: number) => Promise<T[]>,
  size: number = 1000,
  options: PaginateAllOptions = {},
): Promise<T[]> {
  const results: T[] = [];
  let page = 0;
  const maxPages = options.maxPages ?? Number.POSITIVE_INFINITY;
  while (true) {
    if (page >= maxPages) {
      throw new Error(`Pagination exceeded max pages (${maxPages})`);
    }
    const batch = await fetcher(page, size);
    if (batch.length === 0) break;
    results.push(...batch);
    page++;
  }
  return results;
}
