import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  email: string
  name: string
  role: "student" | "lecturer" | "admin"
  department?: string
  studentId?: string
  avatar?: string
  isOnline?: boolean
  lastSeen?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser extends User {
  password: string
}
