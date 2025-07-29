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

    console.log('🔍 Debug: User role:', decoded.role, 'User ID:', decoded.userId)

    // Get all announcements from both collections
    const adminAnnouncements = await db.collection("announcements").find({}).toArray()
    const lecturerAnnouncements = await db.collection("lecturer_announcements").find({}).toArray()
    
    // Also check for specific lecturer announcements
    const myLecturerAnnouncements = await db.collection("lecturer_announcements").find({
      authorId: new ObjectId(decoded.userId)
    }).toArray()

    console.log('📊 Debug: Admin announcements count:', adminAnnouncements.length)
    console.log('📊 Debug: Lecturer announcements count:', lecturerAnnouncements.length)

    // Log sample data
    if (adminAnnouncements.length > 0) {
      console.log('📊 Debug: Sample admin announcement:', {
        _id: adminAnnouncements[0]._id,
        title: adminAnnouncements[0].title,
        targetAudience: adminAnnouncements[0].targetAudience,
        authorId: adminAnnouncements[0].authorId
      })
    }

    if (lecturerAnnouncements.length > 0) {
      console.log('📊 Debug: Sample lecturer announcement:', {
        _id: lecturerAnnouncements[0]._id,
        title: lecturerAnnouncements[0].title,
        targetAudience: lecturerAnnouncements[0].targetAudience,
        authorId: lecturerAnnouncements[0].authorId
      })
    }

    return NextResponse.json({
      userRole: decoded.role,
      userId: decoded.userId,
      adminAnnouncementsCount: adminAnnouncements.length,
      lecturerAnnouncementsCount: lecturerAnnouncements.length,
      myLecturerAnnouncementsCount: myLecturerAnnouncements.length,
      adminAnnouncements: adminAnnouncements.slice(0, 3), // First 3 for debugging
      lecturerAnnouncements: lecturerAnnouncements.slice(0, 3), // First 3 for debugging
      myLecturerAnnouncements: myLecturerAnnouncements // All my announcements
    })
  } catch (error) {
    console.error("Debug announcements error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 