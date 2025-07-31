"use client"

import React, { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Sparkles, RefreshCw } from "lucide-react"
import { DEPARTMENT_OPTIONS } from "@/lib/constants/departments"

// Constants
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

const ANNOUNCEMENT_CATEGORIES = {
  GENERAL: "general",
  ACADEMIC: "academic",
  EVENT: "event",
  URGENT: "urgent"
} as const

const ANNOUNCEMENT_CATEGORY_OPTIONS = [
  { value: ANNOUNCEMENT_CATEGORIES.GENERAL, label: "General", description: "General information and updates" },
  { value: ANNOUNCEMENT_CATEGORIES.ACADEMIC, label: "Academic", description: "Academic-related announcements" },
  { value: ANNOUNCEMENT_CATEGORIES.EVENT, label: "Events", description: "University events and activities" },
  { value: ANNOUNCEMENT_CATEGORIES.URGENT, label: "Urgent", description: "Urgent announcements requiring immediate attention" }
] as const

// Types
type TargetAudience = typeof TARGET_AUDIENCES[keyof typeof TARGET_AUDIENCES]
type AnnouncementCategory = typeof ANNOUNCEMENT_CATEGORIES[keyof typeof ANNOUNCEMENT_CATEGORIES]

interface CreateAnnouncementFormProps {
  onSubmit: (data: any) => Promise<void>
  userRole?: "student" | "lecturer" | "admin"
  userDepartment?: string
}

