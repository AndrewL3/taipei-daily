import { describe, expect, it } from "@jest/globals";
import { paginateAll } from "../pagination.js";

describe("paginateAll", () => {
  it("fetches all pages until empty array", async () => {
    const pages: number[][] = [
      [1, 2, 3],
      [4, 5, 6],
      [7],
      [], // signals end
    ];
    const fetcher = async (page: number, _size: number) => pages[page] ?? [];

    const results = await paginateAll(fetcher, 3);
    expect(results).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("returns empty array when first page is empty", async () => {
    const fetcher = async (
      _page: number,
      _size: number,
    ): Promise<number[]> => [];

    const results = await paginateAll(fetcher, 10);
    expect(results).toEqual([]);
  });

  it("throws when pagination exceeds the configured page cap", async () => {
    const fetcher = async (): Promise<number[]> => [1];

    await expect(
      paginateAll(fetcher, 10, { maxPages: 2 }),
    ).rejects.toThrow("Pagination exceeded max pages (2)");
  });
});
