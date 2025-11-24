'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { FlowQueryOptions } from '@/lib/flows/types'

interface GalleryFiltersProps {
  filters: Partial<FlowQueryOptions>
  onFiltersChange: (filters: Partial<FlowQueryOptions>) => void
}

const DOMAINS = [
  'E-commerce',
  'SaaS',
  'Mobile App',
  'Landing Page',
  'Dashboard',
  'Portfolio',
  'Blog',
  'Other',
]

const STYLES = [
  'Modern',
  'Minimal',
  'Bold',
  'Retro',
  'Professional',
  'Playful',
  'Elegant',
  'Rustic',
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'updatedAt', label: 'Recently Updated' },
  { value: 'name', label: 'Name (A-Z)' },
]

export function GalleryFilters({ filters, onFiltersChange }: GalleryFiltersProps) {
  const handleFilterChange = (key: keyof FlowQueryOptions, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value || undefined,
    })
  }

  return (
    <div className="container space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Domain Filter */}
        <div className="space-y-2">
          <Label htmlFor="domain-filter">Domain</Label>
          <Select
            value={filters.domain || 'all'}
            onValueChange={(value) => handleFilterChange('domain', value)}
          >
            <SelectTrigger id="domain-filter">
              <SelectValue placeholder="All domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              {DOMAINS.map((domain) => (
                <SelectItem key={domain} value={domain}>
                  {domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Style Filter */}
        <div className="space-y-2">
          <Label htmlFor="style-filter">Style</Label>
          <Select
            value={filters.theme || 'all'}
            onValueChange={(value) => handleFilterChange('theme', value)}
          >
            <SelectTrigger id="style-filter">
              <SelectValue placeholder="All styles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All styles</SelectItem>
              {STYLES.map((style) => (
                <SelectItem key={style} value={style}>
                  {style}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Filter */}
        <div className="space-y-2">
          <Label htmlFor="sort-filter">Sort by</Label>
          <Select
            value={filters.sortBy || 'createdAt'}
            onValueChange={(value) => handleFilterChange('sortBy', value as 'createdAt' | 'updatedAt' | 'name')}
          >
            <SelectTrigger id="sort-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Filters */}
      {(filters.domain || filters.theme || filters.search) && (
        <div className="flex justify-end">
          <button
            onClick={() => onFiltersChange({ sortBy: filters.sortBy, sortOrder: filters.sortOrder })}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

