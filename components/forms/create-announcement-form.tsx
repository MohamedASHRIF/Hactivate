"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface CreateAnnouncementFormProps {
  onSubmit: (data: any) => void
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      title: "",
      content: "",
      category: "",
      targetAudience: [],
      isPinned: false,
      expiresAt: "",
    })
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
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Target Audience</Label>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="student"
              checked={formData.targetAudience.includes("student")}
              onCheckedChange={(checked) => handleAudienceChange("student", checked as boolean)}
            />
            <Label htmlFor="student">Students</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="lecturer"
              checked={formData.targetAudience.includes("lecturer")}
              onCheckedChange={(checked) => handleAudienceChange("lecturer", checked as boolean)}
            />
            <Label htmlFor="lecturer">Lecturers</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="admin"
              checked={formData.targetAudience.includes("admin")}
              onCheckedChange={(checked) => handleAudienceChange("admin", checked as boolean)}
            />
            <Label htmlFor="admin">Admins</Label>
          </div>
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

      <Button type="submit" className="w-full">
        Create Announcement
      </Button>
    </form>
  )
}
