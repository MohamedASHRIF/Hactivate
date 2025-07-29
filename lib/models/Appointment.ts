import type { ObjectId } from "mongodb"

export interface Appointment {
  _id?: ObjectId
  lecturerId: ObjectId
  studentId: ObjectId
  title: string
  description?: string
  startTime: Date
  endTime: Date
  // status: pending (requested), accepted (teacher approved), rejected (teacher denied), completed, cancelled, rescheduled
  status: "pending" | "accepted" | "rejected" | "scheduled" | "completed" | "cancelled" | "rescheduled"
  meetingLink?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface TimeSlot {
  _id?: ObjectId
  lecturerId: ObjectId
  startTime: Date
  endTime: Date
  isAvailable: boolean
  recurring?: {
    type: "weekly" | "daily"
    endDate: Date
  }
  createdAt: Date
}
