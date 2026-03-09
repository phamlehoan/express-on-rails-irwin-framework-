/**
 * Pagination helper - tương tự Kaminari/will_paginate trong Rails.
 */

export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

export function parsePagination(query: {
  page?: string | number;
  per_page?: string | number;
  perPage?: string | number;
}): { page: number; perPage: number; skip: number } {
  const page = Math.max(
    1,
    parseInt(String(query.page || DEFAULT_PAGE), 10) || DEFAULT_PAGE
  );
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(
      1,
      parseInt(
        String(query.per_page || query.perPage || DEFAULT_PER_PAGE),
        10
      ) || DEFAULT_PER_PAGE
    )
  );
  const skip = (page - 1) * perPage;
  return { page, perPage, skip };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: { page: number; perPage: number }
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.perPage);
  return {
    data,
    meta: {
      page: params.page,
      perPage: params.perPage,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}
