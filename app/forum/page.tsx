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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, MessageSquare, Users, Shield, Eye, ThumbsUp, ThumbsDown, CheckCircle, Clock, Tag, Reply, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import CreateForumPostForm from "@/components/forms/create-forum-post-form"

interface ForumPost {
  _id: string
  title: string
  content: string
  category: string
  status: "open" | "resolved" | "closed"
  tags: string[]
  authorName: string
  authorRole: string
  department: string
  isPinned: boolean
  isAnonymous: boolean
  upvotes: string[]
  downvotes: string[]
  views: number
  replies: any[]
  createdAt: Date
  lastActivityAt: Date
  hasUpvoted: boolean
  hasDownvoted: boolean
  voteCount: number
}

interface ForumStats {
  totalPosts: number
  totalReplies: number
  resolvedPosts: number
  openPosts: number
  myPosts: number
  myReplies: number
  categoryStats: any[]
  recentPosts: ForumPost[]
}

function ForumContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [stats, setStats] = useState<ForumStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [authorFilter, setAuthorFilter] = useState("all")

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (authorFilter !== "all") params.append("author", authorFilter)

      const response = await fetch(`/api/forum?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast({
        title: "Error",
        description: "Failed to load forum posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/forum/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  useEffect(() => {
    fetchPosts()
    fetchStats()
  }, [searchQuery, categoryFilter, statusFilter, authorFilter])

  const handleCreatePost = async (formData: any) => {
    try {
      const response = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Forum post created successfully",
        })
        setIsCreateDialogOpen(false)
        fetchPosts()
        fetchStats()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to create post",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create forum post",
        variant: "destructive",
      })
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!replyContent.trim() || !selectedPost) {
      toast({
        title: "Error",
        description: "Please enter a reply",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingReply(true)
    try {
      const response = await fetch(`/api/forum/${selectedPost._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Reply added successfully",
        })
        setIsReplyDialogOpen(false)
        setReplyContent("")
        setSelectedPost(null)
        fetchPosts()
        fetchStats()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to add reply",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding reply:", error)
      toast({
        title: "Error",
        description: "Failed to add reply",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleVote = async (postId: string, voteType: "upvote" | "downvote") => {
    try {
      const response = await fetch(`/api/forum/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote", voteType })
      })

      if (response.ok) {
        fetchPosts()
      }
    } catch (error) {
      console.error("Error voting:", error)
    }
  }

  const openReplyDialog = (post: ForumPost) => {
    setSelectedPost(post)
    setIsReplyDialogOpen(true)
  }

  const toggleExpanded = (postId: string) => {
    const newExpanded = new Set(expandedPosts)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedPosts(newExpanded)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "academic":
        return <MessageSquare className="h-4 w-4" />
      case "technical":
        return <Shield className="h-4 w-4" />
      case "general":
        return <Users className="h-4 w-4" />
      case "career":
        return <CheckCircle className="h-4 w-4" />
      case "social":
        return <Users className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "technical":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "general":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case "career":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "social":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || post.category === categoryFilter
    const matchesStatus = statusFilter === "all" || post.status === statusFilter
    const matchesAuthor = authorFilter === "all" || post.authorRole === authorFilter
    
    return matchesSearch && matchesCategory && matchesStatus && matchesAuthor
  })

  if (!user) return null

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  Forum
                </CardTitle>
                <p className="text-muted-foreground">
                  {user?.role === "student" && "Ask questions and get help from your department"}
                  {user?.role === "lecturer" && "Help students and participate in discussions"}
                </p>
              </div>
              {/* Only show create button for students */}
              {user?.role === "student" && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Ask Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Ask a Question</DialogTitle>
                      <DialogDescription>Share your question with your department community.</DialogDescription>
                    </DialogHeader>
                    <CreateForumPostForm 
                      onSubmit={handleCreatePost}
                      userRole={user?.role}
                      userDepartment={user?.department}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters and Statistics */}
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
                    placeholder="Search posts..."
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
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="career">Career</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
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
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="lecturer">Lecturers</SelectItem>
                    <SelectItem value="admin">Administrators</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Statistics */}
              {stats && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Posts</span>
                    <Badge variant="secondary">{stats.totalPosts}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Replies</span>
                    <Badge variant="secondary">{stats.totalReplies}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Resolved</span>
                    <Badge variant="secondary">{stats.resolvedPosts}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Open</span>
                    <Badge variant="secondary">{stats.openPosts}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">My Posts</span>
                    <Badge variant="secondary">{stats.myPosts}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">My Replies</span>
                    <Badge variant="secondary">{stats.myReplies}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Posts List */}
          <Card className="lg:col-span-3">
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  <div className="space-y-4">
                    {filteredPosts.map((post) => (
                      <Card key={post._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {post.isPinned && (
                                  <Badge variant="destructive" className="text-xs">Pinned</Badge>
                                )}
                                <Badge className={cn("text-xs", getCategoryColor(post.category))}>
                                  {getCategoryIcon(post.category)}
                                  <span className="ml-1 capitalize">{post.category}</span>
                                </Badge>
                                <Badge className={cn("text-xs", getStatusColor(post.status))}>
                                  {post.status}
                                </Badge>
                                {post.isAnonymous && (
                                  <Badge variant="outline" className="text-xs">Anonymous</Badge>
                                )}
                              </div>
                              
                              <h3 className="font-semibold text-lg mb-2 hover:text-primary cursor-pointer">
                                {post.title}
                              </h3>
                              
                              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                {post.content}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-xs">
                                      {post.authorName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{post.authorName}</span>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {post.authorRole}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(post.lastActivityAt)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {post.replies?.length || 0} replies
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {post.views} views
                                </div>
                              </div>
                              
                              {post.tags.length > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Tag className="h-3 w-3 text-muted-foreground" />
                                  {post.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {/* Reply Button and Expand Replies */}
                              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openReplyDialog(post)}
                                  className="flex items-center gap-2"
                                >
                                  <Reply className="h-4 w-4" />
                                  Reply
                                </Button>
                                
                                {post.replies && post.replies.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpanded(post._id)}
                                    className="flex items-center gap-2"
                                  >
                                    {expandedPosts.has(post._id) ? (
                                      <>
                                        <ChevronUp className="h-4 w-4" />
                                        Hide Replies
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="h-4 w-4" />
                                        Show {post.replies.length} Replies
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>

                              {/* Expanded Replies Section */}
                              {expandedPosts.has(post._id) && post.replies && post.replies.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                  <h4 className="font-medium text-sm mb-3 text-muted-foreground">
                                    Replies ({post.replies.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {post.replies.map((reply, index) => (
                                      <div key={index} className="bg-muted/50 rounded-lg p-3">
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                              <AvatarFallback className="text-xs">
                                                {reply.authorName.charAt(0)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium">{reply.authorName}</span>
                                            <Badge variant="outline" className="text-xs capitalize">
                                              {reply.authorRole}
                                            </Badge>
                                            {reply.isAcceptedAnswer && (
                                              <Badge variant="default" className="text-xs bg-green-600">
                                                Accepted Answer
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(reply.createdAt)}
                                          </div>
                                        </div>
                                        <p className="text-sm text-foreground">{reply.content}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleVote(post._id, "upvote")}
                                            className="h-6 w-6 p-0"
                                          >
                                            <ThumbsUp className="h-3 w-3" />
                                          </Button>
                                          <span className="text-xs text-muted-foreground">
                                            {(reply.upvotes?.length || 0) - (reply.downvotes?.length || 0)}
                                          </span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleVote(post._id, "downvote")}
                                            className="h-6 w-6 p-0"
                                          >
                                            <ThumbsDown className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-center gap-1 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVote(post._id, "upvote")}
                                className={cn(
                                  "h-8 w-8 p-0",
                                  post.hasUpvoted && "text-green-600"
                                )}
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <span className="text-sm font-medium">{post.voteCount}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVote(post._id, "downvote")}
                                className={cn(
                                  "h-8 w-8 p-0",
                                  post.hasDownvoted && "text-red-600"
                                )}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {filteredPosts.length === 0 && !loading && (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                        <p className="text-muted-foreground">
                          {searchQuery || categoryFilter !== "all" || statusFilter !== "all" || authorFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Be the first to ask a question!"}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Post</DialogTitle>
            <DialogDescription>
              {selectedPost && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm">{selectedPost.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedPost.content}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReply} className="space-y-4">
            <div>
              <Label htmlFor="reply-content" className="text-sm font-medium">
                Your Reply *
              </Label>
              <Textarea
                id="reply-content"
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[120px] resize-none mt-2"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsReplyDialogOpen(false)
                  setReplyContent("")
                  setSelectedPost(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingReply}>
                {isSubmittingReply ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Posting Reply...
                  </>
                ) : (
                  "Post Reply"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ForumPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main>
          <Suspense fallback={<div>Loading...</div>}>
            <ForumContent />
          </Suspense>
        </main>
      </div>
    </div>
  )
} 