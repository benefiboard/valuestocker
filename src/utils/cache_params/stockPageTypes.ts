// src/utils/cache_params/stockPageTypes.ts

export interface CacheData<
  T extends Record<string, any> & { industry: string; subindustry: string }
> {
  data: T[];
  timestamp: number;
  industries: string[];
  subIndustries: string[];
}

export interface StockPageConfig<
  T extends Record<string, any> & { industry: string; subindustry: string }
> {
  cacheKey: string;
  fetchFunction: () => Promise<StockDataResult<T>>;
  cacheDuration: number;
  defaultSort: {
    field: string;
    direction: 'asc' | 'desc';
  };
  defaultFilters: Record<string, any>;
  itemsPerPage: number;
}

export interface StockDataResult<
  T extends Record<string, any> & { industry: string; subindustry: string }
> {
  stocks: T[];
  industries: string[];
  subIndustries: string[];
  error: string | null;
}

export interface FilterState {
  [key: string]: any;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

export interface StockPageState<
  T extends Record<string, any> & { industry: string; subindustry: string }
> {
  // 데이터
  stocks: T[];
  filteredStocks: T[];
  currentItems: T[];
  industries: string[];
  subIndustries: string[];

  // 상태
  loading: boolean;
  error: string;

  // 필터
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  resetFilters: () => void;

  // 정렬
  sort: SortState;
  setSort: (sort: SortState) => void;
  toggleSort: (field: string) => void;

  // 페이지네이션
  pagination: PaginationState;
  setPagination: (pagination: Partial<PaginationState>) => void;
  handlePageChange: (page: number) => void;

  // 유틸리티
  refreshData: () => Promise<void>;
}

export interface URLParams {
  page?: string;
  sort?: string;
  direction?: string;
  [key: string]: string | undefined;
}
