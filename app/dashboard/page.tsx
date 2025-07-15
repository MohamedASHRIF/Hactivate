"use client"

import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Ticket, Calendar, Users, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  const studentStats = [
    { title: "Active Tickets", value: "3", icon: Ticket, color: "text-blue-600" },
    { title: "Upcoming Appointments", value: "2", icon: Calendar, color: "text-green-600" },
    { title: "Unread Messages", value: "5", icon: MessageSquare, color: "text-purple-600" },
    { title: "Completed Tasks", value: "12", icon: CheckCircle, color: "text-emerald-600" },
  ]

  const lecturerStats = [
    { title: "Pending Tickets", value: "8", icon: AlertCircle, color: "text-orange-600" },
    { title: "Today's Appointments", value: "4", icon: Calendar, color: "text-blue-600" },
    { title: "Active Students", value: "45", icon: Users, color: "text-green-600" },
    { title: "Response Time", value: "2.3h", icon: Clock, color: "text-purple-600" },
  ]

  const adminStats = [
    { title: "Total Users", value: "1,234", icon: Users, color: "text-blue-600" },
    { title: "Open Tickets", value: "23", icon: Ticket, color: "text-orange-600" },
    { title: "System Uptime", value: "99.9%", icon: TrendingUp, color: "text-green-600" },
    { title: "Active Sessions", value: "156", icon: MessageSquare, color: "text-purple-600" },
  ]

  const getStats = () => {
    switch (user.role) {
      case "student":
        return studentStats
      case "lecturer":
        return lecturerStats
      case "admin":
        return adminStats
      default:
        return studentStats
    }
  }

  const recentActivity = [
    {
      id: 1,
      type: "ticket",
      title: "New support ticket created",
      description: "Technical issue with course materials",
      time: "2 minutes ago",
      status: "open",
    },
    {
      id: 2,
      type: "appointment",
      title: "Appointment scheduled",
      description: "Meeting with Dr. Smith tomorrow at 2 PM",
      time: "1 hour ago",
      status: "scheduled",
    },
    {
      id: 3,
      type: "message",
      title: "New message received",
      description: "Response to your academic inquiry",
      time: "3 hours ago",
      status: "unread",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
            <p className="text-muted-foreground mt-2">Here's what's happening with your university activities today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {getStats().map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest interactions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col bg-transparent">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    Start Chat
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col bg-transparent">
                    <Ticket className="h-6 w-6 mb-2" />
                    New Ticket
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col bg-transparent">
                    <Calendar className="h-6 w-6 mb-2" />
                    Book Appointment
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col bg-transparent">
                    <Users className="h-6 w-6 mb-2" />
                    View Contacts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
