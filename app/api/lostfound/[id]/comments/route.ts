import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()
    
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    const { content } = await request.json()
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }
    
    // Check if post exists
    const post = await db
      .collection('lostfound')
      .findOne({ _id: new ObjectId(params.id), isDeleted: false })
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const comment = {
      _id: new ObjectId(),
      authorId: new ObjectId(decoded.userId),
      authorName: user.name,
      content: content.trim(),
      createdAt: new Date()
    }

    const result = await db
      .collection('lostfound')
      .updateOne(
        { _id: new ObjectId(params.id) },
        { 
          $push: { comments: comment },
          $set: { updatedAt: new Date() }
        }
      )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Comment added successfully',
      comment
    })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()
    
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    const { commentId } = await request.json()
    
    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      )
    }
    
    // Check if post exists
    const post = await db
      .collection('lostfound')
      .findOne({ _id: new ObjectId(params.id), isDeleted: false })
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Find the comment to check permissions
    const comment = post.comments.find((c: any) => c._id.toString() === commentId)
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Only comment author, admin, or lecturer can delete
    if (comment.authorId.toString() !== decoded.userId && user.role !== 'admin' && user.role !== 'lecturer') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    const result = await db
      .collection('lostfound')
      .updateOne(
        { _id: new ObjectId(params.id) },
        { 
          $pull: { comments: { _id: new ObjectId(commentId) } },
          $set: { updatedAt: new Date() }
        }
      )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
