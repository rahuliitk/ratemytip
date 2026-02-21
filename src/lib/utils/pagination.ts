import { PAGINATION } from "@/lib/constants";

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export function parsePagination(
  params: { page?: string; pageSize?: string },
  defaultPageSize = PAGINATION.DEFAULT_PAGE_SIZE
): PaginationParams {
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const pageSize = Math.min(
    PAGINATION.MAX_PAGE_SIZE,
    Math.max(1, parseInt(params.pageSize ?? String(defaultPageSize), 10) || defaultPageSize)
  );
  return { page, pageSize };
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  };
}

export function getPrismaSkipTake(params: PaginationParams): { skip: number; take: number } {
  return {
    skip: (params.page - 1) * params.pageSize,
    take: params.pageSize,
  };
}
