import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import { ForumPost } from "@/lib/models/ForumPost"

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

    if (decoded.role === "admin") {
      // Admins see all posts
      query = {}
    } else {
      // Students and lecturers see posts from their department only
      query.department = userDepartment
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const author = searchParams.get("author")
    const search = searchParams.get("search")

    // Add filters
    if (category && category !== "all") {
      query.category = category
    }

    if (status && status !== "all") {
      query.status = status
    }

    if (author && author !== "all") {
      query.authorRole = author
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ]
    }

    const posts = await db
      .collection("forum_posts")
      .find(query)
      .sort({ isPinned: -1, lastActivityAt: -1 })
      .toArray()

    // Add vote status for current user
    const postsWithVoteStatus = posts.map((post: any) => ({
      ...post,
      hasUpvoted: post.upvotes?.includes(decoded.userId) || false,
      hasDownvoted: post.downvotes?.includes(decoded.userId) || false,
      voteCount: (post.upvotes?.length || 0) - (post.downvotes?.length || 0)
    }))

    return NextResponse.json(postsWithVoteStatus)
  } catch (error) {
    console.error("Get forum posts error:", error)
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
    const db = await getDatabase()
    const data = await request.json()

    // Get user details
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const postData: Partial<ForumPost> = {
      title: data.title,
      content: data.content,
      authorId: new ObjectId(decoded.userId),
      authorName: data.isAnonymous ? "Anonymous" : user.name,
      authorRole: decoded.role,
      department: user.department,
      category: data.category,
      status: "open",
      tags: data.tags || [],
      isPinned: false,
      isAnonymous: data.isAnonymous || false,
      upvotes: [],
      downvotes: [],
      views: 0,
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date()
    }

    const result = await db.collection("forum_posts").insertOne(postData)

    return NextResponse.json({
      message: "Post created successfully",
      postId: result.insertedId
    })
  } catch (error) {
    console.error("Create forum post error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()
    const data = await request.json()

    const { _id, ...updateFields } = data

    // Check if user owns the post or is admin
    const post = await db.collection("forum_posts").findOne({ _id: new ObjectId(_id) })
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 })
    }

    if (post.authorId.toString() !== decoded.userId && decoded.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const result = await db
      .collection("forum_posts")
      .updateOne(
        { _id: new ObjectId(_id) },
        { 
          $set: {
            ...updateFields,
            updatedAt: new Date(),
            lastActivityAt: new Date()
          }
        }
      )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Post updated successfully" })
  } catch (error) {
    console.error("Update forum post error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()
    const { _id } = await request.json()

    // Check if user owns the post or is admin
    const post = await db.collection("forum_posts").findOne({ _id: new ObjectId(_id) })
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 })
    }

    if (post.authorId.toString() !== decoded.userId && decoded.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const result = await db
      .collection("forum_posts")
      .deleteOne({ _id: new ObjectId(_id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Delete forum post error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 