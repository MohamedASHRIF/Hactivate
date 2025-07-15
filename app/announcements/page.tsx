"use client"

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
import { Plus, Search, Calendar, Megaphone, AlertTriangle, Info, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import CreateAnnouncementForm from "@/components/forms/create-announcement-form" // Import CreateAnnouncementForm

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

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Mock announcements data
  const mockAnnouncements: Announcement[] = [
    {
      id: "1",
      title: "System Maintenance Scheduled",
      content:
        "The university portal will be under maintenance this weekend from 2 AM to 6 AM on Saturday. During this time, you may experience intermittent access issues. We apologize for any inconvenience.",
      category: "urgent",
      targetAudience: ["student", "lecturer"],
      authorName: "Admin User",
      authorRole: "admin",
      isPinned: true,
      createdAt: new Date(2024, 0, 15, 10, 0),
      updatedAt: new Date(2024, 0, 15, 10, 0),
    },
    {
      id: "2",
      title: "New Course Materials Available",
      content:
        "Week 5 lecture slides and assignments for Computer Science 101 have been uploaded to the portal. Please review the materials before the next class.",
      category: "academic",
      targetAudience: ["student"],
      authorName: "Dr. Jane Smith",
      authorRole: "lecturer",
      isPinned: false,
      createdAt: new Date(2024, 0, 14, 16, 30),
      updatedAt: new Date(2024, 0, 14, 16, 30),
    },
    {
      id: "3",
      title: "Tech Conference Registration Open",
      content:
        "Registration is now open for the Annual Technology Conference. Students can register for free using their university email. The conference will feature industry leaders and networking opportunities.",
      category: "event",
      targetAudience: ["student", "lecturer"],
      authorName: "Events Team",
      authorRole: "admin",
      isPinned: false,
      expiresAt: new Date(2024, 1, 15),
      createdAt: new Date(2024, 0, 12, 9, 15),
      updatedAt: new Date(2024, 0, 12, 9, 15),
    },
    {
      id: "4",
      title: "Library Hours Extended",
      content:
        "Due to upcoming exams, the library will extend its hours. Starting next week, the library will be open from 7 AM to 11 PM on weekdays and 9 AM to 9 PM on weekends.",
      category: "general",
      targetAudience: ["student"],
      authorName: "Library Staff",
      authorRole: "admin",
      isPinned: false,
      createdAt: new Date(2024, 0, 10, 14, 45),
      updatedAt: new Date(2024, 0, 10, 14, 45),
    },
  ]

  useEffect(() => {
    setAnnouncements(mockAnnouncements)
  }, [])

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
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "academic":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "event":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "general":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const filteredAnnouncements = announcements
    .filter((announcement) => {
      const matchesSearch =
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === "all" || announcement.category === categoryFilter
      const matchesAudience = announcement.targetAudience.includes(user?.role as any)

      return matchesSearch && matchesCategory && matchesAudience
    })
    .sort((a, b) => {
      // Pinned announcements first
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      // Then by creation date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

  const handleCreateAnnouncement = (formData: any) => {
    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: formData.title,
      content: formData.content,
      category: formData.category,
      targetAudience: formData.targetAudience,
      authorName: user?.name || "Unknown",
      authorRole: user?.role || "admin",
      isPinned: formData.isPinned,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setAnnouncements([newAnnouncement, ...announcements])
    setIsCreateDialogOpen(false)
    toast({
      title: "Announcement created",
      description: "Your announcement has been published successfully.",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Announcements</h1>
              <p className="text-muted-foreground">Stay updated with the latest university news and updates</p>
            </div>
            {(user.role === "admin" || user.role === "lecturer") && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                    <DialogDescription>Share important information with students and staff</DialogDescription>
                  </DialogHeader>
                  <CreateAnnouncementForm onSubmit={handleCreateAnnouncement} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search announcements..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
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
          <ScrollArea className="h-full">
            {filteredAnnouncements.map((announcement) => (
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
            ))}
          </ScrollArea>
        </main>
      </div>
    </div>
  )
}
