'use client'

interface LibrarySearchProps {
  value?: string
  onSearchChange?: (search: string) => void
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
}

export function LibrarySearch(props: LibrarySearchProps) {
  return <div>LibrarySearch - Coming soon</div>
}