// Component
export default function CreateAnnouncementForm({ onSubmit, userRole, userDepartment }: CreateAnnouncementFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    targetAudience: userRole === "lecturer" ? ["student"] : [] as string[],
    isDepartmentSpecific: false,
    targetDepartments: [] as string[],
    isPinned: false,
    expiresAt: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestions, setSuggestions] = useState<{
    title?: string[]
    content?: string
    improvements?: string[]
  }>({})
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showAISuggestions, setShowAISuggestions] = useState(false)

  // Debounced AI suggestions
  const getSuggestions = useCallback(async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      setSuggestions({})
      return
    }

    setIsLoadingSuggestions(true)
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'announcement_suggestion',
          title: formData.title,
          content: formData.content,
          category: formData.category,
          targetAudience: formData.targetAudience,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || {})
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [formData.title, formData.content, formData.category, formData.targetAudience])

  // Auto-generate suggestions when content changes
  useEffect(() => {
    if (!showAISuggestions) return
    
    const timeoutId = setTimeout(() => {
      getSuggestions()
    }, 1000) // 1 second debounce

    return () => clearTimeout(timeoutId)
  }, [getSuggestions, showAISuggestions])

  const applyTitleSuggestion = (suggestion: string) => {
    setFormData({ ...formData, title: suggestion })
  }

  const applyContentSuggestion = (suggestion: string) => {
    setFormData({ ...formData, content: suggestion })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.title.trim()) {
      alert("Please enter a title")
      return
    }

    if (!formData.content.trim()) {
      alert("Please enter content")
      return
    }

    if (!formData.category) {
      alert("Please select a category")
      return
    }

    if (formData.targetAudience.length === 0) {
      alert("Please select at least one target audience")
      return
    }

    // For lecturers and admins, if department-specific is selected, ensure at least one department is selected
    if ((userRole === "lecturer" || userRole === "admin") && formData.isDepartmentSpecific && formData.targetDepartments.length === 0) {
      alert("Please select at least one department")
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(formData)
      setFormData({
        title: "",
        content: "",
        category: "",
        targetAudience: userRole === "lecturer" ? ["student"] : [],
        isDepartmentSpecific: false,
        targetDepartments: [],
        isPinned: false,
        expiresAt: "",
      })
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAudienceChange = (audience: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        targetAudience: [...formData.targetAudience, audience]
      })
    } else {
      setFormData({
        ...formData,
        targetAudience: formData.targetAudience.filter((a) => a !== audience)
      })
    }
  }

  const handleDepartmentChange = (department: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        targetDepartments: [...formData.targetDepartments, department]
      })
    } else {
      setFormData({
        ...formData,
        targetDepartments: formData.targetDepartments.filter((d) => d !== department)
      })
    }
  }

  const handleDepartmentSpecificChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isDepartmentSpecific: checked,
      targetDepartments: checked ? (userDepartment ? [userDepartment] : []) : []
    })
  }

  return (
    <div className="space-y-4">
      {/* AI Suggestions Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant={showAISuggestions ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAISuggestions(!showAISuggestions)}
            className="flex items-center space-x-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Suggestions</span>
          </Button>
          {showAISuggestions && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={getSuggestions}
              disabled={isLoadingSuggestions}
              className="flex items-center space-x-1"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          )}
        </div>
        {showAISuggestions && (
          <Badge variant="secondary">
            <Lightbulb className="h-3 w-3 mr-1" />
            AI Assistant
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Title */}
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

            {/* Category */}
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

            {/* Target Audience */}
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <div className="space-y-3">
                {TARGET_AUDIENCE_OPTIONS.map((audience) => {
                  if (userRole === "lecturer" && audience.value !== "student") return null
                  return (
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
                  )
                })}
              </div>
              {userRole === "lecturer" && (
                <p className="text-sm text-muted-foreground mt-2">
                  Lecturers can only post announcements to students
                </p>
              )}
              {userRole === "admin" && (
                <p className="text-sm text-muted-foreground mt-2">
                  Admins can target any combination of students, lecturers, and administrators
                </p>
              )}
            </div>

            {/* Department Selection for Lecturers and Admins */}
            {(userRole === "lecturer" || userRole === "admin") && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="departmentSpecific"
                    checked={formData.isDepartmentSpecific}
                    onCheckedChange={(checked) => handleDepartmentSpecificChange(checked as boolean)}
                  />
                  <Label htmlFor="departmentSpecific" className="text-sm font-medium">
                    Target specific departments
                  </Label>
                </div>
                
                {formData.isDepartmentSpecific && (
                  <div className="space-y-3 ml-6">
                    <p className="text-sm text-muted-foreground">
                      {userRole === "lecturer" 
                        ? "Select which departments should receive this announcement:"
                        : "Select which departments should receive this announcement (leave empty for all departments):"
                      }
                    </p>
                    <ScrollArea className="h-32 border rounded-md p-3">
                      <div className="grid grid-cols-1 gap-2">
                        {DEPARTMENT_OPTIONS.map((department) => (
                          <div key={department.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={department.value}
                              checked={formData.targetDepartments.includes(department.value)}
                              onCheckedChange={(checked) => handleDepartmentChange(department.value, checked as boolean)}
                            />
                            <Label htmlFor={department.value} className="text-sm">
                              {department.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    {userRole === "lecturer" && userDepartment && (
                      <p className="text-xs text-muted-foreground">
                        Your department ({userDepartment}) is automatically selected
                      </p>
                    )}
                    {userRole === "admin" && (
                      <p className="text-xs text-muted-foreground">
                        If no departments are selected, the announcement will be sent to all departments
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
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

            {/* Pinned */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pinned"
                checked={formData.isPinned}
                onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked as boolean })}
              />
              <Label htmlFor="pinned">Pin this announcement</Label>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires At (Optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>

            {/* Submit Button - Fixed at bottom */}
            <div className="sticky bottom-0 bg-background pt-4 border-t">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Announcement"
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* AI Suggestions Panel */}
        {showAISuggestions && (
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>AI Suggestions</span>
                  {isLoadingSuggestions && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title Suggestions */}
                {suggestions.title && suggestions.title.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Title Suggestions</Label>
                    <div className="space-y-2">
                      {suggestions.title.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-2 text-sm border rounded-md hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => applyTitleSuggestion(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Suggestions */}
                {suggestions.content && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Enhanced Content</Label>
                    <div
                      className="p-3 text-sm border rounded-md hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => applyContentSuggestion(suggestions.content!)}
                    >
                      <div className="whitespace-pre-wrap">{suggestions.content}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Click to apply this enhanced version
                      </div>
                    </div>
                  </div>
                )}

                {/* Improvement Tips */}
                {suggestions.improvements && suggestions.improvements.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Improvement Tips</Label>
                    <div className="space-y-2">
                      {suggestions.improvements.map((tip, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!isLoadingSuggestions && Object.keys(suggestions).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start typing to get AI suggestions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
