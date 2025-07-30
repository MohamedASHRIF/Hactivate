import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

const DUMMY_ANALYTICS = {
  totalUsers: 1247,
  totalTickets: 156,
  openTickets: 23,
  closedTickets: 133,
  totalAnnouncements: 42,
  totalAppointments: 89,
  lastUpdated: new Date().toLocaleString(),
  createdAt: new Date(),
  updatedAt: new Date()
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    let analytics = await db.collection("analytics").findOne({})
    
    if (!analytics) {
      // Insert initial dummy data if no analytics exist
      const insertResult = await db.collection("analytics").insertOne(DUMMY_ANALYTICS)
      analytics = { ...DUMMY_ANALYTICS, _id: insertResult.insertedId }
    } else {
      // Update lastUpdated timestamp
      const updatedData = {
        ...analytics,
        lastUpdated: new Date().toLocaleString(),
        updatedAt: new Date()
      }
      await db.collection("analytics").updateOne(
        { _id: analytics._id },
        { $set: { lastUpdated: updatedData.lastUpdated, updatedAt: updatedData.updatedAt } }
      )
      analytics = updatedData
    }
    
    // Remove _id from response
    const { _id, ...responseData } = analytics
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase()
    
    // Calculate real-time analytics from database collections
    const [userCount, ticketCount, adminAnnouncementCount, lecturerAnnouncementCount, appointmentCount] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("tickets").countDocuments(),
      db.collection("announcements").countDocuments(),
      db.collection("lecturer_announcements").countDocuments(),
      db.collection("appointments").countDocuments()
    ])
    
    const totalAnnouncements = adminAnnouncementCount + lecturerAnnouncementCount
    const openTickets = await db.collection("tickets").countDocuments({ status: "open" })
    const closedTickets = ticketCount - openTickets
    
    const realTimeAnalytics = {
      totalUsers: userCount,
      totalTickets: ticketCount,
      openTickets: openTickets,
      closedTickets: closedTickets,
      totalAnnouncements: totalAnnouncements,
      totalAppointments: appointmentCount,
      lastUpdated: new Date().toLocaleString(),
      updatedAt: new Date()
    }
    
    // Update or insert analytics data
    await db.collection("analytics").replaceOne(
      {},
      realTimeAnalytics,
      { upsert: true }
    )
    
    return NextResponse.json(realTimeAnalytics)
  } catch (error) {
    console.error("Analytics API POST error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 