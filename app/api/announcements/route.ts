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

    console.log('🔍 Fetching admin announcements for user:', {
      userId: decoded.userId,
      role: decoded.role
    })

    // Debug: Check what's in the lecturer_announcements collection
    const allLecturerAnnouncements = await db
      .collection("lecturer_announcements")
      .find({})
      .toArray()
    
    console.log('🔍 All lecturer announcements in DB:', allLecturerAnnouncements.length)
    if (allLecturerAnnouncements.length > 0) {
      console.log('🔍 Sample lecturer announcement:', {
        id: allLecturerAnnouncements[0]._id,
        title: allLecturerAnnouncements[0].title,
        authorId: allLecturerAnnouncements[0].authorId,
        authorIdType: typeof allLecturerAnnouncements[0].authorId,
        targetAudience: allLecturerAnnouncements[0].targetAudience,
        targetAudienceType: typeof allLecturerAnnouncements[0].targetAudience,
        isArray: Array.isArray(allLecturerAnnouncements[0].targetAudience)
      })
    }

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

    // Get lecturer announcements for students
    let lecturerAnnouncements: any[] = []
    if (decoded.role === "student") {
      console.log('🎓 Student - Querying for lecturer announcements with targetAudience: ["student"]')
      
      lecturerAnnouncements = await db
        .collection("lecturer_announcements")
        .find({
          targetAudience: "student"  // Simple array element match
        })
        .sort({ isPinned: -1, createdAt: -1 })
        .toArray()
      
      console.log('🎓 Student - Found lecturer announcements:', lecturerAnnouncements.length)
      if (lecturerAnnouncements.length > 0) {
        console.log('🎓 Student - First lecturer announcement:', {
          id: lecturerAnnouncements[0]._id,
          title: lecturerAnnouncements[0].title,
          targetAudience: lecturerAnnouncements[0].targetAudience
        })
      } else {
        // Debug: Let's see what happens if we query without the targetAudience filter
        const allLecturerForStudents = await db
          .collection("lecturer_announcements")
          .find({})
          .toArray()
        console.log('🎓 Student - All lecturer announcements (no filter):', allLecturerForStudents.length)
        if (allLecturerForStudents.length > 0) {
          console.log('🎓 Student - Sample announcement without filter:', {
            id: allLecturerForStudents[0]._id,
            title: allLecturerForStudents[0].title,
            targetAudience: allLecturerForStudents[0].targetAudience,
            targetAudienceType: typeof allLecturerForStudents[0].targetAudience
          })
        }
      }
    }

    // Get lecturer's own announcements
    let myLecturerAnnouncements: any[] = []
    if (decoded.role === "lecturer") {
      console.log('👨‍🏫 Lecturer - Looking for announcements with authorId:', decoded.userId)
      
      // Simple query to find lecturer's own announcements
      myLecturerAnnouncements = await db
        .collection("lecturer_announcements")
        .find({
          authorId: new ObjectId(decoded.userId)
        })
        .sort({ isPinned: -1, createdAt: -1 })
        .toArray()
      
      console.log('👨‍🏫 Lecturer - Found my announcements:', myLecturerAnnouncements.length)
      if (myLecturerAnnouncements.length > 0) {
        console.log('👨‍🏫 Lecturer - First announcement:', {
          id: myLecturerAnnouncements[0]._id,
          title: myLecturerAnnouncements[0].title,
          authorId: myLecturerAnnouncements[0].authorId
        })
      } else {
        // Debug: Let's see what happens if we query without the authorId filter
        const allLecturerAnnouncements = await db
          .collection("lecturer_announcements")
          .find({})
          .toArray()
        console.log('👨‍🏫 Lecturer - All lecturer announcements (no filter):', allLecturerAnnouncements.length)
        if (allLecturerAnnouncements.length > 0) {
          console.log('👨‍🏫 Lecturer - Sample announcement without filter:', {
            id: allLecturerAnnouncements[0]._id,
            title: allLecturerAnnouncements[0].title,
            authorId: allLecturerAnnouncements[0].authorId,
            authorIdType: typeof allLecturerAnnouncements[0].authorId
          })
        }
      }
    }

    console.log('📊 Found announcements:', {
      admin: adminAnnouncements.length,
      lecturer: lecturerAnnouncements.length,
      myLecturer: myLecturerAnnouncements.length
    })

    // Combine all announcements
    const allAnnouncements = [...adminAnnouncements, ...lecturerAnnouncements, ...myLecturerAnnouncements]

    // Populate author names
    const announcementsWithAuthors = await Promise.all(
      allAnnouncements.map(async (announcement) => {
        const author = await db.collection("users").findOne({ _id: announcement.authorId })
        return {
          ...announcement,
          authorName: author?.name || "Unknown",
          authorRole: author?.role || "admin",
        }
      }),
    )

    // Sort combined announcements by creation date
    announcementsWithAuthors.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

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

    if (!["admin", "lecturer"].includes(decoded.role)) {
      return NextResponse.json({ message: "Insufficient permissions" }, { status: 403 })
    }

    const { title, content, category, targetAudience, isPinned, expiresAt } = await request.json()

    if (!title || !content || !category || !targetAudience) {
      return NextResponse.json({ message: "Required fields missing" }, { status: 400 })
    }

    const db = await getDatabase()

    // Route to appropriate collection based on user role
    if (decoded.role === "admin") {
      // Admin announcements go to announcements collection
      const newAnnouncement = {
        authorId: new ObjectId(decoded.userId),
        title,
        content,
        category,
        targetAudience,
        isPinned: isPinned || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      console.log('📝 Creating admin announcement:', {
        authorId: decoded.userId,
        title,
        targetAudience,
        category
      })

      const result = await db.collection("announcements").insertOne(newAnnouncement)

      return NextResponse.json(
        {
          message: "Admin announcement created successfully",
          announcementId: result.insertedId,
        },
        { status: 201 },
      )
    } else if (decoded.role === "lecturer") {
      // Enforce lecturer restrictions: lecturers can only post to students
      if (!Array.isArray(targetAudience) || targetAudience.length === 0) {
        return NextResponse.json({ message: "Target audience is required" }, { status: 400 })
      }
      
      // Check if lecturer is trying to post to non-students
      const nonStudentAudience = targetAudience.filter(audience => audience !== "student")
      if (nonStudentAudience.length > 0) {
        return NextResponse.json({ 
          message: "Lecturers can only post announcements to students" 
        }, { status: 403 })
      }

      // Lecturer announcements go to lecturer_announcements collection
      const newLecturerAnnouncement = {
        authorId: new ObjectId(decoded.userId),
        title,
        content,
        category,
        targetAudience,
        isPinned: isPinned || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      console.log('📝 Creating lecturer announcement:', {
        authorId: decoded.userId,
        title,
        targetAudience,
        category
      })

      const result = await db.collection("lecturer_announcements").insertOne(newLecturerAnnouncement)

      return NextResponse.json(
        {
          message: "Lecturer announcement created successfully",
          announcementId: result.insertedId,
        },
        { status: 201 },
      )
    }

    return NextResponse.json({ message: "Invalid user role" }, { status: 400 })
  } catch (error) {
    console.error("Create announcement error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// PATCH: Update announcement (admin only for admin announcements, lecturers for their own)
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    
    const { announcementId, collection, ...updateFields } = await request.json()
    if (!announcementId || !collection) {
      return NextResponse.json({ message: "Announcement ID and collection are required" }, { status: 400 })
    }

    updateFields.updatedAt = new Date()
    const db = await getDatabase()

    // Determine which collection to update based on user role and collection parameter
    let targetCollection = collection
    if (decoded.role === "lecturer" && collection === "lecturer_announcements") {
      // Lecturers can only update their own announcements
      const result = await db
        .collection("lecturer_announcements")
        .updateOne(
          { 
            _id: new ObjectId(announcementId),
            authorId: new ObjectId(decoded.userId) // Only their own
          }, 
          { $set: updateFields }
        )
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ message: "Announcement not found or not authorized" }, { status: 404 })
      }
    } else if (decoded.role === "admin" && collection === "announcements") {
      // Admins can update admin announcements
      const result = await db
        .collection("announcements")
        .updateOne({ _id: new ObjectId(announcementId) }, { $set: updateFields })
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ message: "Announcement not found" }, { status: 404 })
      }
    } else {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ message: "Announcement updated successfully" })
  } catch (error) {
    console.error("Update announcement error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete announcement (admin only for admin announcements, lecturers for their own)
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    
    const { announcementId, collection } = await request.json()
    if (!announcementId || !collection) {
      return NextResponse.json({ message: "Announcement ID and collection are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Determine which collection to delete from based on user role and collection parameter
    if (decoded.role === "lecturer" && collection === "lecturer_announcements") {
      // Lecturers can only delete their own announcements
      const result = await db.collection("lecturer_announcements").deleteOne({ 
        _id: new ObjectId(announcementId),
        authorId: new ObjectId(decoded.userId) // Only their own
      })
      
      if (result.deletedCount === 0) {
        return NextResponse.json({ message: "Announcement not found or not authorized" }, { status: 404 })
      }
    } else if (decoded.role === "admin" && collection === "announcements") {
      // Admins can delete admin announcements
      const result = await db.collection("announcements").deleteOne({ _id: new ObjectId(announcementId) })
      
      if (result.deletedCount === 0) {
        return NextResponse.json({ message: "Announcement not found" }, { status: 404 })
      }
    } else {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ message: "Announcement deleted successfully" })
  } catch (error) {
    console.error("Delete announcement error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
