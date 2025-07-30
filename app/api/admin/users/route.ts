import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

// GET: List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden - Admin access required" }, { status: 403 })
    }

    const db = await getDatabase()
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(users)
  } catch (error) {
    console.error("List users error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST: Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { name, email, password, role, department, studentId } = await request.json()

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: "Name, email, password, and role are required" }, { status: 400 })
    }

    if (!["student", "lecturer"].includes(role)) {
      return NextResponse.json({ message: "Role must be either 'student' or 'lecturer'" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ message: "User already exists with this email" }, { status: 409 })
    }

    // Check if student ID already exists for students
    if (role === "student" && studentId) {
      const existingStudentId = await db.collection("users").findOne({ studentId })
      if (existingStudentId) {
        return NextResponse.json({ message: "Student ID already exists" }, { status: 409 })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role,
      department: department || null,
      studentId: role === "student" ? studentId || null : null,
      avatar: null,
      isOnline: false,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("users").insertOne(newUser)

    return NextResponse.json({
      message: "User created successfully",
      userId: result.insertedId,
    }, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if user exists
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Prevent deleting admin users
    if (user.role === "admin") {
      return NextResponse.json({ message: "Cannot delete admin users" }, { status: 403 })
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === decoded.userId) {
      return NextResponse.json({ message: "Cannot delete your own account" }, { status: 403 })
    }

    // Delete user and related data
    await Promise.all([
      // Delete user
      db.collection("users").deleteOne({ _id: new ObjectId(userId) }),
      
      // Delete user's tickets
      db.collection("tickets").deleteMany({ studentId: new ObjectId(userId) }),
      
      // Delete user's appointments
      db.collection("appointments").deleteMany({
        $or: [
          { studentId: new ObjectId(userId) },
          { lecturerId: new ObjectId(userId) }
        ]
      }),
      
      // Delete user's announcements if lecturer
      user.role === "lecturer" 
        ? db.collection("lecturer_announcements").deleteMany({ authorId: new ObjectId(userId) })
        : Promise.resolve(),
      
      // Delete user's messages
      db.collection("messages").deleteMany({ senderId: new ObjectId(userId) }),
      
      // Delete notification reads
      db.collection("notification_reads").deleteMany({ userId: new ObjectId(userId) })
    ])

    return NextResponse.json({ message: "User and related data deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
