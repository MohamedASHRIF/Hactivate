"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useNotifications } from "@/components/notification-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { Plus, Search, Calendar, Megaphone, AlertTriangle, Info, BookOpen, Users, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import CreateAnnouncementForm from "@/components/forms/create-announcement-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Announcement {
  id: string
  title: string
  content: string
  category: "general" | "academic" | "event" | "urgent"
  targetAudience: ("student" | "lecturer" | "admin")[]
  authorName: string
  authorRole: string
  isPinned: boolean
  attachments?: string[]
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

function AnnouncementsContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { refreshNotifications } = useNotifications()
  const searchParams = useSearchParams()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [authorFilter, setAuthorFilter] = useState("all") // New filter for author role
  const [loading, setLoading] = useState(true)

  // Check for URL parameters to auto-open create dialog
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'new') {
      setIsCreateDialogOpen(true)
    }
  }, [searchParams])

  // Fetch announcements from API
  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/announcements')
      console.log('🔍 API Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Fetched announcements data:', data) // Debug log
        console.log('📊 Data type:', typeof data)
        console.log('📊 Data length:', Array.isArray(data) ? data.length : 'Not an array')
        setAnnouncements(data.map((announcement: any) => ({
          ...announcement,
          id: announcement._id || announcement.id, // Ensure we have an id
          createdAt: new Date(announcement.createdAt),
          updatedAt: new Date(announcement.updatedAt),
          expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt) : undefined
        })))
      } else {
        console.error('Failed to fetch announcements:', response.status, response.statusText)
        toast({
          title: "Error fetching announcements",
          description: "Failed to load announcements",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAnnouncements()
    }
  }, [user])

  // Handle announcement creation
  const handleCreateAnnouncement = async (formData: any) => {
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Announcement created",
          description: "Your announcement has been created successfully.",
        })
        setIsCreateDialogOpen(false)
        fetchAnnouncements() // Refresh the list
        refreshNotifications() // Refresh notifications
      } else {
        const errorData = await response.json()
        toast({
          title: "Error creating announcement",
          description: errorData.error || "Failed to create announcement",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive"
      })
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4" />
      case "academic":
        return <BookOpen className="h-4 w-4" />
      case "event":
        return <Calendar className="h-4 w-4" />
      case "general":
        return <Info className="h-4 w-4" />
      default:
        return <Megaphone className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "urgent":
        return "text-red-600 dark:text-red-400"
      case "academic":
        return "text-blue-600 dark:text-blue-400"
      case "event":
        return "text-green-600 dark:text-green-400"
      case "general":
        return "text-gray-600 dark:text-gray-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || announcement.category === categoryFilter
    const matchesAuthor = authorFilter === "all" || announcement.authorRole === authorFilter
    
    console.log('Filtering announcement:', {
      title: announcement.title,
      matchesSearch,
      matchesCategory,
      matchesAuthor,
      authorRole: announcement.authorRole
    })
    
    return matchesSearch && matchesCategory && matchesAuthor
  })

  console.log('Total announcements:', announcements.length)
  console.log('Filtered announcements:', filteredAnnouncements.length)
  console.log('User role:', user?.role)

  if (!user) return null

  return (
    <main className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
        {/* Header */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-6 w-6" />
                  Announcements
                </CardTitle>
                <p className="text-muted-foreground">
                  {user?.role === "student" 
                    ? "Stay updated with the latest university news and updates"
                    : user?.role === "lecturer"
                    ? "View admin announcements and manage your course announcements"
                    : "Manage all university announcements and communications"
                  }
                </p>
              </div>
              {(user?.role === "admin" || user?.role === "lecturer") && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Announcement</DialogTitle>
                      <DialogDescription>Share important information with students and faculty.</DialogDescription>
                    </DialogHeader>
                    <CreateAnnouncementForm 
                      onSubmit={handleCreateAnnouncement}
                      userRole={user?.role}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search announcements..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Author Filter - Show for students and lecturers */}
            {(user?.role === "student" || user?.role === "lecturer") && (
              <div>
                <Select value={authorFilter} onValueChange={setAuthorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by author" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Authors</SelectItem>
                    <SelectItem value="admin">Administrators</SelectItem>
                    <SelectItem value="lecturer">Lecturers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Lecturer Statistics */}
            {user?.role === "lecturer" && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">Your Announcements</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">Total Posted:</span>
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {announcements.filter(a => a.authorName === user?.name).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">Pinned:</span>
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {announcements.filter(a => a.authorName === user?.name && a.isPinned).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">This Month:</span>
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {announcements.filter(a => {
                        const monthAgo = new Date()
                        monthAgo.setMonth(monthAgo.getMonth() - 1)
                        return a.authorName === user?.name && new Date(a.createdAt) > monthAgo
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcement List */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            {/* Author Tabs for Students and Lecturers */}
            {(user?.role === "student" || user?.role === "lecturer") && (
              <div className="mb-6">
                <Tabs value={authorFilter} onValueChange={setAuthorFilter} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4" />
                      All Announcements
                      <Badge variant="secondary" className="ml-1">
                        {announcements.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Updates
                      <Badge variant="secondary" className="ml-1">
                        {announcements.filter(a => a.authorRole === 'admin').length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="lecturer" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {user?.role === "student" ? "Lecturer Updates" : "My Announcements"}
                      <Badge variant="secondary" className="ml-1">
                        {announcements.filter(a => a.authorRole === 'lecturer').length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* Lecturer Quick Actions */}
            {user?.role === "lecturer" && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Quick Actions</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Create announcements for your students
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsCreateDialogOpen(true)
                        setAuthorFilter("lecturer") // Switch to lecturer tab when creating
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Course Announcement
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setAuthorFilter("admin")}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      View Admin Updates
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <ScrollArea className="h-full">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="mb-4">
                      <CardHeader>
                        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredAnnouncements.length === 0 ? (
                <Card className="mb-4">
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">
                        {authorFilter === "all" 
                          ? "No announcements found" 
                          : authorFilter === "admin"
                          ? "No admin announcements found"
                          : user?.role === "lecturer"
                          ? "You haven't posted any announcements yet"
                          : "No lecturer announcements found"
                        }
                      </p>
                      {authorFilter !== "all" && (
                        <Button 
                          variant="outline" 
                          onClick={() => setAuthorFilter("all")}
                          className="mt-2"
                        >
                          View all announcements
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="mb-4">
                    <CardHeader>
                      <CardTitle className={cn("flex items-center gap-2", getCategoryColor(announcement.category))}>
                        {getCategoryIcon(announcement.category)}
                        {announcement.title}
                      </CardTitle>
                      {announcement.isPinned && <Badge className="bg-blue-500 text-white">Pinned</Badge>}
                    </CardHeader>
                    <CardContent>
                      <p>{announcement.content}</p>
                      {announcement.expiresAt && (
                        <p className="text-sm text-muted-foreground">Expires at: {formatDate(announcement.expiresAt)}</p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback>{announcement.authorName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{announcement.authorName}</p>
                            <p className="text-sm text-muted-foreground capitalize">{announcement.authorRole}</p>
                          </div>
                        </div>
                        {/* Author type badge for students and lecturers */}
                        {(user?.role === "student" || user?.role === "lecturer") && (
                          <Badge 
                            variant={announcement.authorRole === 'admin' ? 'default' : 'secondary'}
                            className={cn(
                              "capitalize",
                              announcement.authorRole === 'admin' 
                                ? "bg-blue-500 hover:bg-blue-600" 
                                : announcement.authorName === user?.name
                                ? "bg-purple-500 hover:bg-purple-600"
                                : "bg-green-500 hover:bg-green-600"
                            )}
                          >
                            {announcement.authorRole === 'admin' ? (
                              <Shield className="h-3 w-3 mr-1" />
                            ) : announcement.authorName === user?.name ? (
                              <Users className="h-3 w-3 mr-1" />
                            ) : (
                              <Users className="h-3 w-3 mr-1" />
                            )}
                            {announcement.authorRole === 'admin' 
                              ? 'Admin' 
                              : announcement.authorName === user?.name 
                                ? 'My Post' 
                                : 'Lecturer'
                            }
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function AnnouncementsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <Suspense fallback={
          <main className="p-6">
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="lg:col-span-3 h-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </main>
        }>
          <AnnouncementsContent />
        </Suspense>
      </div>
    </div>
  )
}
