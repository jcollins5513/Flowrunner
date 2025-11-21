'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { ImageSearchFilters, ImageSortOption } from '@/lib/images/search-service'
import { Filter, X } from 'lucide-react'

interface LibraryFiltersProps {
  filters: Partial<ImageSearchFilters>
  onFiltersChange: (filters: Partial<ImageSearchFilters>) => void
}

export function LibraryFilters({ filters, onFiltersChange }: LibraryFiltersProps) {
  const [filterOptions, setFilterOptions] = useState<{
    vibes: string[]
    styles: string[]
    domains: string[]
    tags: string[]
  }>({
    vibes: [],
    styles: [],
    domains: [],
    tags: [],
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Fetch filter options
    fetch('/api/images/filter-options')
      .then((res) => res.json())
      .then((data) => setFilterOptions(data))
      .catch((err) => console.error('Failed to fetch filter options:', err))
  }, [])

  const handleFilterChange = (key: keyof ImageSearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      sortBy: 'newest',
    })
  }

  const hasActiveFilters = Object.keys(filters).some(
    (key) => key !== 'sortBy' && filters[key as keyof ImageSearchFilters]
  )

  return (
    <div className="container space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
              {Object.keys(filters).filter((k) => k !== 'sortBy').length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear filters
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vibe Filter */}
            <div className="space-y-2">
              <Label>Vibe</Label>
              <Select
                value={filters.vibe || ''}
                onValueChange={(value) =>
                  handleFilterChange('vibe', value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All vibes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All vibes</SelectItem>
                  {filterOptions.vibes.map((vibe) => (
                    <SelectItem key={vibe} value={vibe}>
                      {vibe.charAt(0).toUpperCase() + vibe.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Style Filter */}
            <div className="space-y-2">
              <Label>Style</Label>
              <Select
                value={filters.style || ''}
                onValueChange={(value) =>
                  handleFilterChange('style', value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All styles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All styles</SelectItem>
                  {filterOptions.styles.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Domain Filter */}
            <div className="space-y-2">
              <Label>Domain</Label>
              <Select
                value={filters.domain || ''}
                onValueChange={(value) =>
                  handleFilterChange('domain', value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All domains</SelectItem>
                  {filterOptions.domains.map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={(filters.sortBy as string) || 'newest'}
                onValueChange={(value) =>
                  handleFilterChange('sortBy', value as ImageSortOption)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="mostUsed">Most Used</SelectItem>
                  <SelectItem value="leastUsed">Least Used</SelectItem>
                  <SelectItem value="favorites">Favorites First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Favorite Filter */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="favorites-only"
              checked={filters.isFavorite === true}
              onCheckedChange={(checked) =>
                handleFilterChange('isFavorite', checked ? true : undefined)
              }
            />
            <Label
              htmlFor="favorites-only"
              className="text-sm font-normal cursor-pointer"
            >
              Show favorites only
            </Label>
          </div>
        </div>
      )}
    </div>
  )
}
