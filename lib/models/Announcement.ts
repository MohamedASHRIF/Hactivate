import type { ObjectId } from "mongodb"

export interface Announcement {
  _id?: ObjectId
  authorId: ObjectId
  title: string
  content: string
  category: "general" | "academic" | "event" | "urgent"
  targetAudience: ("student" | "lecturer" | "admin")[]
  attachments?: string[]
  isPinned: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}
