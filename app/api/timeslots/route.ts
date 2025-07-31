export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    if (decoded.role !== "lecturer") {
      return NextResponse.json({ message: "Only lecturers can delete time slots" }, { status: 403 })
    }
    const { slotId } = await request.json()
    if (!slotId) {
      return NextResponse.json({ message: "Slot ID is required" }, { status: 400 })
    }
    const db = await getDatabase()
    // Only allow deletion if slot belongs to lecturer and is still available
    const slot = await db.collection("timeslots").findOne({ _id: new ObjectId(slotId) })
    if (!slot) {
      return NextResponse.json({ message: "Slot not found" }, { status: 404 })
    }
    if (String(slot.lecturerId) !== String(decoded.userId)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }
    if (!slot.isAvailable) {
      return NextResponse.json({ message: "Cannot delete a slot that has already been booked" }, { status: 400 })
    }
    const result = await db.collection("timeslots").deleteOne({ _id: new ObjectId(slotId) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Slot not found or could not be deleted" }, { status: 404 })
    }
    return NextResponse.json({ message: "Slot deleted successfully" })
  } catch (error) {
    console.error("Delete time slot error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()

    const timeSlots = await db
      .collection("timeslots")
      .find({ isAvailable: true, startTime: { $gte: new Date() } })
      .sort({ startTime: 1 })
      .toArray()

    // Populate lecturer names
    const slotsWithLecturers = await Promise.all(
      timeSlots.map(async (slot) => {
        const lecturer = await db.collection("users").findOne({ _id: slot.lecturerId })
        return {
          ...slot,
          lecturerName: lecturer?.name || "Unknown",
        }
      }),
    )

    return NextResponse.json(slotsWithLecturers)
  } catch (error) {
    console.error("Get time slots error:", error)
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

    if (decoded.role !== "lecturer") {
      return NextResponse.json({ message: "Only lecturers can create time slots" }, { status: 403 })
    }

    const { startTime, endTime } = await request.json()

    if (!startTime || !endTime) {
      return NextResponse.json({ message: "Start time and end time are required" }, { status: 400 })
    }

    const db = await getDatabase()

    const newTimeSlot = {
      lecturerId: new ObjectId(decoded.userId),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isAvailable: true,
      createdAt: new Date(),
    }

    const result = await db.collection("timeslots").insertOne(newTimeSlot)

    return NextResponse.json(
      {
        message: "Time slot created successfully",
        slotId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create time slot error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
