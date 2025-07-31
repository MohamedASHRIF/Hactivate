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

      // Enhanced Recent Activity for Students
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

      // Get relevant announcements for the student
      const recentAnnouncements = await db.collection("announcements")
        .find({
          targetAudience: { $in: ["student"] },
          $or: [
            { isDepartmentSpecific: { $ne: true } },
            {
              $and: [
                { isDepartmentSpecific: true },
                { targetDepartments: { $in: [userDepartment] } }
              ]
            }
          ],
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
        .sort({ createdAt: -1 })
        .limit(2)
        .toArray()

      // Get recent messages
      const recentMessages = await db.collection("messages")
        .find({ 
          recipientId: new ObjectId(decoded.userId),
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
        .sort({ createdAt: -1 })
        .limit(2)
        .toArray()

      const recentActivity = [
        // Tickets with priority
        ...recentTickets.map(ticket => ({
          id: ticket._id.toString(),
          type: "ticket",
          title: `Support Ticket: ${ticket.title}`,
          description: ticket.description?.substring(0, 60) + (ticket.description?.length > 60 ? '...' : ''),
          time: new Date(ticket.createdAt).toLocaleDateString(),
          status: ticket.status,
          priority: ticket.priority === 'urgent' ? 'urgent' : ticket.priority === 'high' ? 'high' : 'medium',
          actionRequired: ticket.status === 'open' || ticket.status === 'in_progress',
          link: `/tickets`
        })),
        
        // Appointments
        ...recentAppointments.map(appointment => ({
          id: appointment._id.toString(),
          type: "appointment",
          title: `Appointment with ${appointment.lecturerName}`,
          description: appointment.reason || 'Academic consultation',
          time: new Date(appointment.date).toLocaleDateString(),
          status: appointment.status,
          priority: appointment.status === 'scheduled' ? 'high' : 'medium',
          actionRequired: appointment.status === 'pending',
          link: `/appointments`
        })),
        
        // Announcements
        ...recentAnnouncements.map(announcement => ({
          id: announcement._id.toString(),
          type: "announcement",
          title: `Announcement: ${announcement.title}`,
          description: announcement.content?.substring(0, 60) + (announcement.content?.length > 60 ? '...' : ''),
          time: new Date(announcement.createdAt).toLocaleDateString(),
          status: 'new',
          priority: announcement.category === 'urgent' ? 'urgent' : announcement.isPinned ? 'high' : 'medium',
          actionRequired: false,
          link: `/announcements`
        })),
        
        // Messages
        ...recentMessages.map(message => ({
          id: message._id.toString(),
          type: "message",
          title: `Message from ${message.senderName || 'Faculty'}`,
          description: message.content?.substring(0, 60) + (message.content?.length > 60 ? '...' : ''),
          time: new Date(message.createdAt).toLocaleDateString(),
          status: message.isRead ? 'read' : 'unread',
          priority: message.isRead ? 'low' : 'high',
          actionRequired: !message.isRead,
          link: `/chat`
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8)

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

      // Enhanced Recent Activity for Lecturers
      const recentTickets = await db.collection("tickets")
        .find({ 
          status: { $in: ["open", "in_progress"] },
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

      // Get recent announcements from admin
      const recentAnnouncements = await db.collection("announcements")
        .find({
          authorRole: "admin",
          targetAudience: { $in: ["lecturer"] },
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
        .sort({ createdAt: -1 })
        .limit(2)
        .toArray()

      // Get recent messages
      const recentMessages = await db.collection("messages")
        .find({ 
          recipientId: new ObjectId(decoded.userId),
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
        .sort({ createdAt: -1 })
        .limit(2)
        .toArray()

      // Get lecturer's own announcements
      const myAnnouncements = await db.collection("lecturer_announcements")
        .find({ 
          authorId: new ObjectId(decoded.userId),
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray()

      const recentActivity = [
        // Department tickets
        ...recentTickets.map(ticket => ({
          id: ticket._id.toString(),
          type: "ticket",
          title: `New ticket from ${ticket.authorName}`,
          description: ticket.title,
          time: new Date(ticket.createdAt).toLocaleDateString(),
          status: ticket.status,
          priority: ticket.priority === 'urgent' ? 'urgent' : ticket.priority === 'high' ? 'high' : 'medium',
          actionRequired: ticket.status === 'open',
          link: `/tickets`
        })),
        
        // Appointments
        ...recentAppointments.map(appointment => ({
          id: appointment._id.toString(),
          type: "appointment",
          title: `Appointment with ${appointment.studentName}`,
          description: appointment.reason || 'Student consultation',
          time: new Date(appointment.date).toLocaleDateString(),
          status: appointment.status,
          priority: appointment.status === 'scheduled' ? 'high' : 'medium',
          actionRequired: appointment.status === 'pending',
          link: `/appointments`
        })),
        
        // Admin announcements
        ...recentAnnouncements.map(announcement => ({
          id: announcement._id.toString(),
          type: "announcement",
          title: `Admin Announcement: ${announcement.title}`,
          description: announcement.content?.substring(0, 60) + (announcement.content?.length > 60 ? '...' : ''),
          time: new Date(announcement.createdAt).toLocaleDateString(),
          status: 'new',
          priority: announcement.category === 'urgent' ? 'urgent' : announcement.isPinned ? 'high' : 'medium',
          actionRequired: false,
          link: `/announcements`
        })),
        
        // Messages
        ...recentMessages.map(message => ({
          id: message._id.toString(),
          type: "message",
          title: `Message from ${message.senderName || 'Student'}`,
          description: message.content?.substring(0, 60) + (message.content?.length > 60 ? '...' : ''),
          time: new Date(message.createdAt).toLocaleDateString(),
          status: message.isRead ? 'read' : 'unread',
          priority: message.isRead ? 'low' : 'high',
          actionRequired: !message.isRead,
          link: `/chat`
        })),
        
        // My announcements
        ...myAnnouncements.map(announcement => ({
          id: announcement._id.toString(),
          type: "announcement",
          title: `My Announcement: ${announcement.title}`,
          description: announcement.content?.substring(0, 60) + (announcement.content?.length > 60 ? '...' : ''),
          time: new Date(announcement.createdAt).toLocaleDateString(),
          status: 'published',
          priority: 'medium',
          actionRequired: false,
          link: `/announcements`
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8)

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