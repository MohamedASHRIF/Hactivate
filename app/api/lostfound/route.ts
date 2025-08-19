import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import { uploadImage } from '@/lib/azure-blob'

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    let filter: any = { isDeleted: false }
    
    if (type) filter.type = type
    if (status) filter.status = status
    if (category) filter.category = category

    const posts = await db
      .collection('lostfound')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db.collection('lostfound').countDocuments(filter)

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching lost/found posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const type = formData.get('type') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const location = formData.get('location') as string
    const date = formData.get('date') as string
    const contactInfo = formData.get('contactInfo') as string
    const imageFile = formData.get('image') as File | null

    if (!type || !title || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let imageUrl: string | undefined
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile)
    }
    
    const post = {
      authorId: new ObjectId(decoded.userId),
      authorName: user.name,
      type,
      title,
      description,
      category,
      location: location || undefined,
      date: date ? new Date(date) : undefined,
      contactInfo: contactInfo || undefined,
      imageUrl,
      status: 'open' as const,
      comments: [],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('lostfound').insertOne(post)
    
    return NextResponse.json({
      message: 'Post created successfully',
      postId: result.insertedId
    })
  } catch (error) {
    console.error('Error creating lost/found post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
