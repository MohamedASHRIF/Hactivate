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
import { useSearchParams } from "next/navigation"
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

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

interface Ticket {
  _id?: string
  id?: string
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
  // Enhanced fields
  subcategory?: string
  contactMethod?: string
  urgencyReason?: string
  expectedResolution?: string
  additionalDetails?: string
  attachments?: Array<{
    name: string
    size: number
    type: string
    url: string
  }>
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
  const searchParams = useSearchParams()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [replyMessage, setReplyMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Check for URL parameters to auto-open create dialog
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'new') {
      setIsCreateDialogOpen(true)
    }
  }, [searchParams])

  // Fetch tickets from API
  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tickets')
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      } else {
        toast({
          title: "Error fetching tickets",
          description: "Failed to load tickets",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTickets()
    }
  }, [user])

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

  const handleCreateTicket = async (formData: any) => {
    try {
      setSubmitting(true)
      
      const ticketData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        subcategory: formData.subcategory,
        contactMethod: formData.contactMethod,
        urgencyReason: formData.urgencyReason,
        expectedResolution: formData.expectedResolution,
        additionalDetails: formData.additionalDetails,
        attachments: formData.attachments || [],
      }

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        await fetchTickets() // Refresh tickets list
        toast({
          title: "Ticket created successfully",
          description: "Your support ticket has been submitted and will be reviewed shortly.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error creating ticket",
          description: error.message || "Failed to create ticket",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast({
        title: "Error creating ticket",
        description: "Please try again later",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = () => {
    if (!replyMessage.trim() || !selectedTicket) return

    const newReply: TicketReply = {
      id: Date.now().toString(),
      userId: user?._id?.toString() || "",
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Support Ticket</DialogTitle>
                    <DialogDescription>
                      Provide detailed information about your issue to help us assist you better.
                    </DialogDescription>
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
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Clock className="h-6 w-6 animate-spin mr-2" />
                          <span>Loading tickets...</span>
                        </div>
                      ) : filteredTickets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No tickets found</p>
                          {user?.role === "student" && (
                            <p className="text-sm mt-2">Create your first support ticket to get help</p>
                          )}
                        </div>
                      ) : (
                        filteredTickets.map((ticket) => (
                          <div
                            key={ticket._id || ticket.id}
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
                        ))
                      )}
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
                      {selectedTicket.subcategory && <span>• {selectedTicket.subcategory}</span>}
                      {selectedTicket.assignedTo && <span>• Assigned to: {selectedTicket.assignedTo}</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col h-full p-0">
                    <ScrollArea className="flex-1 p-6">
                      <div className="space-y-6">
                        {/* Original Message */}
                        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
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
                          
                          {/* Main Description */}
                          <div>
                            <h4 className="text-sm font-medium mb-2">Description:</h4>
                            <p className="text-sm">{selectedTicket.description}</p>
                          </div>
                          
                          {/* Additional Information Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            {selectedTicket.subcategory && (
                              <div>
                                <h5 className="text-xs font-medium text-muted-foreground mb-1">Subcategory:</h5>
                                <p className="text-sm">{selectedTicket.subcategory}</p>
                              </div>
                            )}
                            
                            {selectedTicket.contactMethod && (
                              <div>
                                <h5 className="text-xs font-medium text-muted-foreground mb-1">Preferred Contact:</h5>
                                <p className="text-sm capitalize">{selectedTicket.contactMethod}</p>
                              </div>
                            )}
                            
                            {selectedTicket.urgencyReason && (
                              <div className="md:col-span-2">
                                <h5 className="text-xs font-medium text-muted-foreground mb-1">Urgency Reason:</h5>
                                <p className="text-sm">{selectedTicket.urgencyReason}</p>
                              </div>
                            )}
                            
                            {selectedTicket.expectedResolution && (
                              <div className="md:col-span-2">
                                <h5 className="text-xs font-medium text-muted-foreground mb-1">Expected Resolution:</h5>
                                <p className="text-sm">{selectedTicket.expectedResolution}</p>
                              </div>
                            )}
                            
                            {selectedTicket.additionalDetails && (
                              <div className="md:col-span-2">
                                <h5 className="text-xs font-medium text-muted-foreground mb-1">Additional Details:</h5>
                                <p className="text-sm">{selectedTicket.additionalDetails}</p>
                              </div>
                            )}
                            
                            {/* Attachments */}
                            {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                              <div className="md:col-span-2">
                                <h5 className="text-xs font-medium text-muted-foreground mb-2">Attachments:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {selectedTicket.attachments.map((attachment, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-background border rounded px-3 py-2">
                                      <Paperclip className="h-3 w-3" />
                                      <span className="text-xs">{attachment.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ({(attachment.size / 1024).toFixed(1)}KB)
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
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
    subcategory: "",
    contactMethod: "email",
    urgencyReason: "",
    expectedResolution: "",
    additionalDetails: "",
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const categoryOptions = {
    academic: {
      label: "Academic",
      subcategories: [
        "Course Materials",
        "Assignment Issues",
        "Grade Inquiry",
        "Exam Schedule",
        "Curriculum Questions",
        "Academic Advising"
      ]
    },
    technical: {
      label: "Technical",
      subcategories: [
        "Login Problems",
        "Platform Access",
        "File Upload Issues",
        "System Errors",
        "Mobile App Issues",
        "Browser Compatibility"
      ]
    },
    administrative: {
      label: "Administrative",
      subcategories: [
        "Enrollment Issues",
        "Fee Payment",
        "Document Requests",
        "Schedule Changes",
        "ID Card Issues",
        "Contact Information"
      ]
    },
    other: {
      label: "Other",
      subcategories: [
        "General Inquiry",
        "Feedback",
        "Feature Request",
        "Complaint",
        "Suggestion"
      ]
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const validFiles = newFiles.filter(file => {
        const maxSize = 5 * 1024 * 1024 // 5MB
        const allowedTypes = ['image/', 'application/pdf', 'text/', '.doc', '.docx']
        
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 5MB`,
            variant: "destructive"
          })
          return false
        }
        
        const isAllowed = allowedTypes.some(type => 
          file.type.startsWith(type) || file.name.toLowerCase().endsWith(type)
        )
        
        if (!isAllowed) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported file type`,
            variant: "destructive"
          })
          return false
        }
        
        return true
      })
      
      setAttachments(prev => [...prev, ...validFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }

      // Create ticket data with attachments
      const ticketData = {
        ...formData,
        attachments: attachments.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          // In a real implementation, you would upload files to a server
          url: URL.createObjectURL(file)
        })),
        createdAt: new Date().toISOString(),
        status: "open"
      }

      await onSubmit(ticketData)
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        priority: "medium",
        subcategory: "",
        contactMethod: "email",
        urgencyReason: "",
        expectedResolution: "",
        additionalDetails: "",
      })
      setAttachments([])
      
      toast({
        title: "Ticket created successfully",
        description: "Your support ticket has been submitted and will be reviewed shortly.",
      })
    } catch (error) {
      toast({
        title: "Error creating ticket",
        description: "Please try again later",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief description of your issue"
          required
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          {formData.title.length}/100 characters
        </p>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select 
          value={formData.category} 
          onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: "" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categoryOptions).map(([key, option]) => (
              <SelectItem key={key} value={key}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subcategory */}
      {formData.category && (
        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategory</Label>
          <Select 
            value={formData.subcategory} 
            onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions[formData.category as keyof typeof categoryOptions]?.subcategories.map((sub) => (
                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="priority">Priority *</Label>
        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Low - General inquiry or minor issue
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                Medium - Standard request
              </div>
            </SelectItem>
            <SelectItem value="high">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                High - Important issue affecting work
              </div>
            </SelectItem>
            <SelectItem value="urgent">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Urgent - Critical issue needing immediate attention
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Urgency Reason for High/Urgent tickets */}
      {(formData.priority === "high" || formData.priority === "urgent") && (
        <div className="space-y-2">
          <Label htmlFor="urgencyReason">Reason for urgency *</Label>
          <Textarea
            id="urgencyReason"
            value={formData.urgencyReason}
            onChange={(e) => setFormData({ ...formData, urgencyReason: e.target.value })}
            placeholder="Please explain why this issue is urgent"
            className="min-h-[60px]"
            required
          />
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Detailed Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Provide detailed information about your issue. Include steps to reproduce if applicable."
          className="min-h-[120px]"
          required
        />
        <p className="text-xs text-muted-foreground">
          Include what you were trying to do, what happened, and what you expected to happen.
        </p>
      </div>

      {/* Expected Resolution */}
      <div className="space-y-2">
        <Label htmlFor="expectedResolution">Expected Resolution</Label>
        <Textarea
          id="expectedResolution"
          value={formData.expectedResolution}
          onChange={(e) => setFormData({ ...formData, expectedResolution: e.target.value })}
          placeholder="What would you like us to do to resolve this issue?"
          className="min-h-[60px]"
        />
      </div>

      {/* Contact Method */}
      <div className="space-y-2">
        <Label htmlFor="contactMethod">Preferred Contact Method</Label>
        <Select 
          value={formData.contactMethod} 
          onValueChange={(value) => setFormData({ ...formData, contactMethod: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="chat">Platform Chat</SelectItem>
            <SelectItem value="in-person">In-person Meeting</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* File Attachments */}
      <div className="space-y-2">
        <Label htmlFor="attachments">Attachments</Label>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
          <Input
            id="attachments"
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
            className="hidden"
          />
          <Label 
            htmlFor="attachments" 
            className="cursor-pointer flex flex-col items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Paperclip className="h-6 w-6" />
            <span>Click to upload files or drag and drop</span>
            <span className="text-xs">PDF, DOC, images up to 5MB each</span>
          </Label>
        </div>
        
        {/* Show attached files */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <Label>Attached Files:</Label>
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Details */}
      <div className="space-y-2">
        <Label htmlFor="additionalDetails">Additional Details</Label>
        <Textarea
          id="additionalDetails"
          value={formData.additionalDetails}
          onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
          placeholder="Any other information that might be helpful"
          className="min-h-[80px]"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Clock className="mr-2 h-4 w-4 animate-spin" />
            Creating Ticket...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </>
        )}
      </Button>
    </form>
  )
}
