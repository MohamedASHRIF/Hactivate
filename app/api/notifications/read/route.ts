import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

// GET: Get read notifications for user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()

    // Get user's read notifications
    const readNotifications = await db.collection("notification_reads").find({
      userId: new ObjectId(decoded.userId)
    }).toArray()

    const readIds = readNotifications.map(rn => rn.notificationId)

    return NextResponse.json({ readIds })
  } catch (error) {
    console.error("Get read notifications error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST: Mark notification(s) as read
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { notificationIds, markAllAsRead } = await request.json()

    const db = await getDatabase()
    const userId = new ObjectId(decoded.userId)

    if (markAllAsRead) {
      // Mark all current notifications as read
      // First, get all current notification IDs based on recent content
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      // Get recent announcements
      const announcements = await db.collection("announcements")
        .find({
          targetAudience: { $in: [decoded.role] },
          createdAt: { $gte: weekAgo }
        })
        .toArray()

      // Get recent tickets (for admins/lecturers)
      let tickets: any[] = []
      if (decoded.role === 'admin' || decoded.role === 'lecturer') {
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
        tickets = await db.collection("tickets")
          .find({ createdAt: { $gte: threeDaysAgo } })
          .toArray()
      }

      // Get upcoming appointments
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const appointments = await db.collection("appointments")
        .find({
          $or: [
            { studentId: userId },
            { lecturerId: userId }
          ],
          startTime: { $gte: now, $lte: tomorrow },
          status: 'scheduled'
        })
        .toArray()

      // Create notification IDs
      const allNotificationIds = [
        ...announcements.map(a => `announcement-${a._id}`),
        ...tickets.map(t => `ticket-${t._id}`),
        ...appointments.map(a => `appointment-${a._id}`)
      ]

      // Mark all as read
      for (const notificationId of allNotificationIds) {
        await db.collection("notification_reads").updateOne(
          { userId, notificationId },
          { $set: { userId, notificationId, readAt: new Date() } },
          { upsert: true }
        )
      }

      return NextResponse.json({ 
        message: "All notifications marked as read",
        markedCount: allNotificationIds.length 
      })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      for (const notificationId of notificationIds) {
        await db.collection("notification_reads").updateOne(
          { userId, notificationId },
          { $set: { userId, notificationId, readAt: new Date() } },
          { upsert: true }
        )
      }

      return NextResponse.json({ 
        message: "Notifications marked as read",
        markedCount: notificationIds.length 
      })
    } else {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 })
    }

  } catch (error) {
    console.error("Mark notifications read error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
