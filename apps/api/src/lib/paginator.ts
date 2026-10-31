export type PaginationInput = {
  page?: number;
  limit?: number;
};

export function paginate<T>(items: T[], input: PaginationInput) {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.max(1, Math.min(100, input.limit ?? 20));
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    data: items.slice(start, end),
    meta: {
      page,
      limit,
      total: items.length,
      hasNext: end < items.length,
    },
  };
}
