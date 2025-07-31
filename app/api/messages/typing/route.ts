import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { broadcastToUser } from "../live/route"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { recipientId, isTyping } = await request.json()

    if (!recipientId) {
      return NextResponse.json({ message: "Recipient ID is required" }, { status: 400 })
    }

    // Broadcast typing status to recipient
    broadcastToUser(recipientId, {
      type: 'typing_status',
      data: {
        senderId: decoded.userId,
        isTyping: isTyping
      }
    })

    return NextResponse.json({ message: "Typing status sent" })
  } catch (error) {
    console.error("Typing status error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
