"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
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
import { Plus, Search, Calendar, Megaphone, AlertTriangle, Info, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import CreateAnnouncementForm from "@/components/forms/create-announcement-form"

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
  const searchParams = useSearchParams()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
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
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.map((announcement: any) => ({
          ...announcement,
          createdAt: new Date(announcement.createdAt),
          updatedAt: new Date(announcement.updatedAt),
          expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt) : undefined
        })))
      } else {
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
    const matchesAudience = announcement.targetAudience.includes(user?.role as any) || user?.role === "admin"
    
    return matchesSearch && matchesCategory && matchesAudience
  })

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
                      onSubmit={() => {
                        setIsCreateDialogOpen(false)
                        fetchAnnouncements()
                      }} 
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
                      <div className="flex items-center gap-4 mt-4">
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
