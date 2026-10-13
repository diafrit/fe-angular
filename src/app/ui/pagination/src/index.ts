import { HlmPagination } from './lib/hlm-pagination';
import { HlmPaginationContent } from './lib/hlm-pagination-content';
import { HlmPaginationItem } from './lib/hlm-pagination-item';
import { HlmPaginationLink } from './lib/hlm-pagination-link';
import { HlmPaginationNext } from './lib/hlm-pagination-next';
import { HlmPaginationPrevious } from './lib/hlm-pagination-previous';

export * from './lib/hlm-pagination';
export * from './lib/hlm-pagination-content';
export * from './lib/hlm-pagination-item';
export * from './lib/hlm-pagination-link';
export * from './lib/hlm-pagination-next';
export * from './lib/hlm-pagination-previous';

export const HlmPaginationImports = [
  HlmPagination,
  HlmPaginationContent,
  HlmPaginationItem,
  HlmPaginationLink,
  HlmPaginationPrevious,
  HlmPaginationNext,
] as const;
