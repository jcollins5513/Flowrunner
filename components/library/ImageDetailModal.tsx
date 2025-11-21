'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Tag, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ImageData {
  id: string
  url: string
  prompt?: string
  vibe?: string
  style?: string
  domain?: string
  tags?: string[]
  isFavorite: boolean
  usageCount: number
  createdAt: string
}

interface ImageDetailModalProps {
  image: ImageData
  onClose: () => void
  onFavoriteToggle: (imageId: string, currentFavorite: boolean) => void
}

export function ImageDetailModal({
  image,
  onClose,
  onFavoriteToggle,
}: ImageDetailModalProps) {
  const [tags, setTags] = useState<string[]>(image.tags || [])
  const [newTag, setNewTag] = useState('')
  const [savingTags, setSavingTags] = useState(false)

  const handleAddTag = async () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return

    const updatedTags = [...tags, newTag.trim()]
    setTags(updatedTags)
    setNewTag('')

    // Save to API
    setSavingTags(true)
    try {
      const response = await fetch(`/api/images/${image.id}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags }),
      })

      if (!response.ok) {
        throw new Error('Failed to update tags')
      }
    } catch (err) {
      console.error('Error updating tags:', err)
      // Revert on error
      setTags(tags)
    } finally {
      setSavingTags(false)
    }
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove)
    setTags(updatedTags)

    // Save to API
    setSavingTags(true)
    try {
      const response = await fetch(`/api/images/${image.id}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags }),
      })

      if (!response.ok) {
        throw new Error('Failed to update tags')
      }
    } catch (err) {
      console.error('Error updating tags:', err)
      // Revert on error
      setTags(tags)
    } finally {
      setSavingTags(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Image Details</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onFavoriteToggle(image.id, image.isFavorite)}
              className={cn(
                image.isFavorite && 'text-red-500'
              )}
              aria-label={image.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={cn(
                  'h-5 w-5',
                  image.isFavorite && 'fill-current'
                )}
              />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image */}
          <div className="relative aspect-video rounded-lg overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.prompt || 'Image'}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Prompt</Label>
              <p className="text-sm mt-1">{image.prompt || 'No prompt'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Usage Count</Label>
              <p className="text-sm mt-1">{image.usageCount}</p>
            </div>
            {image.vibe && (
              <div>
                <Label className="text-xs text-muted-foreground">Vibe</Label>
                <div className="mt-1">
                  <Badge variant="secondary">{image.vibe}</Badge>
                </div>
              </div>
            )}
            {image.style && (
              <div>
                <Label className="text-xs text-muted-foreground">Style</Label>
                <div className="mt-1">
                  <Badge variant="outline">{image.style}</Badge>
                </div>
              </div>
            )}
            {image.domain && (
              <div>
                <Label className="text-xs text-muted-foreground">Domain</Label>
                <p className="text-sm mt-1">{image.domain}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="text-sm mt-1">
                {new Date(image.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button
                onClick={handleAddTag}
                disabled={!newTag.trim() || savingTags}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
