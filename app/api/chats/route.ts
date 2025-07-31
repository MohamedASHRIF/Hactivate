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

    // Get all chats where user is a participant
    const chats = await db.collection("chats")
      .find({ 
        participants: new ObjectId(decoded.userId) 
      })
      .sort({ updatedAt: -1 })
      .toArray()

    // Get user details for each chat participant
    const contactPromises = chats.map(async (chat) => {
      const otherParticipant = chat.participants.find((p: ObjectId) => p.toString() !== decoded.userId)
      if (!otherParticipant) return null

      const user = await db.collection("users").findOne({ _id: otherParticipant })
      if (!user) return null

      // Get unread count for this chat
      const userIds = [decoded.userId, otherParticipant.toString()].sort()
      const chatId = `${userIds[0]}_${userIds[1]}`
      
      const unreadCount = await db.collection("messages").countDocuments({
        chatId,
        recipientId: new ObjectId(decoded.userId),
        isRead: false
      })

      return {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        isOnline: user.isOnline || false,
        lastMessage: chat.lastMessage ? chat.lastMessage.content : "No messages yet",
        lastMessageTime: chat.lastMessage 
          ? new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Never",
        unreadCount: unreadCount > 0 ? unreadCount : undefined
      }
    })

    const contacts = (await Promise.all(contactPromises)).filter(Boolean)

    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Get chats error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
