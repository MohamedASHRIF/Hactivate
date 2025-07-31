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
          studentName: student?.fullName || "Unknown",
          assignedToName: assignedUser?.fullName || null,
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
    const data = await request.json()

    if (!data.title || !data.description || !data.category || !data.priority) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()

    const ticketData = {
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: "open",
      studentId: new ObjectId(decoded.userId),
      assignedTo: data.assignedTo ? new ObjectId(data.assignedTo) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: [],
    }

    const result = await db.collection("tickets").insertOne(ticketData)

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

// PATCH: Update ticket (admin only, assign/escalate)
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
    
    const { ticketId, ...updateFields } = await request.json()
    if (!ticketId) {
      return NextResponse.json({ message: "Ticket ID is required" }, { status: 400 })
    }
    
    updateFields.updatedAt = new Date()
    const db = await getDatabase()
    
    const result = await db
      .collection("tickets")
      .updateOne({ _id: new ObjectId(ticketId) }, { $set: updateFields })
      
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }
    
    return NextResponse.json({ message: "Ticket updated successfully" })
  } catch (error) {
    console.error("Update ticket error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete ticket (admin only)
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
    
    const { ticketId } = await request.json()
    if (!ticketId) {
      return NextResponse.json({ message: "Ticket ID is required" }, { status: 400 })
    }
    
    const db = await getDatabase()
    const result = await db.collection("tickets").deleteOne({ _id: new ObjectId(ticketId) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }
    
    return NextResponse.json({ message: "Ticket deleted successfully" })
  } catch (error) {
    console.error("Delete ticket error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
