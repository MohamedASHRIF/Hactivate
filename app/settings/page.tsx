"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Camera, User, Lock, Clock, Save } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserProfile {
  _id: string
  name: string
  firstName: string
  lastName: string
  email: string
  role: string
  department?: string
  studentId?: string
  avatar?: string
  lastSeen: string
  createdAt: string
  updatedAt: string
}

export default function SettingsPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile")
      if (res.ok) {
        const profileData = await res.json()
        setProfile(profileData)
        setFirstName(profileData.firstName || "")
        setLastName(profileData.lastName || "")
        setAvatarUrl(profileData.avatar || "")
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch profile",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Fetch profile error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch profile",
        variant: "destructive"
      })
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updateData: any = {}

      // Update name if changed
      if (firstName !== profile?.firstName || lastName !== profile?.lastName) {
        updateData.firstName = firstName
        updateData.lastName = lastName
      }

      // Update avatar if changed
      if (avatarUrl !== profile?.avatar) {
        updateData.avatar = avatarUrl
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully"
        })
        setProfile(data.user)
        await refreshUser()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update profile",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Update profile error:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      })
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully"
        })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to change password",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Change password error:", error)
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const generateAvatar = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=200`
  }

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 md:ml-64 p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
                <div className="grid gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-muted rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <User className="h-8 w-8" />
                Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your account settings and preferences
              </p>
            </div>

            <div className="grid gap-6">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage 
                          src={avatarUrl || generateAvatar(profile.name)} 
                          alt={profile.name} 
                        />
                        <AvatarFallback className="text-lg">
                          {profile.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <Label htmlFor="avatar">Profile Picture URL</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="avatar"
                            type="url"
                            placeholder="Enter image URL or leave empty for auto-generated avatar"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAvatarUrl(generateAvatar(`${firstName} ${lastName}`))}
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          We'll generate a unique avatar if no URL is provided
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Read-only fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={profile.email} disabled />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Input value={profile.role} disabled className="capitalize" />
                      </div>
                    </div>

                    {profile.department && (
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Input value={profile.department} disabled />
                      </div>
                    )}

                    {profile.studentId && (
                      <div className="space-y-2">
                        <Label>Student ID</Label>
                        <Input value={profile.studentId} disabled />
                      </div>
                    )}

                    <Button type="submit" disabled={saving} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={saving} className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {saving ? "Changing..." : "Change Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    View your account details and activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Account Created</Label>
                      <div className="text-sm text-muted-foreground">
                        {new Date(profile.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Last Updated</Label>
                      <div className="text-sm text-muted-foreground">
                        {new Date(profile.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Last Login</Label>
                      <div className="text-sm text-muted-foreground">
                        {new Date(profile.lastSeen).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Account ID</Label>
                      <div className="text-sm text-muted-foreground font-mono">
                        {profile._id}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
