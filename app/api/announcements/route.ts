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

    // Admin users can see all announcements, others see only announcements targeted at their role
    let query: any = {
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: new Date() } }],
    }

    if (decoded.role !== "admin") {
      query.targetAudience = { $in: [decoded.role] }
    }

    // Get announcements
    const announcements = await db
      .collection("announcements")
      .find(query)
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

// PATCH: Update announcement (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }
    const { announcementId, ...updateFields } = await request.json()
    if (!announcementId) {
      return NextResponse.json({ message: "Announcement ID is required" }, { status: 400 })
    }
    updateFields.updatedAt = new Date()
    const db = await getDatabase()
    const result = await db
      .collection("announcements")
      .updateOne({ _id: new ObjectId(announcementId) }, { $set: updateFields })
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Announcement not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Announcement updated successfully" })
  } catch (error) {
    console.error("Update announcement error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete announcement (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }
    const { announcementId } = await request.json()
    if (!announcementId) {
      return NextResponse.json({ message: "Announcement ID is required" }, { status: 400 })
    }
    const db = await getDatabase()
    const result = await db.collection("announcements").deleteOne({ _id: new ObjectId(announcementId) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Announcement not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Announcement deleted successfully" })
  } catch (error) {
    console.error("Delete announcement error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
