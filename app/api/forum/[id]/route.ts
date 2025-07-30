import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import { ForumReply } from "@/lib/models/ForumPost"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const post = await db.collection("forum_posts").findOne({ _id: new ObjectId(params.id) })
    
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 })
    }

    // Check if user can view this post (same department or admin)
    if (decoded.role !== "admin" && post.department !== userDepartment) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Increment view count
    await db.collection("forum_posts").updateOne(
      { _id: new ObjectId(params.id) },
      { $inc: { views: 1 } }
    )

    // Add vote status for current user
    const postWithVoteStatus = {
      ...post,
      hasUpvoted: post.upvotes?.includes(decoded.userId) || false,
      hasDownvoted: post.downvotes?.includes(decoded.userId) || false,
      voteCount: (post.upvotes?.length || 0) - (post.downvotes?.length || 0)
    }

    // Add vote status for replies
    const repliesWithVoteStatus = post.replies?.map((reply: any) => ({
      ...reply,
      hasUpvoted: reply.upvotes?.includes(decoded.userId) || false,
      hasDownvoted: reply.downvotes?.includes(decoded.userId) || false,
      voteCount: (reply.upvotes?.length || 0) - (reply.downvotes?.length || 0)
    })) || []

    return NextResponse.json({
      ...postWithVoteStatus,
      replies: repliesWithVoteStatus
    })
  } catch (error) {
    console.error("Get forum post error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if post exists and user can access it
    const post = await db.collection("forum_posts").findOne({ _id: new ObjectId(params.id) })
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 })
    }

    if (decoded.role !== "admin" && post.department !== user.department) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const replyData: Partial<ForumReply> = {
      content: data.content,
      authorId: new ObjectId(decoded.userId),
      authorName: user.name,
      authorRole: decoded.role,
      isAcceptedAnswer: false,
      upvotes: [],
      downvotes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add reply to post
    const result = await db.collection("forum_posts").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $push: { replies: replyData },
        $set: { 
          lastActivityAt: new Date(),
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "Failed to add reply" }, { status: 500 })
    }

    return NextResponse.json({ message: "Reply added successfully" })
  } catch (error) {
    console.error("Add forum reply error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()
    const data = await request.json()

    const { action, replyId } = data

    if (action === "vote") {
      const { voteType } = data
      const updateField = voteType === "upvote" ? "upvotes" : "downvotes"
      const oppositeField = voteType === "upvote" ? "downvotes" : "upvotes"

      // Remove from opposite vote array if exists
      await db.collection("forum_posts").updateOne(
        { _id: new ObjectId(params.id) },
        { $pull: { [oppositeField]: decoded.userId } }
      )

      // Toggle vote
      const post = await db.collection("forum_posts").findOne({ _id: new ObjectId(params.id) })
      const hasVoted = post[updateField]?.includes(decoded.userId)

      if (hasVoted) {
        // Remove vote
        await db.collection("forum_posts").updateOne(
          { _id: new ObjectId(params.id) },
          { $pull: { [updateField]: decoded.userId } }
        )
      } else {
        // Add vote
        await db.collection("forum_posts").updateOne(
          { _id: new ObjectId(params.id) },
          { $push: { [updateField]: decoded.userId } }
        )
      }

      return NextResponse.json({ message: "Vote updated successfully" })
    }

    if (action === "accept-answer" && replyId) {
      // Only post author or admin can accept answers
      const post = await db.collection("forum_posts").findOne({ _id: new ObjectId(params.id) })
      if (!post) {
        return NextResponse.json({ message: "Post not found" }, { status: 404 })
      }

      if (post.authorId.toString() !== decoded.userId && decoded.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
      }

      // Reset all replies to not accepted
      await db.collection("forum_posts").updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { "replies.$[].isAcceptedAnswer": false } }
      )

      // Accept the specific reply
      await db.collection("forum_posts").updateOne(
        { _id: new ObjectId(params.id), "replies._id": new ObjectId(replyId) },
        { $set: { "replies.$.isAcceptedAnswer": true } }
      )

      // Update post status to resolved
      await db.collection("forum_posts").updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { status: "resolved" } }
      )

      return NextResponse.json({ message: "Answer accepted successfully" })
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Update forum post error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 