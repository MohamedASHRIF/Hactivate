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

    const adminAnnouncements = await db
      .collection("announcements")
      .find(
        decoded.role === "admin"
          ? {
              $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: new Date() } }],
            }
          : {
              $and: [
                { targetAudience: { $in: [decoded.role] } },
                {
                  $or: [
                    { expiresAt: { $exists: false } },
                    { expiresAt: { $gte: new Date() } },
                  ],
                },
              ],
            }
      )
      .sort({ isPinned: -1, createdAt: -1 })
      .toArray()

    let lecturerAnnouncements: any[] = []
    if (decoded.role === "student") {
      lecturerAnnouncements = await db
        .collection("lecturer_announcements")
        .find({
          targetAudience: "student",
        })
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

    const announcementData = {
      ...data,
      authorId: new ObjectId(decoded.userId),
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
