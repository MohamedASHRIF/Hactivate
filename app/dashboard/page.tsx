"use client"

import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Ticket, Calendar, Users, TrendingUp, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isNavigating, setIsNavigating] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        setIsLoadingData(true)
        
        // Fetch real data for all users including admin
        const response = await fetch('/api/analytics')
        if (response.ok) {
          const analyticsData = await response.json()
          
          // Format the data for dashboard display
          setDashboardData({
            stats: [
              { title: "Total Users", value: analyticsData.totalUsers?.toLocaleString() || "0" },
              { title: "Open Tickets", value: analyticsData.openTickets?.toString() || "0" },
              { title: "Total Announcements", value: analyticsData.totalAnnouncements?.toString() || "0" },
              { title: "Total Appointments", value: analyticsData.totalAppointments?.toString() || "0" }
            ],
            recentActivity: await fetchRecentActivity(),
            analytics: analyticsData
          })
        } else {
          throw new Error('Failed to fetch dashboard data')
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    const fetchRecentActivity = async () => {
      try {
        const [ticketsResponse, appointmentsResponse, announcementsResponse] = await Promise.all([
          fetch('/api/tickets'),
          fetch('/api/appointments'),
          fetch('/api/announcements')
        ])

        const activities = []

        // Add recent tickets (limit to 3 most recent)
        if (ticketsResponse.ok) {
          const tickets = await ticketsResponse.json()
          tickets.slice(0, 3).forEach((ticket: any) => {
            activities.push({
              id: ticket._id,
              type: "ticket",
              title: `Ticket: ${ticket.title}`,
              description: ticket.description?.substring(0, 50) + (ticket.description?.length > 50 ? '...' : ''),
              time: new Date(ticket.createdAt).toLocaleString(),
              status: ticket.status,
            })
          })
        }

        // Add recent appointments (limit to 3 most recent)
        if (appointmentsResponse.ok) {
          const appointments = await appointmentsResponse.json()
          appointments.slice(0, 3).forEach((appointment: any) => {
            activities.push({
              id: appointment._id,
              type: "appointment",
              title: `Appointment: ${appointment.title || 'Scheduled Meeting'}`,
              description: `With ${appointment.lecturerName || 'Lecturer'}`,
              time: new Date(appointment.startTime).toLocaleString(),
              status: appointment.status,
            })
          })
        }

        // Add recent announcements (limit to 3 most recent)
        if (announcementsResponse.ok) {
          const announcements = await announcementsResponse.json()
          announcements.slice(0, 3).forEach((announcement: any) => {
            activities.push({
              id: announcement._id,
              type: "announcement",
              title: `Announcement: ${announcement.title}`,
              description: announcement.content?.substring(0, 50) + (announcement.content?.length > 50 ? '...' : ''),
              time: new Date(announcement.createdAt).toLocaleString(),
              status: announcement.isPinned ? 'pinned' : 'normal',
            })
          })
        }

        // Sort by time and take the most recent 5
        return activities
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 5)
      } catch (error) {
        console.error('Error fetching recent activity:', error)
        return []
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user, toast])

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Quick Actions Handlers
  const handleQuickAction = async (action: string) => {
    setIsNavigating(true)
    
    try {
      switch (action) {
        case 'chat':
          router.push('/chat')
          break
        case 'new-ticket':
          router.push('/tickets?action=new')
          break
        case 'book-appointment':
          router.push('/appointments?action=book')
          break
        case 'view-contacts':
          if (user.role === 'admin') {
            router.push('/admin/users')
          } else {
            router.push('/appointments')
          }
          break
        case 'analytics':
          router.push('/dashboard/analytics')
          break
        case 'user-management':
          router.push('/admin/users')
          break
        case 'announcements':
          router.push('/announcements?action=new')
          break
        default:
          console.log('Unknown action:', action)
      }
    } catch (error) {
      console.error('Navigation error:', error)
    } finally {
      setTimeout(() => setIsNavigating(false), 500)
    }
  }

  const getStats = () => {
    if (!dashboardData) return []
    
    return dashboardData.stats.map((stat: any, index: number) => {
      const icons = [Users, Ticket, TrendingUp, MessageSquare, Calendar, AlertCircle, CheckCircle, Clock]
      const colors = ["text-blue-600", "text-orange-600", "text-green-600", "text-purple-600", "text-emerald-600"]
      
      return {
        ...stat,
        icon: icons[index % icons.length],
        color: colors[index % colors.length]
      }
    })
  }

  const getRecentActivity = () => {
    return dashboardData?.recentActivity || []
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ticket':
        return <Ticket className="h-4 w-4" />
      case 'appointment':
        return <Calendar className="h-4 w-4" />
      case 'announcement':
        return <MessageSquare className="h-4 w-4" />
      case 'message':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20'
      case 'high':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20'
      case 'medium':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20'
      case 'low':
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'unread':
      case 'new':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'in_progress':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'resolved':
      case 'read':
      case 'scheduled':
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'closed':
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

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
                  {getRecentActivity().length > 0 ? (
                    getRecentActivity().map((activity: any) => (
                      <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getPriorityColor(activity.priority || 'medium')}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium truncate">{activity.title}</p>
                            {activity.actionRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Action Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                            <Badge variant="outline" className={`text-xs ${getStatusColor(activity.status)}`}>
                              {activity.status}
                            </Badge>
                            {activity.priority && activity.priority !== 'medium' && (
                              <Badge variant="outline" className={`text-xs ${getPriorityColor(activity.priority)}`}>
                                {activity.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    </div>
                  )}
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
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col bg-transparent hover:bg-primary/5 transition-colors"
                    onClick={() => handleQuickAction('chat')}
                    disabled={isNavigating}
                  >
                    <MessageSquare className="h-6 w-6 mb-2" />
                    <span className="text-sm">Start Chat</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col bg-transparent hover:bg-primary/5 transition-colors"
                    onClick={() => handleQuickAction('new-ticket')}
                    disabled={isNavigating}
                  >
                    <Ticket className="h-6 w-6 mb-2" />
                    <span className="text-sm">New Ticket</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col bg-transparent hover:bg-primary/5 transition-colors"
                    onClick={() => handleQuickAction('book-appointment')}
                    disabled={isNavigating}
                  >
                    <Calendar className="h-6 w-6 mb-2" />
                    <span className="text-sm">Book Appointment</span>
                  </Button>
                  
                  {user.role === 'admin' ? (
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col bg-transparent hover:bg-primary/5 transition-colors"
                      onClick={() => handleQuickAction('analytics')}
                      disabled={isNavigating}
                    >
                      <TrendingUp className="h-6 w-6 mb-2" />
                      <span className="text-sm">View Analytics</span>
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col bg-transparent hover:bg-primary/5 transition-colors"
                      onClick={() => handleQuickAction('view-contacts')}
                      disabled={isNavigating}
                    >
                      <Users className="h-6 w-6 mb-2" />
                      <span className="text-sm">View Contacts</span>
                    </Button>
                  )}
                </div>
                
                {(user.role === 'admin' || user.role === 'lecturer') && (
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full h-16 flex items-center justify-center gap-3 bg-transparent hover:bg-primary/5 transition-colors"
                      onClick={() => handleQuickAction('announcements')}
                      disabled={isNavigating}
                    >
                      <Plus className="h-5 w-5" />
                      <span>Create Announcement</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
