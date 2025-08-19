import type { ObjectId } from "mongodb"

export interface LostFound {
  _id?: ObjectId
  authorId: ObjectId
  authorName: string
  type: "lost" | "found"
  title: string
  description: string
  category: "electronics" | "clothing" | "books" | "accessories" | "other"
  location?: string
  date?: Date
  contactInfo?: string
  imageUrl?: string
  status: "open" | "resolved"
  claimedBy?: ObjectId
  claimedByName?: string
  claimedAt?: Date
  comments: Comment[]
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  _id?: ObjectId
  authorId: ObjectId
  authorName: string
  content: string
  createdAt: Date
}
