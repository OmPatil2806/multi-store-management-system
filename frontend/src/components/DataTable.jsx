import { useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

/**
 * columns: [{ key, header, sortable = true, searchable = true, render?(row), accessor?(row) }]
 * accessor/render both default to row[key]. accessor drives sort/search; render drives display.
 */
export default function DataTable({ columns, data, onRowClick, searchPlaceholder = 'Search…' }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: null, direction: 'asc' })
  const [page, setPage] = useState(1)

  const getValue = (row, column) => (column.accessor ? column.accessor(row) : row[column.key])

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const term = search.trim().toLowerCase()
    const searchableColumns = columns.filter((c) => c.searchable !== false)
    return data.filter((row) =>
      searchableColumns.some((column) => {
        const value = getValue(row, column)
        return value != null && String(value).toLowerCase().includes(term)
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, search, columns])

  const sorted = useMemo(() => {
    if (!sort.key) return filtered
    const column = columns.find((c) => c.key === sort.key)
    if (!column) return filtered

    const copy = [...filtered]
    copy.sort((a, b) => {
      const aVal = getValue(a, column)
      const bVal = getValue(b, column)
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return -1
      if (bVal == null) return 1
      if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal
      return String(aVal).localeCompare(String(bVal))
    })
    if (sort.direction === 'desc') copy.reverse()
    return copy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sort, columns])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function toggleSort(column) {
    if (column.sortable === false) return
    setSort((prev) => {
      if (prev.key !== column.key) return { key: column.key, direction: 'asc' }
      if (prev.direction === 'asc') return { key: column.key, direction: 'desc' }
      return { key: null, direction: 'asc' }
    })
  }

  function handleSearchChange(value) {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-8"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  onClick={() => toggleSort(column)}
                  className={cn(column.sortable !== false && 'cursor-pointer select-none')}
                >
                  <span className="flex items-center gap-1">
                    {column.header}
                    {column.sortable !== false &&
                      (sort.key === column.key ? (
                        sort.direction === 'asc' ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
                      ))}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, i) => (
                <TableRow
                  key={row.id ?? i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(onRowClick && 'cursor-pointer')}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render ? column.render(row) : getValue(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <span>
            Page {currentPage} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
