"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface CreateForumPostFormProps {
  onSubmit: (data: any) => Promise<void>
  userRole?: "student" | "lecturer" | "admin"
  userDepartment?: string
}

const FORUM_CATEGORIES = [
  { value: "academic", label: "Academic", description: "Course-related questions and discussions" },
  { value: "technical", label: "Technical", description: "Technical issues and programming help" },
  { value: "general", label: "General", description: "General university discussions" },
  { value: "career", label: "Career", description: "Career advice and job opportunities" },
  { value: "social", label: "Social", description: "Social events and activities" }
] as const

export default function CreateForumPostForm({ onSubmit, userRole, userDepartment }: CreateForumPostFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "academic",
    tags: [] as string[],
    isAnonymous: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newTag, setNewTag] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      // Reset form
      setFormData({
        title: "",
        content: "",
        category: "academic",
        tags: [],
        isAnonymous: false
      })
    } catch (error) {
      console.error("Error creating forum post:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      })
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Question Title *
        </Label>
        <Input
          id="title"
          placeholder="What's your question?"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="h-10"
          required
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium">
          Category *
        </Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {FORUM_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div>
                  <div className="font-medium">{category.label}</div>
                  <div className="text-xs text-muted-foreground">{category.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content" className="text-sm font-medium">
          Question Details *
        </Label>
        <Textarea
          id="content"
          placeholder="Provide detailed information about your question..."
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="min-h-[120px] resize-none"
          required
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags" className="text-sm font-medium">
          Tags (optional)
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={handleAddTag}>
            Add
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Anonymous Option */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="anonymous"
          checked={formData.isAnonymous}
          onCheckedChange={(checked) => setFormData({ ...formData, isAnonymous: checked as boolean })}
        />
        <Label htmlFor="anonymous" className="text-sm">
          Post anonymously
        </Label>
      </div>

      {/* Department Info */}
      {userDepartment && (
        <div className="text-sm text-muted-foreground">
          This post will be visible to your department: <span className="font-medium">{userDepartment}</span>
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Creating Post...
          </>
        ) : (
          "Create Post"
        )}
      </Button>
    </form>
  )
} 