// Target Audience Categories
export const TARGET_AUDIENCES = {
  STUDENT: "student",
  LECTURER: "lecturer", 
  ADMIN: "admin"
} as const

export const TARGET_AUDIENCE_OPTIONS = [
  { 
    value: TARGET_AUDIENCES.STUDENT, 
    label: "Students", 
    description: "All enrolled students",
    icon: "GraduationCap"
  },
  { 
    value: TARGET_AUDIENCES.LECTURER, 
    label: "Lecturers", 
    description: "Faculty and teaching staff",
    icon: "Users"
  },
  { 
    value: TARGET_AUDIENCES.ADMIN, 
    label: "Administrators", 
    description: "Administrative staff",
    icon: "Shield"
  }
] as const

// Announcement Categories
export const ANNOUNCEMENT_CATEGORIES = {
  GENERAL: "general",
  ACADEMIC: "academic", 
  EVENT: "event",
  URGENT: "urgent"
} as const

export const ANNOUNCEMENT_CATEGORY_OPTIONS = [
  { 
    value: ANNOUNCEMENT_CATEGORIES.GENERAL, 
    label: "General", 
    description: "General information and updates",
    icon: "Info",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800"
  },
  { 
    value: ANNOUNCEMENT_CATEGORIES.ACADEMIC, 
    label: "Academic", 
    description: "Academic-related announcements",
    icon: "BookOpen",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900"
  },
  { 
    value: ANNOUNCEMENT_CATEGORIES.EVENT, 
    label: "Events", 
    description: "University events and activities",
    icon: "Calendar",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900"
  },
  { 
    value: ANNOUNCEMENT_CATEGORIES.URGENT, 
    label: "Urgent", 
    description: "Urgent announcements requiring immediate attention",
    icon: "AlertTriangle",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900"
  }
] as const

// Type exports
export type TargetAudience = typeof TARGET_AUDIENCES[keyof typeof TARGET_AUDIENCES]
export type AnnouncementCategory = typeof ANNOUNCEMENT_CATEGORIES[keyof typeof ANNOUNCEMENT_CATEGORIES]

// Helper functions
export const getTargetAudienceLabel = (audience: TargetAudience): string => {
  const audienceOption = TARGET_AUDIENCE_OPTIONS.find(option => option.value === audience)
  return audienceOption?.label || audience
}

export const getTargetAudienceLabels = (audiences: TargetAudience[]): string => {
  return audiences.map(getTargetAudienceLabel).join(", ")
}

export const getCategoryLabel = (category: AnnouncementCategory): string => {
  const categoryOption = ANNOUNCEMENT_CATEGORY_OPTIONS.find(option => option.value === category)
  return categoryOption?.label || category
}

export const getCategoryColor = (category: AnnouncementCategory): string => {
  const categoryOption = ANNOUNCEMENT_CATEGORY_OPTIONS.find(option => option.value === category)
  return categoryOption?.color || "text-gray-600 dark:text-gray-400"
}

export const getCategoryBgColor = (category: AnnouncementCategory): string => {
  const categoryOption = ANNOUNCEMENT_CATEGORY_OPTIONS.find(option => option.value === category)
  return categoryOption?.bgColor || "bg-gray-100 dark:bg-gray-800"
}

// Validation functions
export const isValidTargetAudience = (audience: string): audience is TargetAudience => {
  return Object.values(TARGET_AUDIENCES).includes(audience as TargetAudience)
}

export const isValidAnnouncementCategory = (category: string): category is AnnouncementCategory => {
  return Object.values(ANNOUNCEMENT_CATEGORIES).includes(category as AnnouncementCategory)
}
