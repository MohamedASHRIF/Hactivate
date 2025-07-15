import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

        const db = await getDatabase()
        await db.collection("users").updateOne(
          { _id: new ObjectId(decoded.userId) },
          {
            $set: {
              isOnline: false,
              lastSeen: new Date(),
              updatedAt: new Date(),
            },
          },
        )
      } catch (error) {
        // Token might be invalid, but we still want to clear the cookie
        console.error("Error updating user status:", error)
      }
    }

    const response = NextResponse.json({ message: "Logged out successfully" })
    response.cookies.delete("token")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
