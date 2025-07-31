import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

// PATCH: Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const data = await request.json()
    const db = await getDatabase()

    const updateFields: any = {}

    // Handle name updates
    if (data.firstName || data.lastName) {
      const currentUser = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })
      if (!currentUser) {
        return NextResponse.json({ message: "User not found" }, { status: 404 })
      }

      // Construct full name from first and last name
      const firstName = data.firstName || currentUser.name?.split(' ')[0] || ''
      const lastName = data.lastName || currentUser.name?.split(' ').slice(1).join(' ') || ''
      updateFields.name = `${firstName} ${lastName}`.trim()
    }

    // Handle avatar update
    if (data.avatar !== undefined) {
      updateFields.avatar = data.avatar
    }

    // Handle password update
    if (data.currentPassword && data.newPassword) {
      const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 })
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(data.currentPassword, user.password)
      if (!isValidPassword) {
        return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 })
      }

      // Validate new password
      if (data.newPassword.length < 6) {
        return NextResponse.json({ message: "New password must be at least 6 characters long" }, { status: 400 })
      }

      // Hash new password
      updateFields.password = await bcrypt.hash(data.newPassword, 12)
    }

    // Add update timestamp
    updateFields.updatedAt = new Date()

    // Update user
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get updated user data (excluding password)
    const updatedUser = await db.collection("users").findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    )

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser
    })

  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// GET: Get user profile details
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    )

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Parse first and last name from fullName
    const nameParts = user.name?.split(' ') || ['']
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    return NextResponse.json({
      ...user,
      firstName,
      lastName
    })

  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
