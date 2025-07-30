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
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get("chatId")

    if (!chatId) {
      return NextResponse.json({ message: "Chat ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    const messages = await db.collection("messages").find({ chatId }).sort({ createdAt: 1 }).toArray()

    return NextResponse.json(messages)
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
    const { chatId, receiverId, content, type = "text" } = await request.json()

    if (!chatId || !receiverId || !content) {
      return NextResponse.json({ message: "Required fields missing" }, { status: 400 })
    }

    const db = await getDatabase()

    const newMessage = {
      chatId,
      senderId: new ObjectId(decoded.userId),
      receiverId: new ObjectId(receiverId),
      content,
      type,
      isRead: false,
      createdAt: new Date(),
    }

    const result = await db.collection("messages").insertOne(newMessage)

    // Update chat's last message
    await db.collection("chats").updateOne(
      { _id: chatId },
      {
        $set: {
          lastMessage: newMessage,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json(
      {
        message: "Message sent successfully",
        messageId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
