import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // numbers before and after current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= safeCurrentPage - delta && i <= safeCurrentPage + delta)
      ) {
        pages.push(i);
      } else if (
        pages[pages.length - 1] !== '...' &&
        (i < safeCurrentPage - delta || i > safeCurrentPage + delta)
      ) {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 border-t border-border text-xs text-muted-foreground">
      {/* Thông tin số lượng */}
      <div className="flex items-center gap-3">
        <span>
          Hiển thị <b>{startItem}</b> - <b>{endItem}</b> trên tổng số <b>{totalItems}</b> bản ghi
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Điều hướng phân trang */}
      <div className="flex items-center gap-1">
        {/* Nút Đầu trang */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage <= 1}
          className="h-8 w-8 p-0"
          title="Trang đầu"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Nút Trước */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className="h-8 w-8 p-0"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Các số trang */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1.5 text-muted-foreground">
                  ...
                </span>
              );
            }
            const isCurrent = p === safeCurrentPage;
            return (
              <Button
                key={`page-${p}`}
                variant={isCurrent ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(p as number)}
                className={`h-8 min-w-8 px-2 text-xs ${
                  isCurrent ? 'bg-primary text-primary-foreground font-bold' : ''
                }`}
              >
                {p}
              </Button>
            );
          })}
        </div>

        {/* Nút Tiếp */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          className="h-8 w-8 p-0"
          title="Trang tiếp"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Nút Cuối trang */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage >= totalPages}
          className="h-8 w-8 p-0"
          title="Trang cuối"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
