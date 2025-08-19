'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Search, Plus, MapPin, Calendar, User, MessageCircle, Trash2, CheckCircle, XCircle, Shield } from 'lucide-react'
import { format } from 'date-fns'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

interface LostFoundPost {
  _id: string
  authorId: string
  authorName: string
  type: 'lost' | 'found'
  title: string
  description: string
  category: string
  location?: string
  date?: string
  contactInfo?: string
  imageUrl?: string
  status: 'open' | 'resolved'
  claimedBy?: string
  claimedByName?: string
  claimedAt?: string
  comments: Comment[]
  createdAt: string
}

interface Comment {
  _id: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

export default function LostAndFoundPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [posts, setPosts] = useState<LostFoundPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [selectedPost, setSelectedPost] = useState<LostFoundPost | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    type: 'lost',
    title: '',
    description: '',
    category: 'other',
    location: '',
    date: '',
    contactInfo: '',
    image: null as File | null
  })

  useEffect(() => {
    fetchPosts()
  }, [filterType, filterStatus, filterCategory])

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams()
      if (filterType && filterType !== 'all') params.append('type', filterType)
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus)
      if (filterCategory && filterCategory !== 'all') params.append('category', filterCategory)

      const response = await fetch(`/api/lostfound?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setPosts(data.posts)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch posts',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch posts',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!formData.title || !formData.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setSubmitting(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('type', formData.type)
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)
      if (formData.location) formDataToSend.append('location', formData.location)
      if (formData.date) formDataToSend.append('date', formData.date)
      if (formData.contactInfo) formDataToSend.append('contactInfo', formData.contactInfo)
      if (formData.image) formDataToSend.append('image', formData.image)

      const response = await fetch('/api/lostfound', {
        method: 'POST',
        body: formDataToSend
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Post created successfully'
        })
        setShowCreateDialog(false)
        setFormData({
          type: 'lost',
          title: '',
          description: '',
          category: 'other',
          location: '',
          date: '',
          contactInfo: '',
          image: null
        })
        fetchPosts()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create post',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClaimItem = async (postId: string) => {
    try {
      const response = await fetch(`/api/lostfound/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'resolved',
          claimedBy: user?._id?.toString(),
          claimedByName: user?.name
        })
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Item marked as claimed'
        })
        fetchPosts()
        if (selectedPost) {
          setSelectedPost({ ...selectedPost, status: 'resolved', claimedBy: user?._id?.toString(), claimedByName: user?.name })
        }
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Failed to claim item',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to claim item',
        variant: 'destructive'
      })
    }
  }

  const handleDeletePost = async (postId: string) => {
    const post = posts.find(p => p._id === postId)
    const isOwnPost = user?._id?.toString() === post?.authorId
    const isAdmin = hasAdminPrivileges(user)
    
    let confirmMessage = 'Are you sure you want to delete this post?'
    if (isAdmin && !isOwnPost) {
      confirmMessage = `You are about to delete a post by ${post?.authorName}. This action cannot be undone. Are you sure?`
    }
    
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/lostfound/${postId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Post deleted successfully'
        })
        fetchPosts()
        setShowPostDialog(false)
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete post',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive'
      })
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return

    try {
      const response = await fetch(`/api/lostfound/${selectedPost._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedPost({
          ...selectedPost,
          comments: [...selectedPost.comments, data.comment]
        })
        setNewComment('')
        toast({
          title: 'Success',
          description: 'Comment added successfully'
        })
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Failed to add comment',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedPost) return

    const comment = selectedPost.comments.find(c => c._id === commentId)
    const isOwnComment = user?._id?.toString() === comment?.authorId
    const isAdmin = hasAdminPrivileges(user)
    
    let confirmMessage = 'Are you sure you want to delete this comment?'
    if (isAdmin && !isOwnComment) {
      confirmMessage = `You are about to delete a comment by ${comment?.authorName}. This action cannot be undone. Are you sure?`
    }
    
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/lostfound/${selectedPost._id}/comments`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commentId })
      })

      if (response.ok) {
        setSelectedPost({
          ...selectedPost,
          comments: selectedPost.comments.filter(c => c._id !== commentId)
        })
        toast({
          title: 'Success',
          description: 'Comment deleted successfully'
        })
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete comment',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive'
      })
    }
  }

  const filteredPosts = posts.filter(post => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.authorName.toLowerCase().includes(query) ||
        (post.location && post.location.toLowerCase().includes(query))
      )
    }
    return true
  })

  const getStatusColor = (status: string) => {
    return status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
  }

  const getTypeColor = (type: string) => {
    return type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
  }

  const hasAdminPrivileges = (user: any) => {
    return user?.role === 'admin' || user?.role === 'lecturer'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl">
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">  
              <div className="h-6 w-1/2 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
            </div>

          </div>
          <div className="h-32 w-full bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-muted rounded animate-pulse" />
            <div className="h-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content with header */}
      <div className="md:ml-64">
        <Header />

        <main className="p-6">
        <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Lost & Found</h1>
            {hasAdminPrivileges(user) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {user?.role === 'admin' ? 'Admin' : 'Lecturer'}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Help each other find lost items</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Post Item
            </Button>
          </DialogTrigger>
                     <DialogContent className="max-w-2xl" aria-describedby="create-post-description">
             <DialogHeader>
               <DialogTitle>Post Lost or Found Item</DialogTitle>
             </DialogHeader>
             <div id="create-post-description" className="sr-only">
               Form to create a new lost or found item post
             </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as 'lost' | 'found' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="found">Found</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="books">Books</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the item"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the item"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Where was it lost/found?"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Contact Information</label>
                <Input
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  placeholder="How can people contact you?"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Image (optional)</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePost} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Post'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
                         <div>
               <label className="text-sm font-medium">Type</label>
               <Select value={filterType} onValueChange={setFilterType}>
                 <SelectTrigger>
                   <SelectValue placeholder="All types" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All types</SelectItem>
                   <SelectItem value="lost">Lost</SelectItem>
                   <SelectItem value="found">Found</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div>
               <label className="text-sm font-medium">Status</label>
               <Select value={filterStatus} onValueChange={setFilterStatus}>
                 <SelectTrigger>
                   <SelectValue placeholder="All status" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All status</SelectItem>
                   <SelectItem value="open">Open</SelectItem>
                   <SelectItem value="resolved">Resolved</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div>
               <label className="text-sm font-medium">Category</label>
               <Select value={filterCategory} onValueChange={setFilterCategory}>
                 <SelectTrigger>
                   <SelectValue placeholder="All categories" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All categories</SelectItem>
                   <SelectItem value="electronics">Electronics</SelectItem>
                   <SelectItem value="clothing">Clothing</SelectItem>
                   <SelectItem value="books">Books</SelectItem>
                   <SelectItem value="accessories">Accessories</SelectItem>
                   <SelectItem value="other">Other</SelectItem>
                 </SelectContent>
               </Select>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <Card key={post._id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getTypeColor(post.type)}>
                      {post.type.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(post.status)}>
                      {post.status === 'open' ? 'OPEN' : 'RESOLVED'}
                    </Badge>
                    <Badge variant="outline">
                      {post.category}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {post.description}
              </p>
              
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-32 object-cover rounded-md mb-4"
                />
              )}

              <div className="space-y-2 text-sm text-muted-foreground">
                {post.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {post.location}
                  </div>
                )}
                {post.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(post.date), 'MMM dd, yyyy')}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {post.authorName}
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {post.comments.length} comments
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPost(post)
                    setShowPostDialog(true)
                  }}
                >
                  View Details
                </Button>
                {post.status === 'open' && user && (
                  <Button
                    size="sm"
                    onClick={() => handleClaimItem(post._id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Claim
                  </Button>
                )}
                {(user?._id?.toString() === post.authorId || hasAdminPrivileges(user)) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePost(post._id)}
                    title={hasAdminPrivileges(user) && user?._id?.toString() !== post.authorId ? `Delete post by ${post.authorName}` : 'Delete your post'}
                    className={hasAdminPrivileges(user) && user?._id?.toString() !== post.authorId ? 'relative' : ''}
                  >
                    <Trash2 className="w-4 h-4" />
                    {hasAdminPrivileges(user) && user?._id?.toString() !== post.authorId && (
                      <Shield className="w-3 h-3 absolute -top-1 -right-1 text-white" />
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts found</p>
        </div>
      )}

      {/* Post Detail Dialog */}
             <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
         <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="post-detail-description">
           <div id="post-detail-description" className="sr-only">
             Detailed view of lost or found item post
           </div>
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPost.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(selectedPost.type)}>
                    {selectedPost.type.toUpperCase()}
                  </Badge>
                  <Badge className={getStatusColor(selectedPost.status)}>
                    {selectedPost.status === 'open' ? 'OPEN' : 'RESOLVED'}
                  </Badge>
                  <Badge variant="outline">
                    {selectedPost.category}
                  </Badge>
                </div>

                <p className="text-sm">{selectedPost.description}</p>

                {selectedPost.imageUrl && (
                  <img
                    src={selectedPost.imageUrl}
                    alt={selectedPost.title}
                    className="w-full max-h-64 object-cover rounded-md"
                  />
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedPost.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedPost.location}
                    </div>
                  )}
                  {selectedPost.date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(selectedPost.date), 'MMM dd, yyyy')}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {selectedPost.authorName}
                  </div>
                  {selectedPost.contactInfo && (
                    <div className="flex items-center gap-2">
                      <span>Contact: {selectedPost.contactInfo}</span>
                    </div>
                  )}
                </div>

                {selectedPost.status === 'resolved' && selectedPost.claimedByName && (
                  <div className="bg-green-50 p-4 rounded-md">
                    <p className="text-green-800">
                      <strong>Claimed by:</strong> {selectedPost.claimedByName}
                      {selectedPost.claimedAt && (
                        <span className="ml-2 text-sm">
                          on {format(new Date(selectedPost.claimedAt), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Comments Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Comments ({selectedPost.comments.length})</h3>
                  
                  <div className="space-y-4 mb-4">
                    {selectedPost.comments.map((comment) => (
                      <div key={comment._id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {comment.authorName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                                                         {(user?._id?.toString() === comment.authorId || hasAdminPrivileges(user)) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(comment._id)}
                                className={`h-auto p-1 ${hasAdminPrivileges(user) && user?._id?.toString() !== comment.authorId ? 'relative' : ''}`}
                                title={hasAdminPrivileges(user) && user?._id?.toString() !== comment.authorId ? `Delete comment by ${comment.authorName}` : 'Delete your comment'}
                              >
                                <Trash2 className="w-3 h-3" />
                                {hasAdminPrivileges(user) && user?._id?.toString() !== comment.authorId && (
                                  <Shield className="w-2 h-2 absolute -top-0.5 -right-0.5 text-red-500" />
                                )}
                              </Button>
                            )}
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                      Comment
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    {selectedPost.status === 'open' && user && (
                      <Button onClick={() => handleClaimItem(selectedPost._id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Claim Item
                      </Button>
                    )}
                  </div>
                  
                                     {(user?._id?.toString() === selectedPost.authorId || hasAdminPrivileges(user)) && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeletePost(selectedPost._id)}
                      title={hasAdminPrivileges(user) && user?._id?.toString() !== selectedPost.authorId ? `Delete post by ${selectedPost.authorName}` : 'Delete your post'}
                      className={hasAdminPrivileges(user) && user?._id?.toString() !== selectedPost.authorId ? 'relative' : ''}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Post
                      {hasAdminPrivileges(user) && user?._id?.toString() !== selectedPost.authorId && (
                        <Shield className="w-3 h-3 ml-1" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
 
        </main>
      </div>
    </div>
 )
}
 