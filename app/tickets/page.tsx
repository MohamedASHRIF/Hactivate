"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageSquare,
  Paperclip,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Ticket {
  id: string
  title: string
  description: string
  category: "academic" | "technical" | "administrative" | "other"
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in-progress" | "resolved" | "closed"
  studentName: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
  replies: TicketReply[]
}

interface TicketReply {
  id: string
  userId: string
  userName: string
  message: string
  createdAt: string
}

export default function TicketsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [replyMessage, setReplyMessage] = useState("")

  // Mock tickets data
  const mockTickets: Ticket[] = [
    {
      id: "1",
      title: "Cannot access course materials",
      description: "I am unable to download the lecture slides from the portal. The download button is not working.",
      category: "technical",
      priority: "medium",
      status: "open",
      studentName: "John Student",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
      replies: [],
    },
    {
      id: "2",
      title: "Question about assignment deadline",
      description: "Can the deadline for Assignment 2 be extended? I have been sick and unable to complete it on time.",
      category: "academic",
      priority: "low",
      status: "in-progress",
      studentName: "Jane Doe",
      assignedTo: "Dr. Smith",
      createdAt: "2024-01-14T14:20:00Z",
      updatedAt: "2024-01-15T09:15:00Z",
      replies: [
        {
          id: "1",
          userId: "lecturer1",
          userName: "Dr. Smith",
          message:
            "I understand your situation. Please provide a medical certificate and I will consider the extension.",
          createdAt: "2024-01-15T09:15:00Z",
        },
      ],
    },
    {
      id: "3",
      title: "Library access card not working",
      description: "My student ID card is not working at the library turnstiles.",
      category: "administrative",
      priority: "high",
      status: "resolved",
      studentName: "Mike Johnson",
      assignedTo: "Admin User",
      createdAt: "2024-01-13T16:45:00Z",
      updatedAt: "2024-01-14T11:30:00Z",
      replies: [
        {
          id: "2",
          userId: "admin1",
          userName: "Admin User",
          message: "Your card has been reactivated. Please try again.",
          createdAt: "2024-01-14T11:30:00Z",
        },
      ],
    },
  ]

  useEffect(() => {
    setTickets(mockTickets)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4" />
      case "in-progress":
        return <Clock className="h-4 w-4" />
      case "resolved":
        return <CheckCircle className="h-4 w-4" />
      case "closed":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleCreateTicket = (formData: any) => {
    const newTicket: Ticket = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      status: "open",
      studentName: user?.name || "Unknown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [],
    }

    setTickets([newTicket, ...tickets])
    setIsCreateDialogOpen(false)
    toast({
      title: "Ticket created",
      description: "Your support ticket has been submitted successfully.",
    })
  }

  const handleReply = () => {
    if (!replyMessage.trim() || !selectedTicket) return

    const newReply: TicketReply = {
      id: Date.now().toString(),
      userId: user?._id || "",
      userName: user?.name || "Unknown",
      message: replyMessage,
      createdAt: new Date().toISOString(),
    }

    const updatedTicket = {
      ...selectedTicket,
      replies: [...selectedTicket.replies, newReply],
      updatedAt: new Date().toISOString(),
    }

    setSelectedTicket(updatedTicket)
    setTickets(tickets.map((t) => (t.id === selectedTicket.id ? updatedTicket : t)))
    setReplyMessage("")

    toast({
      title: "Reply sent",
      description: "Your reply has been added to the ticket.",
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
              <h1 className="text-3xl font-bold">Support Tickets</h1>
              <p className="text-muted-foreground">Manage and track your support requests</p>
            </div>
            {user.role === "student" && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Support Ticket</DialogTitle>
                    <DialogDescription>Describe your issue and we'll help you resolve it.</DialogDescription>
                  </DialogHeader>
                  <CreateTicketForm onSubmit={handleCreateTicket} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search tickets..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="administrative">Administrative</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-20rem)]">
                    <div className="space-y-2 p-4">
                      {filteredTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className={cn(
                            "p-4 rounded-lg border cursor-pointer transition-colors",
                            selectedTicket?.id === ticket.id ? "bg-primary/10 border-primary" : "hover:bg-muted",
                          )}
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-sm truncate flex-1">{ticket.title}</h3>
                            <Badge variant="secondary" className={cn("text-xs", getStatusColor(ticket.status))}>
                              {getStatusIcon(ticket.status)}
                              <span className="ml-1 capitalize">{ticket.status}</span>
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{ticket.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={cn("text-xs", getPriorityColor(ticket.priority))}>
                              {ticket.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Details */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <Card className="h-[calc(100vh-12rem)]">
                  <CardHeader className="border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{selectedTicket.title}</CardTitle>
                        <CardDescription className="mt-2">
                          Submitted by {selectedTicket.studentName} on{" "}
                          {new Date(selectedTicket.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className={cn(getStatusColor(selectedTicket.status))}>
                          {getStatusIcon(selectedTicket.status)}
                          <span className="ml-1 capitalize">{selectedTicket.status}</span>
                        </Badge>
                        <Badge variant="outline" className={cn(getPriorityColor(selectedTicket.priority))}>
                          {selectedTicket.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Category: {selectedTicket.category}</span>
                      {selectedTicket.assignedTo && <span>Assigned to: {selectedTicket.assignedTo}</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col h-full p-0">
                    <ScrollArea className="flex-1 p-6">
                      <div className="space-y-6">
                        {/* Original Message */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {selectedTicket.studentName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{selectedTicket.studentName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(selectedTicket.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{selectedTicket.description}</p>
                        </div>

                        {/* Replies */}
                        {selectedTicket.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {reply.userName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-background border rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium">{reply.userName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(reply.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm">{reply.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Reply Input */}
                    {selectedTicket.status !== "closed" && (
                      <div className="border-t p-4">
                        <div className="flex space-x-2">
                          <Textarea
                            placeholder="Type your reply..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            className="flex-1 min-h-[80px]"
                          />
                          <div className="flex flex-col space-y-2">
                            <Button variant="outline" size="icon">
                              <Paperclip className="h-4 w-4" />
                            </Button>
                            <Button onClick={handleReply} size="icon">
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-[calc(100vh-12rem)]">
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Select a ticket</h3>
                      <p className="text-muted-foreground">Choose a ticket from the list to view details and replies</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function CreateTicketForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ title: "", description: "", category: "", priority: "medium" })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief description of your issue"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="administrative">Administrative</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Provide detailed information about your issue"
          className="min-h-[100px]"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Create Ticket
      </Button>
    </form>
  )
}
