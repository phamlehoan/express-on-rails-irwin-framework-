import { buildPaginatedResponse, parsePagination } from "ts-rails";

describe("Pagination", () => {
  it("parsePagination returns default values", () => {
    const result = parsePagination({});
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
    expect(result.skip).toBe(0);
  });

  it("parsePagination parses query params", () => {
    const result = parsePagination({ page: "2", perPage: "10" });
    expect(result.page).toBe(2);
    expect(result.perPage).toBe(10);
    expect(result.skip).toBe(10);
  });

  it("buildPaginatedResponse returns correct meta", () => {
    const data = [1, 2, 3];
    const result = buildPaginatedResponse(data, 25, { page: 2, perPage: 10 });
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.meta.total).toBe(25);
    expect(result.meta.totalPages).toBe(3);
    expect(result.meta.hasNext).toBe(true);
    expect(result.meta.hasPrev).toBe(true);
  });
});
