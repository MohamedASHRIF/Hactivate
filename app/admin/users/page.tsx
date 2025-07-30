"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, Edit, Trash2, Key, Users, Search } from "lucide-react"
import { useRouter } from "next/navigation"

interface User {
  _id: string
  fullName: string
  email: string
  role: string
  department?: string
  studentId?: string
  isOnline: boolean
  lastSeen: string
  createdAt: string
}

export default function AdminUsersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  
  // Create user dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "",
    department: "",
    studentId: ""
  })
  
  // Reset password dialog state
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetUserId, setResetUserId] = useState("")
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchUsers()
    }
  }, [user])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const userData = await res.json()
        setUsers(userData)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Fetch users error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.studentId && user.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm)
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Success",
          description: "User created successfully"
        })
        setShowCreateDialog(false)
        setCreateForm({
          fullName: "",
          email: "",
          password: "",
          role: "",
          department: "",
          studentId: ""
        })
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create user",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Create user error:", error)
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Success",
          description: `User ${userName} deleted successfully`
        })
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete user",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Delete user error:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      })
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetting(true)

    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resetUserId, newPassword })
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Success",
          description: "Password reset successfully"
        })
        setShowResetDialog(false)
        setResetUserId("")
        setNewPassword("")
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to reset password",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Reset password error:", error)
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      })
    } finally {
      setResetting(false)
    }
  }

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 md:ml-64 p-4 md:p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
              <div className="grid gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8" />
                User Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage student and lecturer accounts
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <Badge variant="secondary">Student</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter(u => u.role === "student").length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lecturers</CardTitle>
                  <Badge variant="outline">Lecturer</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter(u => u.role === "lecturer").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Users ({filteredUsers.length})</CardTitle>
                    <CardDescription>
                      Manage student and lecturer accounts
                    </CardDescription>
                  </div>
                  
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <form onSubmit={handleCreateUser}>
                        <DialogHeader>
                          <DialogTitle>Create New User</DialogTitle>
                          <DialogDescription>
                            Add a new student or lecturer account
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                              id="fullName"
                              value={createForm.fullName}
                              onChange={(e) => setCreateForm({...createForm, fullName: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={createForm.email}
                              onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              value={createForm.password}
                              onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                              required
                              minLength={6}
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={createForm.role} onValueChange={(value) => setCreateForm({...createForm, role: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="lecturer">Lecturer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="department">Department (Optional)</Label>
                            <Input
                              id="department"
                              value={createForm.department}
                              onChange={(e) => setCreateForm({...createForm, department: e.target.value})}
                            />
                          </div>
                          
                          {createForm.role === "student" && (
                            <div className="grid gap-2">
                              <Label htmlFor="studentId">Student ID (Optional)</Label>
                              <Input
                                id="studentId"
                                value={createForm.studentId}
                                onChange={(e) => setCreateForm({...createForm, studentId: e.target.value})}
                              />
                            </div>
                          )}
                        </div>
                        
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={creating}>
                            {creating ? "Creating..." : "Create User"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or student ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="lecturer">Lecturers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell className="font-medium">{user.fullName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "student" ? "secondary" : "outline"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.department || "-"}</TableCell>
                          <TableCell>{user.studentId || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={user.isOnline ? "default" : "secondary"}>
                              {user.isOnline ? "Online" : "Offline"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setResetUserId(user._id)
                                  setShowResetDialog(true)
                                }}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {user.fullName}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(user._id, user.fullName)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter a new password for this user
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowResetDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={resetting}>
                {resetting ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
