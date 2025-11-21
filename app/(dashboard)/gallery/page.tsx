'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { GallerySearch } from '@/components/gallery/GallerySearch'
import { GalleryFilters } from '@/components/gallery/GalleryFilters'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { GalleryCategories } from '@/components/gallery/GalleryCategories'
import { Pagination } from '@/components/gallery/Pagination'
import { FlowMetadata, FlowQueryOptions, FlowStats } from '@/lib/flows/types'

const ITEMS_PER_PAGE = 12

export default function GalleryPage() {
  const [flows, setFlows] = useState<(FlowMetadata & { stats?: FlowStats })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  const [filters, setFilters] = useState<Partial<FlowQueryOptions>>({
    isPublic: true, // Only show public flows in gallery
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: ITEMS_PER_PAGE,
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>('all')

  const fetchFlows = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      
      // Add filters
      if (filters.domain) queryParams.append('domain', filters.domain)
      if (filters.theme) queryParams.append('theme', filters.theme)
      if (filters.isPublic !== undefined) queryParams.append('isPublic', String(filters.isPublic))
      if (searchTerm) queryParams.append('search', searchTerm)
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy)
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder)
      
      // Add pagination
      queryParams.append('limit', String(ITEMS_PER_PAGE))
      queryParams.append('offset', String((currentPage - 1) * ITEMS_PER_PAGE))

      const response = await fetch(`/api/flows?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch flows')
      }

      const data = await response.json()
      setFlows(data as FlowMetadata[])
      
      // For now, we don't have a total count from the API
      // We'll estimate based on whether we got a full page
      if (data.length === ITEMS_PER_PAGE) {
        setTotalCount((currentPage + 1) * ITEMS_PER_PAGE) // Estimate
      } else {
        setTotalCount((currentPage - 1) * ITEMS_PER_PAGE + data.length)
      }

      // Fetch stats for each flow
      const flowsWithStats = await Promise.all(
        data.map(async (flow: FlowMetadata) => {
          try {
            const statsResponse = await fetch(`/api/flows/${flow.id}/stats`)
            if (statsResponse.ok) {
              const stats = await statsResponse.json() as FlowStats
              return { ...flow, stats }
            }
          } catch (err) {
            console.error(`Failed to fetch stats for flow ${flow.id}:`, err)
          }
          return flow
        })
      )

      setFlows(flowsWithStats)
    } catch (err) {
      console.error('Error fetching flows:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch flows')
    } finally {
      setLoading(false)
    }
  }, [filters, searchTerm, currentPage])

  useEffect(() => {
    fetchFlows()
  }, [fetchFlows])

  const handleFiltersChange = (newFilters: Partial<FlowQueryOptions>) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleSearchChange = (search: string) => {
    setSearchTerm(search)
    setCurrentPage(1) // Reset to first page when search changes
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="container space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
        <p className="text-muted-foreground">
          Discover and explore public flows created by the community
        </p>
      </div>

      {/* Categories */}
      <GalleryCategories
        selectedCategory={selectedCategory}
        onCategorySelect={(categoryId) => {
          setSelectedCategory(categoryId)
          // Category mapping: id -> domain
          const categoryMap: Record<string, string | null> = {
            'all': null,
            'ecommerce': 'E-commerce',
            'saas': 'SaaS',
            'mobile': 'Mobile App',
            'landing': 'Landing Page',
            'dashboard': 'Dashboard',
            'portfolio': 'Portfolio',
            'blog': 'Blog',
          }
          const domain = categoryMap[categoryId || 'all'] || null
          handleFiltersChange({
            ...filters,
            domain: domain || undefined,
          })
        }}
      />

      {/* Search */}
      <GallerySearch
        value={searchTerm}
        onSearchChange={handleSearchChange}
      />

      {/* Filters */}
      <GalleryFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Error State */}
      {error && (
        <div className="container">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      <GalleryGrid flows={flows} loading={loading} />

      {/* Pagination */}
      {!loading && flows.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

