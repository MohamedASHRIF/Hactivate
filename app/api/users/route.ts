import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

// GET: List all users (admin only) or all lecturers (public for students)
export async function GET(request: NextRequest) {
  try {
    const role = request.nextUrl.searchParams.get("role")
    const db = await getDatabase()
    if (role === "lecturer") {
      // Public endpoint: return only id and name for all lecturers
      const lecturers = await db
        .collection("users")
        .find({ role: "lecturer" }, { projection: { _id: 1, name: 1 } })
        .sort({ name: 1 })
        .toArray()
      return NextResponse.json(lecturers)
    }
    // Default: admin only, return all users
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }
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

// PATCH: Update user (admin only)
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
    const { userId, ...updateFields } = await request.json()
    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }
    // Prevent updating password here
    if (updateFields.password) delete updateFields.password
    updateFields.updatedAt = new Date()
    const db = await getDatabase()
    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(userId) }, { $set: updateFields })
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("Update user error:", error)
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
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }
    const db = await getDatabase()
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(userId) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 