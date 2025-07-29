import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()

    // This endpoint returns a summary of notification counts
    // Frontend will use specific endpoints for detailed data
    
    const [announcements, tickets, appointments] = await Promise.all([
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
        .toArray()
    ])

    const notifications = {
      announcements: announcements.length,
      tickets: tickets.length,
      appointments: appointments.length,
      total: announcements.length + tickets.length + appointments.length
    }

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
