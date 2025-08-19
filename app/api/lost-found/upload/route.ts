import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import { createWorker } from 'tesseract.js'
import { broadcastToUser } from "../messages/live/route"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    
    // Only admin and lecturers can upload found items
    if (decoded.role !== "admin" && decoded.role !== "lecturer") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const image = formData.get('image') as File
    const description = formData.get('description') as string
    const location = formData.get('location') as string
    const manualStudentId = formData.get('studentId') as string // Optional manual entry

    if (!image && !manualStudentId) {
      return NextResponse.json({ message: "Image or student ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    let extractedText = ""
    let studentId = manualStudentId || ""
    let imageUrl = ""

    // If image is provided, process it with OCR
    if (image) {
      try {
        // Convert image to buffer for OCR processing
        const imageBuffer = await image.arrayBuffer()
        const uint8Array = new Uint8Array(imageBuffer)

        // Upload image to storage (assuming you have Azure Blob Storage set up)
        // You can replace this with your preferred storage solution
        imageUrl = await uploadImageToStorage(uint8Array, image.name)

        // Perform OCR if no manual student ID provided
        if (!manualStudentId) {
          const worker = await createWorker('eng')
          const { data: { text } } = await worker.recognize(uint8Array)
          await worker.terminate()

          extractedText = text
          studentId = extractStudentId(text)
        }
      } catch (ocrError) {
        console.error("OCR Error:", ocrError)
        // Continue without OCR if it fails
      }
    }

    // Create lost & found entry
    const lostFoundItem = {
      type: "found",
      authorId: new ObjectId(decoded.userId),
      authorName: decoded.name,
      title: "Found Student ID",
      description: description || `Student ID found at ${location}`,
      category: "accessories" as const,
      location: location,
      imageUrl: imageUrl,
      status: "open" as const,
      extractedText: extractedText,
      studentId: studentId,
      isDeleted: false,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("lostfound").insertOne(lostFoundItem)

    // If student ID was found, try to notify the student
    let notificationResult = null
    if (studentId) {
      notificationResult = await notifyStudent(studentId, result.insertedId, location, decoded.name)
    }

    return NextResponse.json({
      message: "Item uploaded successfully",
      itemId: result.insertedId,
      extractedText: extractedText,
      studentId: studentId,
      notificationSent: !!notificationResult,
      studentFound: !!notificationResult
    }, { status: 201 })

  } catch (error) {
    console.error("Lost & Found upload error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Helper function to extract student ID from OCR text
function extractStudentId(text: string): string {
  // Common patterns for student IDs
  const patterns = [
    /(?:Student\s*(?:ID|Number)[\s:]*)?([A-Z]?\d{6,10})/i,
    /(?:ID[\s:]*)?([A-Z]?\d{8,12})/i,
    /\b([A-Z]{2,3}\d{6,8})\b/i,
    /\b(\d{8,12})\b/
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1].toUpperCase()
    }
  }

  return ""
}

// Helper function to notify the student
async function notifyStudent(studentId: string, itemId: ObjectId, location: string, finderName: string) {
  try {
    const db = await getDatabase()
    
    // Find student by student ID
    const student = await db.collection("users").findOne({ 
      studentId: studentId,
      role: "student"
    })

    if (!student) {
      console.log(`Student with ID ${studentId} not found`)
      return null
    }

    // Create notification
    const notification = {
      userId: student._id,
      type: "lost_found",
      title: "Found: Your Student ID",
      message: `Your student ID has been found at ${location} by ${finderName}. Please contact the administration office to collect it.`,
      data: {
        itemId: itemId.toString(),
        location: location,
        finderName: finderName
      },
      isRead: false,
      createdAt: new Date()
    }

    await db.collection("notifications").insertOne(notification)

    // Send real-time notification if user is online
    broadcastToUser(student._id.toString(), {
      type: 'notification',
      data: {
        title: notification.title,
        message: notification.message,
        type: 'lost_found',
        timestamp: new Date().toISOString()
      }
    })

    // Mark the lost & found item as notification sent
    await db.collection("lostfound").updateOne(
      { _id: itemId },
      { $set: { notificationSent: true, targetStudentId: student._id } }
    )

    console.log(`Notification sent to student ${student.name} (${studentId})`)
    return student

  } catch (error) {
    console.error("Error notifying student:", error)
    return null
  }
}

// Helper function to upload image (placeholder - implement based on your storage solution)
async function uploadImageToStorage(imageBuffer: Uint8Array, fileName: string): Promise<string> {
  try {
    const fs = require('fs').promises
    const path = require('path')
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'lost-found')
    
    // Generate unique filename
    const timestamp = Date.now()
    const extension = fileName.split('.').pop()
    const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`
    const filePath = path.join(uploadsDir, uniqueFileName)
    
    // Write file
    await fs.writeFile(filePath, imageBuffer)
    
    // Return public URL
    return `/uploads/lost-found/${uniqueFileName}`
    
  } catch (error) {
    console.error('Image upload error:', error)
    // Return placeholder URL on error
    const timestamp = Date.now()
    return `/uploads/lost-found/placeholder-${timestamp}.jpg`
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const db = await getDatabase()

    // Get all found items
    const items = await db.collection("lostfound")
      .find({ 
        type: "found",
        isDeleted: false 
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(items)

  } catch (error) {
    console.error("Get lost & found items error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
