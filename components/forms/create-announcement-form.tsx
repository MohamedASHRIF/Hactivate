"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

// Target Audience Categories (shared constants)
const TARGET_AUDIENCES = {
  STUDENT: "student",
  LECTURER: "lecturer", 
  ADMIN: "admin"
} as const

const TARGET_AUDIENCE_OPTIONS = [
  { value: TARGET_AUDIENCES.STUDENT, label: "Students", description: "All enrolled students" },
  { value: TARGET_AUDIENCES.LECTURER, label: "Lecturers", description: "Faculty and teaching staff" },
  { value: TARGET_AUDIENCES.ADMIN, label: "Administrators", description: "Administrative staff" }
] as const

// Announcement Categories
const ANNOUNCEMENT_CATEGORIES = {
  GENERAL: "general",
  ACADEMIC: "academic", 
  EVENT: "event",
  URGENT: "urgent"
} as const

const ANNOUNCEMENT_CATEGORY_OPTIONS = [
  { 
    value: ANNOUNCEMENT_CATEGORIES.GENERAL, 
    label: "General", 
    description: "General information and updates"
  },
  { 
    value: ANNOUNCEMENT_CATEGORIES.ACADEMIC, 
    label: "Academic", 
    description: "Academic-related announcements"
  },
  { 
    value: ANNOUNCEMENT_CATEGORIES.EVENT, 
    label: "Events", 
    description: "University events and activities"
  },
  { 
    value: ANNOUNCEMENT_CATEGORIES.URGENT, 
    label: "Urgent", 
    description: "Urgent announcements requiring immediate attention"
  }
] as const

type TargetAudience = typeof TARGET_AUDIENCES[keyof typeof TARGET_AUDIENCES]
type AnnouncementCategory = typeof ANNOUNCEMENT_CATEGORIES[keyof typeof ANNOUNCEMENT_CATEGORIES]

interface CreateAnnouncementFormProps {
  onSubmit: (data: any) => Promise<void>
}

export default function CreateAnnouncementForm({ onSubmit }: CreateAnnouncementFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    targetAudience: [] as string[],
    isPinned: false,
    expiresAt: "",
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }
    
    if (!formData.content.trim()) {
      alert('Please enter content')
      return
    }
    
    if (!formData.category) {
      alert('Please select a category')
      return
    }
    
    if (formData.targetAudience.length === 0) {
      alert('Please select at least one target audience')
      return
    }
    
    console.log('Submitting form data:', formData)
    
    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
      
      // Reset form after successful submission
      setFormData({
        title: "",
        content: "",
        category: "",
        targetAudience: [],
        isPinned: false,
        expiresAt: "",
      })
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAudienceChange = (audience: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        targetAudience: [...formData.targetAudience, audience],
      })
    } else {
      setFormData({
        ...formData,
        targetAudience: formData.targetAudience.filter((a) => a !== audience),
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Announcement title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {ANNOUNCEMENT_CATEGORY_OPTIONS.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div>
                  <div className="font-medium">{category.label}</div>
                  <div className="text-sm text-muted-foreground">{category.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Target Audience</Label>
        <div className="space-y-3">
          {TARGET_AUDIENCE_OPTIONS.map((audience) => (
            <div key={audience.value} className="flex items-center space-x-2">
              <Checkbox
                id={audience.value}
                checked={formData.targetAudience.includes(audience.value)}
                onCheckedChange={(checked) => handleAudienceChange(audience.value, checked as boolean)}
              />
              <Label htmlFor={audience.value} className="text-sm font-medium">
                {audience.label}
              </Label>
              <span className="text-xs text-muted-foreground">- {audience.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Announcement content"
          className="min-h-[120px]"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="pinned"
          checked={formData.isPinned}
          onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked as boolean })}
        />
        <Label htmlFor="pinned">Pin this announcement</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiresAt">Expires At (Optional)</Label>
        <Input
          id="expiresAt"
          type="datetime-local"
          value={formData.expiresAt}
          onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating...
          </>
        ) : (
          'Create Announcement'
        )}
      </Button>
    </form>
  )
}
