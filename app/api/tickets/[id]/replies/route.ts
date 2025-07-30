import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ message: "Message is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })

    const reply = {
      _id: new ObjectId(),
      userId: new ObjectId(decoded.userId),
      userName: user?.name || "Unknown",
      message,
      createdAt: new Date(),
    }

    await db.collection("tickets").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $push: { replies: reply } as any,
        $set: {
          updatedAt: new Date(),
          status: "in-progress",
        },
      },
    )

    return NextResponse.json({ message: "Reply added successfully" })
  } catch (error) {
    console.error("Add reply error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
