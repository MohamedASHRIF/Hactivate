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

    // Get tickets based on user role
    let query = {}
    if (decoded.role === "student") {
      query = { studentId: new ObjectId(decoded.userId) }
    } else if (decoded.role === "lecturer") {
      query = { assignedTo: new ObjectId(decoded.userId) }
    }
    // Admin can see all tickets

    const tickets = await db.collection("tickets").find(query).sort({ createdAt: -1 }).toArray()

    // Populate user names
    const ticketsWithUsers = await Promise.all(
      tickets.map(async (ticket) => {
        const student = await db.collection("users").findOne({ _id: ticket.studentId })
        const assignedUser = ticket.assignedTo ? await db.collection("users").findOne({ _id: ticket.assignedTo }) : null

        return {
          ...ticket,
          studentName: student?.name || "Unknown",
          assignedToName: assignedUser?.name || null,
        }
      }),
    )

    return NextResponse.json(ticketsWithUsers)
  } catch (error) {
    console.error("Get tickets error:", error)
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
    const { title, description, category, priority } = await request.json()

    if (!title || !description || !category || !priority) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    const db = await getDatabase()

    const newTicket = {
      studentId: new ObjectId(decoded.userId),
      title,
      description,
      category,
      priority,
      status: "open",
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("tickets").insertOne(newTicket)

    return NextResponse.json(
      {
        message: "Ticket created successfully",
        ticketId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create ticket error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
