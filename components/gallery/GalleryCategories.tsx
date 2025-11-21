'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FlowQueryOptions } from '@/lib/flows/types'

interface GalleryCategoriesProps {
  selectedCategory: string | null
  onCategorySelect: (category: string | null) => void
  className?: string
}

const CATEGORIES = [
  { id: 'all', label: 'All', domain: null },
  { id: 'ecommerce', label: 'E-commerce', domain: 'E-commerce' },
  { id: 'saas', label: 'SaaS', domain: 'SaaS' },
  { id: 'mobile', label: 'Mobile App', domain: 'Mobile App' },
  { id: 'landing', label: 'Landing Page', domain: 'Landing Page' },
  { id: 'dashboard', label: 'Dashboard', domain: 'Dashboard' },
  { id: 'portfolio', label: 'Portfolio', domain: 'Portfolio' },
  { id: 'blog', label: 'Blog', domain: 'Blog' },
] as const

export function GalleryCategories({ selectedCategory, onCategorySelect, className }: GalleryCategoriesProps) {
  return (
    <div className={cn('container', className)}>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategorySelect(category.id)}
          >
            {category.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

