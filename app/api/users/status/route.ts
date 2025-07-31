import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { isOnline } = await request.json()

    const db = await getDatabase()

    await db.collection("users").updateOne(
      { _id: new ObjectId(decoded.userId) },
      {
        $set: {
          isOnline: isOnline,
          lastSeen: new Date()
        }
      }
    )

    return NextResponse.json({ message: "Status updated successfully" })
  } catch (error) {
    console.error("Update status error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
