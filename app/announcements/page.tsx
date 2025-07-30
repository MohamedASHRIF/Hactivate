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
import { Plus, Search, Calendar, Megaphone, AlertTriangle, Info, BookOpen, Users, Shield, MessageSquare, TrendingUp, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import CreateAnnouncementForm from "@/components/forms/create-announcement-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const TARGET_AUDIENCES = {
  STUDENT: "student",
  LECTURER: "lecturer", 
  ADMIN: "admin"
} as const

const TARGET_AUDIENCE_OPTIONS = [
  { value: TARGET_AUDIENCES.STUDENT, label: "Students", description: "All enrolled students" },
  { value: TARGET_AUDIENCES.LECTURER, label: "Lecturers", description: "Faculty and teaching staff" },
  { value: TARGET_AUDIENCES.ADMIN, label: "Administrators", description: "Administrative staff" }
] as const

const ANNOUNCEMENT_CATEGORIES = {
  GENERAL: "general",
  ACADEMIC: "academic", 
  EVENT: "event",
  URGENT: "urgent"
} as const

const ANNOUNCEMENT_CATEGORY_OPTIONS = [
  { 
    value: ANNOUNCEMENT_CATEGORIES.GENERAL, 
    label: "General", 
    description: "General information and updates",
    icon: "Info",
    color: "text-gray-600 dark:text-gray-400"
  },
  { 
    value: ANNOUNCEMENT_CATEGORIES.ACADEMIC, 
    label: "Academic", 
    description: "Academic-related announcements",
    icon: "BookOpen",
    color: "text-blue-600 dark:text-blue-400"
  },
  { 
    value: ANNOUNCEMENT_CATEGORIES.EVENT, 
    label: "Events", 
    description: "University events and activities",
    icon: "Calendar",
    color: "text-green-600 dark:text-green-400"
  },
  { 
    value: ANNOUNCEMENT_CATEGORIES.URGENT, 
    label: "Urgent", 
    description: "Urgent announcements requiring immediate attention",
    icon: "AlertTriangle",
    color: "text-red-600 dark:text-red-400"
  }
] as const

type TargetAudience = typeof TARGET_AUDIENCES[keyof typeof TARGET_AUDIENCES]
type AnnouncementCategory = typeof ANNOUNCEMENT_CATEGORIES[keyof typeof ANNOUNCEMENT_CATEGORIES]

