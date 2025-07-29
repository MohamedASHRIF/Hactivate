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

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || announcement.category === categoryFilter
    const matchesAuthor = authorFilter === "all" || announcement.authorRole === authorFilter
    
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
                <p className="text-muted-foreground">Stay updated with the latest university news and updates</p>
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
                  {ANNOUNCEMENT_CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Announcement List */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
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
                    <p className="text-muted-foreground">No announcements found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAnnouncements.map((announcement) => (
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
