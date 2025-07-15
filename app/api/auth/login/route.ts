import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection("users").findOne({ email })

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" },
    )

    // Update user's online status
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          isOnline: true,
          lastSeen: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    const response = NextResponse.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      studentId: user.studentId,
      avatar: user.avatar,
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
