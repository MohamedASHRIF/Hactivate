import type { ObjectId } from "mongodb"

export interface Announcement {
  _id?: ObjectId
  authorId: ObjectId
  title: string
  content: string
  category: "general" | "academic" | "event" | "urgent"
  targetAudience: ("student" | "lecturer" | "admin")[]
  targetDepartments?: string[] // Array of department names for department-specific announcements
  isDepartmentSpecific: boolean // Whether this announcement is for specific departments only
  attachments?: string[]
  isPinned: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}
