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
    
    // Calculate real-time analytics from database collections
    const [userCount, ticketCount, announcementCount, appointmentCount] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("tickets").countDocuments(),
      db.collection("announcements").countDocuments(),
      db.collection("appointments").countDocuments()
    ])
    
    const openTickets = await db.collection("tickets").countDocuments({ status: "open" })
    const closedTickets = ticketCount - openTickets
    
    const realTimeAnalytics = {
      totalUsers: userCount,
      totalTickets: ticketCount,
      openTickets: openTickets,
      closedTickets: closedTickets,
      totalAnnouncements: announcementCount,
      totalAppointments: appointmentCount,
      lastUpdated: new Date().toLocaleString(),
      updatedAt: new Date()
    }
    
    // Update analytics collection with real-time data
    await db.collection("analytics").replaceOne(
      {},
      realTimeAnalytics,
      { upsert: true }
    )
    
    return NextResponse.json(realTimeAnalytics)
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase()
    
    // Calculate real-time analytics from database collections
    const [userCount, ticketCount, announcementCount, appointmentCount] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("tickets").countDocuments(),
      db.collection("announcements").countDocuments(),
      db.collection("appointments").countDocuments()
    ])
    
    const openTickets = await db.collection("tickets").countDocuments({ status: "open" })
    const closedTickets = ticketCount - openTickets
    
    const realTimeAnalytics = {
      totalUsers: userCount,
      totalTickets: ticketCount,
      openTickets: openTickets,
      closedTickets: closedTickets,
      totalAnnouncements: announcementCount,
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