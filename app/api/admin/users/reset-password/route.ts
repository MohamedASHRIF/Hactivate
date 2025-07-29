import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

// POST: Reset user password (admin only)
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

    // Generate new temporary password
    const newPassword = generateTempPassword()
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date(),
          passwordResetAt: new Date()
        } 
      }
    )

    return NextResponse.json({
      message: "Password reset successfully",
      newPassword: newPassword,
      userId: userId
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Generate temporary password
function generateTempPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let password = ""
  
  // Ensure at least one uppercase, one lowercase, and one number
  password += chars.charAt(Math.floor(Math.random() * 26)) // uppercase
  password += chars.charAt(Math.floor(Math.random() * 26) + 26) // lowercase
  password += chars.charAt(Math.floor(Math.random() * 10) + 52) // number
  
  // Fill remaining 5 characters randomly
  for (let i = 0; i < 5; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}
