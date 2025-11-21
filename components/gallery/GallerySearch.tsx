'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GallerySearchProps {
  value: string
  onSearchChange: (search: string) => void
  placeholder?: string
  className?: string
}

export function GallerySearch({ value, onSearchChange, placeholder = 'Search flows...', className }: GallerySearchProps) {
  const [searchTerm, setSearchTerm] = useState(value)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, onSearchChange])

  return (
    <div className={cn('container relative', className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  )
}

