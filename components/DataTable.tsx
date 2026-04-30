'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxRows?: number;
  searchable?: boolean;
  loading?: boolean;
}

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchKeys = [],
  searchPlaceholder = 'Search...',
  emptyMessage = 'No records found.',
  maxRows,
  searchable = true,
  loading = false,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = data.filter((row) => {
    if (!query) return true;
    const value = query.toLowerCase();
    return searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(value));
  });

  const sorted = sortKey
    ? [...filtered].sort((left, right) => {
        const leftValue = String(left[sortKey] ?? '');
        const rightValue = String(right[sortKey] ?? '');
        return sortDir === 'asc' ? leftValue.localeCompare(rightValue) : rightValue.localeCompare(leftValue);
      })
    : filtered;

  const displayed = maxRows ? sorted.slice(0, maxRows) : sorted;

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((direction) => direction === 'asc' ? 'desc' : 'asc');
      return;
    }

    setSortKey(key);
    setSortDir('asc');
  };

  return (
    <div className="space-y-4">
      {searchable && searchKeys.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="input-dark w-full pl-9 pr-4 py-2 rounded-xl text-sm"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full table-dark">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  onClick={() => column.sortable && toggleSort(String(column.key))}
                  className={`px-4 py-3 text-left ${column.sortable ? 'cursor-pointer select-none' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && (
                      <span className="flex flex-col">
                        <ChevronUp className={`w-2.5 h-2.5 ${sortKey === column.key && sortDir === 'asc' ? 'text-primary' : 'text-white/20'}`} />
                        <ChevronDown className={`w-2.5 h-2.5 -mt-1 ${sortKey === column.key && sortDir === 'desc' ? 'text-primary' : 'text-white/20'}`} />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-white/30">
                  Loading...
                </td>
              </tr>
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-white/30">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayed.map((row, index) => (
                <motion.tr key={index} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-4 py-3 text-sm text-white/80">
                      {column.render ? column.render(row[column.key as keyof T], row) : String(row[column.key as keyof T] ?? '-')}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {maxRows && sorted.length > maxRows && (
        <p className="text-xs text-white/30 text-center">Showing {maxRows} of {sorted.length} records</p>
      )}
    </div>
  );
}
