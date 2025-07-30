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

    // Get user's department for filtering
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })
    const userDepartment = user?.department

    if (decoded.role === "student") {
      // Student Dashboard Stats
      const activeTickets = await db.collection("tickets").countDocuments({
        authorId: new ObjectId(decoded.userId),
        status: { $in: ["open", "in_progress"] }
      })

      const upcomingAppointments = await db.collection("appointments").countDocuments({
        studentId: new ObjectId(decoded.userId),
        status: "scheduled",
        date: { $gte: new Date() }
      })

      const unreadMessages = await db.collection("messages").countDocuments({
        recipientId: new ObjectId(decoded.userId),
        isRead: false
      })

      const completedTasks = await db.collection("tickets").countDocuments({
        authorId: new ObjectId(decoded.userId),
        status: "resolved"
      })

      // Recent Activity for Students
      const recentTickets = await db.collection("tickets")
        .find({ authorId: new ObjectId(decoded.userId) })
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray()

      const recentAppointments = await db.collection("appointments")
        .find({ studentId: new ObjectId(decoded.userId) })
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray()

      const recentActivity = [
        ...recentTickets.map(ticket => ({
          id: ticket._id.toString(),
          type: "ticket",
          title: `Ticket: ${ticket.title}`,
          description: ticket.description,
          time: new Date(ticket.createdAt).toLocaleDateString(),
          status: ticket.status
        })),
        ...recentAppointments.map(appointment => ({
          id: appointment._id.toString(),
          type: "appointment",
          title: `Appointment with ${appointment.lecturerName}`,
          description: appointment.reason,
          time: new Date(appointment.date).toLocaleDateString(),
          status: appointment.status
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)

      return NextResponse.json({
        stats: [
          { title: "Active Tickets", value: activeTickets.toString() },
          { title: "Upcoming Appointments", value: upcomingAppointments.toString() },
          { title: "Unread Messages", value: unreadMessages.toString() },
          { title: "Completed Tasks", value: completedTasks.toString() }
        ],
        recentActivity
      })

    } else if (decoded.role === "lecturer") {
      // Lecturer Dashboard Stats
      const pendingTickets = await db.collection("tickets").countDocuments({
        status: "open",
        department: userDepartment
      })

      const todayAppointments = await db.collection("appointments").countDocuments({
        lecturerId: new ObjectId(decoded.userId),
        status: "scheduled",
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })

      const activeStudents = await db.collection("users").countDocuments({
        role: "student",
        department: userDepartment
      })

      // Calculate average response time (mock for now)
      const responseTime = "2.3h"

      // Recent Activity for Lecturers
      const recentTickets = await db.collection("tickets")
        .find({ 
          status: "open",
          department: userDepartment 
        })
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray()

      const recentAppointments = await db.collection("appointments")
        .find({ lecturerId: new ObjectId(decoded.userId) })
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray()

      const recentActivity = [
        ...recentTickets.map(ticket => ({
          id: ticket._id.toString(),
          type: "ticket",
          title: `New ticket from ${ticket.authorName}`,
          description: ticket.title,
          time: new Date(ticket.createdAt).toLocaleDateString(),
          status: ticket.status
        })),
        ...recentAppointments.map(appointment => ({
          id: appointment._id.toString(),
          type: "appointment",
          title: `Appointment with ${appointment.studentName}`,
          description: appointment.reason,
          time: new Date(appointment.date).toLocaleDateString(),
          status: appointment.status
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)

      return NextResponse.json({
        stats: [
          { title: "Pending Tickets", value: pendingTickets.toString() },
          { title: "Today's Appointments", value: todayAppointments.toString() },
          { title: "Active Students", value: activeStudents.toString() },
          { title: "Response Time", value: responseTime }
        ],
        recentActivity
      })

    } else {
      // Admin - return mock data for now
      return NextResponse.json({
        stats: [
          { title: "Total Users", value: "1,234" },
          { title: "Open Tickets", value: "23" },
          { title: "System Uptime", value: "99.9%" },
          { title: "Active Sessions", value: "156" }
        ],
        recentActivity: []
      })
    }

  } catch (error) {
    console.error("Get dashboard stats error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 