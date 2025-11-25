'use client'

import { useCallback } from 'react'
import { Search, LayoutGrid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LibrarySearchProps {
  value?: string
  onSearchChange?: (search: string) => void
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
}

export function LibrarySearch({ value, onSearchChange, viewMode = 'grid', onViewModeChange }: LibrarySearchProps) {
  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange?.(event.target.value)
    },
    [onSearchChange],
  )

  return (
    <div className="container flex flex-wrap items-center justify-between gap-4">
      <div className="relative flex-1 min-w-[240px] max-w-3xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={value}
          onChange={handleSearch}
          placeholder="Search prompts, tags, or styles"
          className="w-full rounded-lg pl-10"
          aria-label="Search image library"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">View</span>
        <Button
          type="button"
          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => onViewModeChange?.('grid')}
          aria-label="Grid view"
          className={cn('rounded-lg', viewMode === 'grid' && 'shadow-sm')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => onViewModeChange?.('list')}
          aria-label="List view"
          className={cn('rounded-lg', viewMode === 'list' && 'shadow-sm')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
