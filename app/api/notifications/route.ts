import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()

    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'
    const unreadOnly = searchParams.get('unread') === 'true'

    if (detailed) {
      // Return detailed notifications for the user
      const query: any = { userId: new ObjectId(decoded.userId) }
      if (unreadOnly) {
        query.isRead = false
      }

      const userNotifications = await db.collection("notifications")
        .find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()

      return NextResponse.json(userNotifications)
    }

    // This endpoint returns a summary of notification counts
    // Frontend will use specific endpoints for detailed data
    
    const [announcements, tickets, appointments, userNotifications] = await Promise.all([
      // Recent announcements (last 7 days)
      db.collection("announcements")
        .find({
          targetAudience: { $in: [decoded.role] },
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
      
      // Recent tickets (if admin/lecturer)
      (decoded.role === 'admin' || decoded.role === 'lecturer') 
        ? db.collection("tickets")
            .find({
              createdAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
            })
            .sort({ createdAt: -1 })
            .limit(3)
            .toArray()
        : [],
      
      // Upcoming appointments (next 24 hours)
      db.collection("appointments")
        .find({
          $or: [
            { studentId: decoded.userId },
            { lecturerId: decoded.userId }
          ],
          startTime: {
            $gte: new Date(),
            $lte: new Date(Date.now() + 24 * 60 * 60 * 1000)
          },
          status: "scheduled"
        })
        .sort({ startTime: 1 })
        .limit(3)
        .toArray(),

      // User-specific notifications (lost & found, etc.)
      db.collection("notifications")
        .find({ 
          userId: new ObjectId(decoded.userId),
          isRead: false
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray()
    ])

    const notifications = {
      announcements: announcements.length,
      tickets: tickets.length,
      appointments: appointments.length,
      personal: userNotifications.length,
      total: announcements.length + tickets.length + appointments.length + userNotifications.length
    }

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { notificationId, markAsRead } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ message: "Notification ID required" }, { status: 400 })
    }

    const db = await getDatabase()
    
    const result = await db.collection("notifications").updateOne(
      { 
        _id: new ObjectId(notificationId),
        userId: new ObjectId(decoded.userId)
      },
      { 
        $set: { 
          isRead: markAsRead,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Notification updated successfully" })

  } catch (error) {
    console.error("Update notification error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()
    
    const result = await db.collection("notifications").updateMany(
      { 
        userId: new ObjectId(decoded.userId),
        isRead: false
      },
      { 
        $set: { 
          isRead: true,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ 
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount
    })

  } catch (error) {
    console.error("Mark all notifications read error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
