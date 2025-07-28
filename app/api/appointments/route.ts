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

    let query = {}
    if (decoded.role === "student") {
      query = { studentId: new ObjectId(decoded.userId) }
    } else if (decoded.role === "lecturer") {
      query = { lecturerId: new ObjectId(decoded.userId) }
    }

    const appointments = await db.collection("appointments").find(query).sort({ startTime: 1 }).toArray()

    // Populate user names
    const appointmentsWithUsers = await Promise.all(
      appointments.map(async (appointment) => {
        const student = await db.collection("users").findOne({ _id: appointment.studentId })
        const lecturer = await db.collection("users").findOne({ _id: appointment.lecturerId })

        return {
          ...appointment,
          studentName: student?.name || "Unknown",
          lecturerName: lecturer?.name || "Unknown",
        }
      }),
    )

    return NextResponse.json(appointmentsWithUsers)
  } catch (error) {
    console.error("Get appointments error:", error)
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
    const { lecturerId, title, description, startTime, endTime, meetingLink, location } = await request.json()

    if (!lecturerId || !title || !startTime || !endTime) {
      return NextResponse.json({ message: "Required fields missing" }, { status: 400 })
    }

    const db = await getDatabase()

    const newAppointment = {
      lecturerId: new ObjectId(lecturerId),
      studentId: new ObjectId(decoded.userId),
      title,
      description: description || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "scheduled",
      meetingLink: meetingLink || null,
      location: location || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("appointments").insertOne(newAppointment)

    return NextResponse.json(
      {
        message: "Appointment booked successfully",
        appointmentId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create appointment error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// PATCH: Update appointment (admin only)
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
    const { appointmentId, ...updateFields } = await request.json()
    if (!appointmentId) {
      return NextResponse.json({ message: "Appointment ID is required" }, { status: 400 })
    }
    updateFields.updatedAt = new Date()
    const db = await getDatabase()
    const result = await db
      .collection("appointments")
      .updateOne({ _id: new ObjectId(appointmentId) }, { $set: updateFields })
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Appointment not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Appointment updated successfully" })
  } catch (error) {
    console.error("Update appointment error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete appointment (admin only)
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
    const { appointmentId } = await request.json()
    if (!appointmentId) {
      return NextResponse.json({ message: "Appointment ID is required" }, { status: 400 })
    }
    const db = await getDatabase()
    const result = await db.collection("appointments").deleteOne({ _id: new ObjectId(appointmentId) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Appointment not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Appointment deleted successfully" })
  } catch (error) {
    console.error("Delete appointment error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
