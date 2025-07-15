import type { ObjectId } from "mongodb"

export interface Message {
  _id?: ObjectId
  chatId: string
  senderId: ObjectId
  receiverId: ObjectId
  content: string
  type: "text" | "image" | "file"
  attachments?: string[]
  isRead: boolean
  createdAt: Date
}

export interface Chat {
  _id?: ObjectId
  participants: ObjectId[]
  lastMessage?: Message
  updatedAt: Date
}
