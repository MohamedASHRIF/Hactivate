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

    console.log('🔍 Fetching announcements for user:', decoded.role, decoded.userId)

    // Get admin announcements for user's role
    const adminAnnouncements = await db
      .collection("announcements")
      .find({
        $and: [
          { targetAudience: { $in: [decoded.role] } },
          {
            $or: [
              { expiresAt: { $exists: false } },
              { expiresAt: { $gte: new Date() } }
            ]
          }
        ]
      })
      .sort({ isPinned: -1, createdAt: -1 })
      .toArray()

    console.log('📊 Admin announcements found:', adminAnnouncements.length)

    // Get lecturer announcements for students
    let lecturerAnnouncements: any[] = []
    if (decoded.role === "student") {
      console.log('🔍 Looking for lecturer announcements for students')
      
      // First check what's in the lecturer_announcements collection
      const allLecturerAnnouncements = await db.collection("lecturer_announcements").find({}).toArray()
      console.log('📊 All lecturer announcements in collection:', allLecturerAnnouncements.length)
      
      if (allLecturerAnnouncements.length > 0) {
        console.log('📊 Sample lecturer announcement targetAudience:', allLecturerAnnouncements[0].targetAudience)
        console.log('📊 Sample lecturer announcement targetAudience type:', typeof allLecturerAnnouncements[0].targetAudience)
      }
      
      // Simplified query - just get all lecturer announcements for now
      lecturerAnnouncements = await db
        .collection("lecturer_announcements")
        .find({})
        .sort({ isPinned: -1, createdAt: -1 })
        .toArray()
      console.log('📊 Lecturer announcements for students found:', lecturerAnnouncements.length)
      console.log('📊 Sample lecturer announcement:', lecturerAnnouncements[0])
    }

    // Get lecturer's own announcements
    let myLecturerAnnouncements: any[] = []
    if (decoded.role === "lecturer") {
      console.log('🔍 Looking for lecturer announcements with authorId:', decoded.userId)
      
      // Try multiple approaches to find lecturer announcements
      const allLecturerAnnouncements = await db.collection("lecturer_announcements").find({}).toArray()
      console.log('📊 All lecturer announcements in collection:', allLecturerAnnouncements.length)
      
      if (allLecturerAnnouncements.length > 0) {
        console.log('📊 Sample lecturer announcement authorId:', allLecturerAnnouncements[0].authorId)
        console.log('📊 Sample lecturer announcement authorId type:', typeof allLecturerAnnouncements[0].authorId)
      }
      
      // Simplified query - just get all lecturer announcements for now
      myLecturerAnnouncements = await db
        .collection("lecturer_announcements")
        .find({})
        .sort({ isPinned: -1, createdAt: -1 })
        .toArray()
      console.log('📊 Lecturer\'s own announcements found:', myLecturerAnnouncements.length)
      console.log('📊 Sample my announcement:', myLecturerAnnouncements[0])
    }

    // Combine all announcements
    const allAnnouncements = [...adminAnnouncements, ...lecturerAnnouncements, ...myLecturerAnnouncements]
    console.log('📊 Total announcements to process:', allAnnouncements.length)
    console.log('📊 Admin announcements:', adminAnnouncements.length)
    console.log('📊 Lecturer announcements:', lecturerAnnouncements.length)
    console.log('📊 My lecturer announcements:', myLecturerAnnouncements.length)

    // Add author information
    const announcementsWithAuthors = await Promise.all(
      allAnnouncements.map(async (announcement) => {
        console.log('🔍 Processing announcement:', {
          id: announcement._id,
          title: announcement.title,
          authorId: announcement.authorId,
          targetAudience: announcement.targetAudience
        })
        
        const author = await db.collection("users").findOne({ _id: announcement.authorId })
        console.log('🔍 Found author:', author?.name, author?.role)
        
        return {
          ...announcement,
          authorName: author?.name || "Unknown",
          authorRole: author?.role || "admin",
        }
      })
    )

    // Sort by pinned status and creation date
    announcementsWithAuthors.sort((a: any, b: any) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    console.log('✅ Returning', announcementsWithAuthors.length, 'announcements')
    return NextResponse.json(announcementsWithAuthors)
  } catch (error) {
    console.error("Get announcements error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()
    const data = await request.json()

    console.log('🔍 Creating announcement for user:', decoded.role, decoded.userId)
    console.log('📊 Announcement data:', data)

    // Server-side validation for lecturers
    if (decoded.role === "lecturer") {
      if (!data.targetAudience || !data.targetAudience.includes("student")) {
        return NextResponse.json({ 
          message: "Lecturers can only post announcements to students" 
        }, { status: 400 })
      }
    }

    const announcementData = {
      ...data,
      authorId: new ObjectId(decoded.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Route to appropriate collection based on role
    const collectionName = decoded.role === "lecturer" ? "lecturer_announcements" : "announcements"
    console.log('📊 Using collection:', collectionName)

    const result = await db.collection(collectionName).insertOne(announcementData)
    console.log('✅ Announcement created with ID:', result.insertedId)

    return NextResponse.json({
      message: "Announcement added successfully",
      announcementId: result.insertedId,
    })
  } catch (error) {
    console.error("Post announcement error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()
    const data = await request.json()

    const { _id, collection, ...updateFields } = data

    // Determine collection based on role and provided collection parameter
    let collectionName = "announcements"
    if (decoded.role === "lecturer" || collection === "lecturer_announcements") {
      collectionName = "lecturer_announcements"
    }

    // Authorization check
    if (decoded.role === "lecturer") {
      const announcement = await db.collection(collectionName).findOne({ _id: new ObjectId(_id) })
      if (!announcement || announcement.authorId.toString() !== decoded.userId) {
        return NextResponse.json({ message: "Unauthorized to modify this announcement" }, { status: 403 })
      }
    }

    const result = await db.collection(collectionName).updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updateFields, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Announcement not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Announcement updated successfully" })
  } catch (error) {
    console.error("Patch announcement error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()
    const data = await request.json()

    const { _id, collection } = data

    // Determine collection based on role and provided collection parameter
    let collectionName = "announcements"
    if (decoded.role === "lecturer" || collection === "lecturer_announcements") {
      collectionName = "lecturer_announcements"
    }

    // Authorization check
    if (decoded.role === "lecturer") {
      const announcement = await db.collection(collectionName).findOne({ _id: new ObjectId(_id) })
      if (!announcement || announcement.authorId.toString() !== decoded.userId) {
        return NextResponse.json({ message: "Unauthorized to delete this announcement" }, { status: 403 })
      }
    }

    const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(_id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Announcement not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Announcement deleted successfully" })
  } catch (error) {
    console.error("Delete announcement error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
