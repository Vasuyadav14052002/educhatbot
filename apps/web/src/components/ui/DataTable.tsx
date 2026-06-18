
interface Column { key: string; label: string; render?: (val: unknown, row: Record<string, unknown>) => React.ReactNode; width?: string; }

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({ columns, data, loading, emptyMessage = 'No records found', onRowClick }: DataTableProps<T>) {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key}>
                    <span className="skeleton" style={{ height: 16, display: 'block', width: '70%' }} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  total_pages: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, total_pages, onPage }: PaginationProps) {
  const pages = Array.from({ length: Math.min(total_pages, 7) }, (_, i) => {
    if (total_pages <= 7) return i + 1;
    if (page <= 4) return i + 1 > total_pages - 2 && i > 4 ? '...' : i + 1;
    return i + 1;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 16 }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
      >‹ Prev</button>

      {pages.map((p, i) => (
        <button
          key={i}
          className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => typeof p === 'number' && onPage(p)}
          disabled={p === '...'}
        >
          {p}
        </button>
      ))}

      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPage(page + 1)}
        disabled={page >= total_pages}
      >Next ›</button>
    </div>
  );
}
