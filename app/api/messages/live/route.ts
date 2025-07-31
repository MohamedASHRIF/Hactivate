import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"

// Store active connections with cleanup functions
const connections = new Map<string, { controller: ReadableStreamDefaultController, cleanup: () => void }>()

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const userId = decoded.userId

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to live chat' })}\n\n`))
        
        // Set up a ping interval to keep connection alive
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'ping' })}\n\n`))
          } catch (error) {
            clearInterval(pingInterval)
            connections.delete(userId)
          }
        }, 30000) // Ping every 30 seconds

        // Store the connection with cleanup
        connections.set(userId, {
          controller,
          cleanup: () => {
            clearInterval(pingInterval)
            connections.delete(userId)
          }
        })
      },
      cancel() {
        const connection = connections.get(userId)
        if (connection) {
          connection.cleanup()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    })
  } catch (error) {
    console.error("SSE connection error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Function to broadcast message to specific user
export function broadcastToUser(userId: string, message: any) {
  const connection = connections.get(userId)
  if (connection) {
    try {
      connection.controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(message)}\n\n`))
    } catch (error) {
      console.error("Error broadcasting to user:", error)
      connection.cleanup()
    }
  }
}

// Function to broadcast to multiple users
export function broadcastToUsers(userIds: string[], message: any) {
  userIds.forEach(userId => broadcastToUser(userId, message))
}
