import type { ObjectId } from "mongodb"

export interface Ticket {
  _id?: ObjectId
  studentId: ObjectId
  assignedTo?: ObjectId
  title: string
  description: string
  category: "academic" | "technical" | "administrative" | "other"
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in-progress" | "resolved" | "closed"
  attachments?: string[]
  replies: TicketReply[]
  createdAt: Date
  updatedAt: Date
}

export interface TicketReply {
  _id?: ObjectId
  userId: ObjectId
  message: string
  attachments?: string[]
  createdAt: Date
}
