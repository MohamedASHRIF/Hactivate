import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    
    // Get all announcements from both collections
    const adminAnnouncements = await db.collection("announcements").find({}).toArray()
    const lecturerAnnouncements = await db.collection("lecturer_announcements").find({}).toArray()
    
    console.log('🔍 DEBUG - Admin announcements count:', adminAnnouncements.length)
    console.log('🔍 DEBUG - Lecturer announcements count:', lecturerAnnouncements.length)
    
    if (adminAnnouncements.length > 0) {
      console.log('🔍 DEBUG - First admin announcement:', {
        id: adminAnnouncements[0]._id,
        title: adminAnnouncements[0].title,
        authorId: adminAnnouncements[0].authorId,
        targetAudience: adminAnnouncements[0].targetAudience
      })
    }
    
    if (lecturerAnnouncements.length > 0) {
      console.log('🔍 DEBUG - First lecturer announcement:', {
        id: lecturerAnnouncements[0]._id,
        title: lecturerAnnouncements[0].title,
        authorId: lecturerAnnouncements[0].authorId,
        targetAudience: lecturerAnnouncements[0].targetAudience
      })
    }
    
    return NextResponse.json({
      adminAnnouncements: adminAnnouncements.length,
      lecturerAnnouncements: lecturerAnnouncements.length,
      adminSample: adminAnnouncements[0] || null,
      lecturerSample: lecturerAnnouncements[0] || null
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 