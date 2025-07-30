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

    // Get user's department for filtering
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })
    const userDepartment = user?.department

    // Build query based on user role
    let query: any = {}

    if (decoded.role !== "admin") {
      // Students and lecturers see stats from their department only
      query.department = userDepartment
    }

    // Get total posts
    const totalPosts = await db.collection("forum_posts").countDocuments(query)

    // Get total replies
    const posts = await db.collection("forum_posts").find(query).toArray()
    const totalReplies = posts.reduce((sum, post) => sum + (post.replies?.length || 0), 0)

    // Get resolved posts
    const resolvedPosts = await db.collection("forum_posts").countDocuments({
      ...query,
      status: "resolved"
    })

    // Get open posts
    const openPosts = await db.collection("forum_posts").countDocuments({
      ...query,
      status: "open"
    })

    // Get my posts
    const myPosts = await db.collection("forum_posts").countDocuments({
      ...query,
      authorId: new ObjectId(decoded.userId)
    })

    // Get my replies
    const myReplies = posts.reduce((sum, post) => {
      const myRepliesInPost = post.replies?.filter((reply: any) => 
        reply.authorId.toString() === decoded.userId
      ).length || 0
      return sum + myRepliesInPost
    }, 0)

    // Get posts by category
    const categoryStats = await db.collection("forum_posts").aggregate([
      { $match: query },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray()

    // Get recent activity
    const recentPosts = await db.collection("forum_posts")
      .find(query)
      .sort({ lastActivityAt: -1 })
      .limit(5)
      .toArray()

    return NextResponse.json({
      totalPosts,
      totalReplies,
      resolvedPosts,
      openPosts,
      myPosts,
      myReplies,
      categoryStats,
      recentPosts
    })
  } catch (error) {
    console.error("Get forum stats error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 