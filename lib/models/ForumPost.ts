import { ObjectId } from "mongodb"

export interface ForumPost {
  _id?: ObjectId
  title: string
  content: string
  authorId: ObjectId
  authorName: string
  authorRole: "student" | "lecturer" | "admin"
  department: string
  category: "academic" | "technical" | "general" | "career" | "social"
  status: "open" | "resolved" | "closed"
  tags: string[]
  isPinned: boolean
  isAnonymous: boolean
  upvotes: ObjectId[]
  downvotes: ObjectId[]
  views: number
  replies: ForumReply[]
  createdAt: Date
  updatedAt: Date
  lastActivityAt: Date
}

export interface ForumReply {
  _id?: ObjectId
  content: string
  authorId: ObjectId
  authorName: string
  authorRole: "student" | "lecturer" | "admin"
  isAcceptedAnswer: boolean
  upvotes: ObjectId[]
  downvotes: ObjectId[]
  createdAt: Date
  updatedAt: Date
}

export interface ForumStats {
  totalPosts: number
  totalReplies: number
  resolvedPosts: number
  openPosts: number
  myPosts: number
  myReplies: number
} 