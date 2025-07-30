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

    let adminAnnouncements: any[] = []
    
    if (decoded.role === "admin") {
      // Admins see all announcements from the announcements collection
      adminAnnouncements = await db
        .collection("announcements")
        .find({
          $or: [
            { expiresAt: { $exists: false } }, 
            { expiresAt: "" }, 
            { expiresAt: { $gte: new Date() } }
          ],
        })
        .sort({ isPinned: -1, createdAt: -1 })
        .toArray()
    } else {
      // Students and lecturers see filtered admin announcements
      const baseQuery = {
        targetAudience: { $in: [decoded.role] },
        $or: [
          { expiresAt: { $exists: false } }, 
          { expiresAt: "" }, 
          { expiresAt: { $gte: new Date() } }
        ],
      }

      // Add department filtering for students and lecturers
      // For department-specific announcements, check if user's department is in targetDepartments
      // For non-department-specific announcements, show them to everyone
      const departmentFilter = {
        $or: [
          // Non-department-specific announcements (show to everyone)
          { isDepartmentSpecific: { $ne: true } },
          // Department-specific announcements that include user's department
          {
            $and: [
              { isDepartmentSpecific: true },
              { targetDepartments: { $in: [userDepartment] } }
            ]
          }
        ]
      }

      const finalQuery = {
        $and: [baseQuery, departmentFilter]
      }

      adminAnnouncements = await db
        .collection("announcements")
        .find(finalQuery)
        .sort({ isPinned: -1, createdAt: -1 })
        .toArray()
    }

    let lecturerAnnouncements: any[] = []
    if (decoded.role === "student") {
      const lecturerQuery = {
        $and: [
          { targetAudience: "student" },
          {
            $or: [
              { expiresAt: { $exists: false } }, 
              { expiresAt: "" }, 
              { expiresAt: { $gte: new Date() } }
            ]
          },
          {
            $or: [
              // Non-department-specific announcements (show to everyone)
              { isDepartmentSpecific: { $ne: true } },
              // Department-specific announcements that include user's department
              {
                $and: [
                  { isDepartmentSpecific: true },
                  { targetDepartments: { $in: [userDepartment] } }
                ]
              }
            ]
          }
        ]
      }

      lecturerAnnouncements = await db
        .collection("lecturer_announcements")
        .find(lecturerQuery)
        .sort({ isPinned: -1, createdAt: -1 })
        .toArray()
    }

    let myLecturerAnnouncements: any[] = []
    if (decoded.role === "lecturer") {
      myLecturerAnnouncements = await db
        .collection("lecturer_announcements")
        .find({
          authorId: new ObjectId(decoded.userId),
        })
        .sort({ isPinned: -1, createdAt: -1 })
        .toArray()
    }

    const allAnnouncements = [...adminAnnouncements, ...lecturerAnnouncements, ...myLecturerAnnouncements]

    const announcementsWithAuthors = await Promise.all(
      allAnnouncements.map(async (announcement) => {
        const author = await db.collection("users").findOne({ _id: announcement.authorId })
        return {
          ...announcement,
          authorName: author?.name || "Unknown",
          authorRole: author?.role || "admin",
        }
      })
    )

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
    const db = await getDatabase()
    const data = await request.json()

    // Get user's department
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })
    const userDepartment = user?.department

    // For lecturers, if department-specific is selected but no departments are specified,
    // default to the lecturer's own department
    let targetDepartments = data.targetDepartments || []
    let isDepartmentSpecific = data.isDepartmentSpecific || false

    if (decoded.role === "lecturer" && isDepartmentSpecific && targetDepartments.length === 0) {
      targetDepartments = userDepartment ? [userDepartment] : []
    }

    // For admins, if department-specific is selected but no departments are specified,
    // it means they want to send to all departments (empty array)
    if (decoded.role === "admin" && isDepartmentSpecific && targetDepartments.length === 0) {
      // Keep empty array to indicate all departments
      targetDepartments = []
    }

    const announcementData = {
      ...data,
      authorId: new ObjectId(decoded.userId),
      targetDepartments,
      isDepartmentSpecific,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const collectionName =
      decoded.role === "lecturer" ? "lecturer_announcements" : "announcements"

    const result = await db.collection(collectionName).insertOne(announcementData)

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

    const { _id, ...updateFields } = data

    const collectionName =
      decoded.role === "lecturer" ? "lecturer_announcements" : "announcements"

    const result = await db
      .collection(collectionName)
      .updateOne({ _id: new ObjectId(_id) }, { $set: updateFields })

    if (result.modifiedCount === 0) {
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
    const { _id } = await request.json()

    const collectionName =
      decoded.role === "lecturer" ? "lecturer_announcements" : "announcements"

    const result = await db
      .collection(collectionName)
      .deleteOne({ _id: new ObjectId(_id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Announcement not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Announcement deleted successfully" })
  } catch (error) {
    console.error("Delete announcement error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