interface Announcement {
  id: string
  title: string
  content: string
  category: AnnouncementCategory
  targetAudience: TargetAudience[]
  authorName: string
  authorRole: string
  authorId?: string
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
  const [authorFilter, setAuthorFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'new') {
      setIsCreateDialogOpen(true)
    }
  }, [searchParams])

  const fetchAnnouncements = async () => {
    try {
      console.log('Starting to fetch announcements...')
      setLoading(true)
      const response = await fetch('/api/announcements')
      console.log('Fetch response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Fetched announcements:', data)
        console.log('Number of announcements:', data.length)

        const processedAnnouncements = data.map((announcement: any) => ({
          ...announcement,
          id: announcement._id || announcement.id,
          createdAt: new Date(announcement.createdAt),
          updatedAt: new Date(announcement.updatedAt),
          expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt) : undefined
        }))

        console.log('Processed announcements:', processedAnnouncements)
        setAnnouncements(processedAnnouncements)
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
      console.log('Fetch announcements completed')
    }
  }

  useEffect(() => {
    if (user) {
      fetchAnnouncements()
    }
  }, [user])

  const handleCreateAnnouncement = async (formData: any) => {
    try {
      console.log('Creating announcement with data:', formData)
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      console.log('API response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('Announcement created successfully:', result)

        toast({
          title: "Announcement created",
          description: "Your announcement has been created successfully.",
        })

        setIsCreateDialogOpen(false)
        await fetchAnnouncements()
        refreshNotifications()
        console.log('Refresh completed')
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        toast({
          title: "Error creating announcement",
          description: errorData.message || "Failed to create announcement",
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

  const getCategoryIcon = (category: AnnouncementCategory) => {
    switch (category) {
      case ANNOUNCEMENT_CATEGORIES.URGENT:
        return <AlertTriangle className="h-4 w-4" />
      case ANNOUNCEMENT_CATEGORIES.ACADEMIC:
        return <BookOpen className="h-4 w-4" />
      case ANNOUNCEMENT_CATEGORIES.EVENT:
        return <Calendar className="h-4 w-4" />
      case ANNOUNCEMENT_CATEGORIES.GENERAL:
        return <Info className="h-4 w-4" />
      default:
        return <Megaphone className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: AnnouncementCategory) => {
    const categoryOption = ANNOUNCEMENT_CATEGORY_OPTIONS.find(option => option.value === category)
    return categoryOption?.color || "text-gray-600 dark:text-gray-400"
  }

  const getCategoryLabel = (category: AnnouncementCategory) => {
    const categoryOption = ANNOUNCEMENT_CATEGORY_OPTIONS.find(option => option.value === category)
    return categoryOption?.label || category
  }

  const getTargetAudienceLabel = (audience: TargetAudience) => {
    const audienceOption = TARGET_AUDIENCE_OPTIONS.find(option => option.value === audience)
    return audienceOption?.label || audience
  }

  const getTargetAudienceLabels = (audiences: TargetAudience[]) => {
    return audiences.map(getTargetAudienceLabel).join(", ")
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

  // Enhanced filtering with author role support
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || announcement.category === categoryFilter
    const matchesAuthor = authorFilter === "all" || announcement.authorRole === authorFilter
    
    return matchesSearch && matchesCategory && matchesAuthor
  })

  // Calculate statistics for lecturers
  const lecturerStats = {
    total: announcements.filter(a => a.authorId === user?._id?.toString() || a.authorId === user?._id).length,
    pinned: announcements.filter(a => (a.authorId === user?._id?.toString() || a.authorId === user?._id) && a.isPinned).length,
    thisMonth: announcements.filter(a => {
      if (a.authorId !== user?._id?.toString() && a.authorId !== user?._id) return false
      const now = new Date()
      const announcementDate = new Date(a.createdAt)
      return announcementDate.getMonth() === now.getMonth() && 
             announcementDate.getFullYear() === now.getFullYear()
    }).length
  }

  // Count announcements by author role for tabs
  const adminAnnouncements = filteredAnnouncements.filter(a => a.authorRole === "admin")
  const lecturerAnnouncements = filteredAnnouncements.filter(a => a.authorRole === "lecturer")

  console.log('Total announcements:', announcements.length)
  console.log('Filtered announcements:', filteredAnnouncements.length)
  console.log('User role:', user?.role)
  console.log('User ID:', user?._id)
  console.log('Sample announcement authorId:', announcements[0]?.authorId)
  console.log('Sample announcement authorRole:', announcements[0]?.authorRole)

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
                  {user?.role === "student" && "Stay updated with announcements from lecturers and administrators"}
                  {user?.role === "lecturer" && "Manage your course announcements and view admin updates"}
                  {user?.role === "admin" && "Manage all university announcements and communications"}
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

        {/* Filters and Statistics for Lecturers */}
        {user?.role === "lecturer" && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Filters & Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search */}
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
              
              {/* Category Filter */}
              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {ANNOUNCEMENT_CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Author Filter */}
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

              {/* Quick Actions */}
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Course Announcement
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setAuthorFilter("admin")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  View Admin Updates
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/debug-announcements')
                      const data = await response.json()
                      console.log('🔍 Debug data:', data)
                    } catch (error) {
                      console.error('Debug error:', error)
                    }
                  }}
                >
                  🔍 Debug Data
                </Button>
              </div>

              {/* Statistics */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Posts</span>
                  <Badge variant="secondary">{lecturerStats.total}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pinned</span>
                  <Badge variant="secondary">{lecturerStats.pinned}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <Badge variant="secondary">{lecturerStats.thisMonth}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters for Students and Admins */}
        {(user?.role === "student" || user?.role === "admin") && (
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
                    {ANNOUNCEMENT_CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Author Filter for Students */}
              {user?.role === "student" && (
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
            </CardContent>
          </Card>
        )}

        {/* Announcement List */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            {/* Tabs for Students */}
            {user?.role === "student" && (
              <Tabs defaultValue="all" className="mb-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    All
                    <Badge variant="secondary" className="ml-1">
                      {filteredAnnouncements.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                    <Badge variant="secondary" className="ml-1">
                      {adminAnnouncements.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="lecturer" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Lecturer
                    <Badge variant="secondary" className="ml-1">
                      {lecturerAnnouncements.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    {renderAnnouncements(filteredAnnouncements)}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="admin">
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    {renderAnnouncements(adminAnnouncements)}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="lecturer">
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    {renderAnnouncements(lecturerAnnouncements)}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}

            {/* Tabs for Lecturers */}
            {user?.role === "lecturer" && (
              <Tabs defaultValue="all" className="mb-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    All
                    <Badge variant="secondary" className="ml-1">
                      {filteredAnnouncements.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                    <Badge variant="secondary" className="ml-1">
                      {adminAnnouncements.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="my-posts" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    My Posts
                    <Badge variant="secondary" className="ml-1">
                      {announcements.filter(a => a.authorId === user?._id?.toString() || a.authorId === user?._id).length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    {renderAnnouncements(filteredAnnouncements)}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="admin">
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    {renderAnnouncements(adminAnnouncements)}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="my-posts">
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    {renderAnnouncements(announcements.filter(a => a.authorId === user?._id?.toString() || a.authorId === user?._id))}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}

            {/* Regular view for Admins */}
            {user?.role === "admin" && (
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {renderAnnouncements(filteredAnnouncements)}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )

  function renderAnnouncements(announcementsToRender: Announcement[]) {
    if (loading) {
      return (
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
      )
    }

    if (announcementsToRender.length === 0) {
      return (
        <Card className="mb-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {user?.role === "student" && authorFilter === "admin" && "No admin announcements found"}
              {user?.role === "student" && authorFilter === "lecturer" && "No lecturer announcements found"}
              {user?.role === "lecturer" && authorFilter === "admin" && "No admin announcements found"}
              {user?.role === "lecturer" && authorFilter === "lecturer" && "You haven't posted any announcements yet"}
              {user?.role === "lecturer" && announcementsToRender.length === 0 && announcements.filter(a => a.authorId === user?._id?.toString()).length === 0 && "You haven't posted any announcements yet"}
              {user?.role === "admin" && "No announcements found"}
              {(!authorFilter || authorFilter === "all") && announcementsToRender.length === 0 && "No announcements found"}
            </p>
            {(user?.role === "lecturer" || user?.role === "admin") && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Announcement
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    return announcementsToRender.map((announcement) => (
      <Card key={announcement.id} className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className={cn("flex items-center gap-2", getCategoryColor(announcement.category))}>
              {getCategoryIcon(announcement.category)}
              {announcement.title}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              {announcement.isPinned && (
                <Badge className="bg-blue-500 text-white">Pinned</Badge>
              )}
              <Badge variant="outline" className={getCategoryColor(announcement.category)}>
                {getCategoryLabel(announcement.category)}
              </Badge>
              {/* Role-specific badges */}
              {announcement.authorRole === "admin" && (
                <Badge className="bg-blue-600 text-white">
                  <Shield className="mr-1 h-3 w-3" />
                  Admin
                </Badge>
              )}
              {announcement.authorRole === "lecturer" && (
                <Badge className="bg-green-600 text-white">
                  <Users className="mr-1 h-3 w-3" />
                  Lecturer
                </Badge>
              )}
              {/* "My Post" badge for lecturers */}
              {user?.role === "lecturer" && (announcement.authorId === user?._id?.toString() || announcement.authorId === user?._id) && (
                <Badge className="bg-purple-600 text-white">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  My Post
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3">{announcement.content}</p>
          
          {/* Target Audience */}
          <div className="mb-3">
            <p className="text-sm font-medium text-muted-foreground mb-1">Target Audience:</p>
            <div className="flex gap-1 flex-wrap">
              {announcement.targetAudience.map((audience) => (
                <Badge key={audience} variant="secondary" className="text-xs">
                  {getTargetAudienceLabel(audience)}
                </Badge>
              ))}
            </div>
          </div>

          {announcement.expiresAt && (
            <p className="text-sm text-muted-foreground mb-3">
              <Clock className="inline mr-1 h-3 w-3" />
              Expires at: {formatDate(announcement.expiresAt)}
            </p>
          )}
          
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>{announcement.authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{announcement.authorName}</p>
              <p className="text-sm text-muted-foreground">{announcement.authorRole}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    ))
  }
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
