import { type NextRequest, NextResponse } from "next/server"
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

    // Get announcements for user's role
    const announcements = await db
      .collection("announcements")
      .find({
        targetAudience: { $in: [decoded.role] },
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: new Date() } }],
      })
      .sort({ isPinned: -1, createdAt: -1 })
      .toArray()

    // Populate author names
    const announcementsWithAuthors = await Promise.all(
      announcements.map(async (announcement) => {
        const author = await db.collection("users").findOne({ _id: announcement.authorId })
        return {
          ...announcement,
          authorName: author?.name || "Unknown",
          authorRole: author?.role || "admin",
        }
      }),
    )

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

    const result = await db.collection("announcements").insertOne(newAnnouncement)

    return NextResponse.json(
      {
        message: "Announcement created successfully",
        announcementId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create announcement error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
