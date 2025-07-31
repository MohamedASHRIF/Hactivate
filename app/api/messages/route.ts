import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import { broadcastToUser } from "./live/route"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get("contactId")

    if (!contactId) {
      return NextResponse.json({ message: "Contact ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Create a unique chat ID based on user IDs (smaller ID first for consistency)
    const userIds = [decoded.userId, contactId].sort()
    const chatId = `${userIds[0]}_${userIds[1]}`

    // Fetch messages for this chat
    const messages = await db.collection("messages")
      .find({ chatId })
      .sort({ createdAt: 1 })
      .toArray()

    // Convert to frontend format
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      senderId: msg.senderId.toString(),
      content: msg.content,
      timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOwn: msg.senderId.toString() === decoded.userId
    }))

    return NextResponse.json(formattedMessages)
  } catch (error) {
    console.error("Get messages error:", error)
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
    const { recipientId, content } = await request.json()

    if (!recipientId || !content?.trim()) {
      return NextResponse.json({ message: "Recipient ID and content are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Create a unique chat ID based on user IDs (smaller ID first for consistency)
    const userIds = [decoded.userId, recipientId].sort()
    const chatId = `${userIds[0]}_${userIds[1]}`

    const newMessage = {
      chatId,
      senderId: new ObjectId(decoded.userId),
      recipientId: new ObjectId(recipientId),
      content: content.trim(),
      type: "text",
      isRead: false,
      createdAt: new Date(),
    }

    const result = await db.collection("messages").insertOne(newMessage)

    // Update or create chat metadata - ensure it's always created
    const chatUpdate = {
      chatId,
      participants: [new ObjectId(decoded.userId), new ObjectId(recipientId)],
      lastMessage: {
        content: content.trim(),
        senderId: new ObjectId(decoded.userId),
        timestamp: new Date()
      },
      updatedAt: new Date(),
      createdAt: new Date() // Add createdAt for new chats
    }

    await db.collection("chats").updateOne(
      { chatId },
      {
        $set: chatUpdate,
        $setOnInsert: { createdAt: new Date() } // Only set createdAt if inserting
      },
      { upsert: true }
    )

    // Mark the message as delivered
    const formattedMessage = {
      id: result.insertedId.toString(),
      senderId: decoded.userId,
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOwn: true
    }

    // Broadcast to recipient in real-time
    const recipientMessage = {
      ...formattedMessage,
      isOwn: false
    }

    // Get the chat ID for broadcasting
    const broadcastUserIds = [decoded.userId, recipientId].sort()
    const broadcastChatId = `${broadcastUserIds[0]}_${broadcastUserIds[1]}`

    broadcastToUser(recipientId, {
      type: 'new_message',
      data: recipientMessage,
      chatId: broadcastChatId,
      senderName: decoded.name || 'Unknown User' // Add sender name for notifications
    })

    return NextResponse.json({
      message: "Message sent successfully",
      data: formattedMessage
    }, { status: 201 })

  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
