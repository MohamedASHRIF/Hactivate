"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, GraduationCap, Eye, EyeOff, Mail, Lock, User, Building, Sparkles, Users, BookOpen, Shield, CheckCircle } from "lucide-react"
import { DEPARTMENT_OPTIONS } from "@/lib/constants/departments"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    department: "",
    studentId: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Account created!",
          description: "Please sign in with your new account.",
        })
        router.push("/auth/login")
      } else {
        const error = await response.json()
        toast({
          title: "Signup failed",
          description: error.message || "An error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student":
        return <Users className="h-4 w-4" />
      case "lecturer":
        return <BookOpen className="h-4 w-4" />
      case "admin":
        return <Shield className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden items-center justify-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 h-full w-full">
          <div className="text-center max-w-md mx-auto flex flex-col items-center justify-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full backdrop-blur-sm mb-6">
                <GraduationCap className="h-10 w-10" />
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Join UniConnect
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Start your academic journey with our comprehensive platform
              </p>
            </div>
            
            {/* Benefits */}
            <div className="space-y-4 mt-12">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4" />
                </div>
                                 <span className="text-blue-100">Free and easy registration</span>
               </div>
               <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                   <Shield className="h-4 w-4" />
                 </div>
                 <span className="text-blue-100">Secure and private</span>
               </div>
               <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                   <Sparkles className="h-4 w-4" />
                 </div>
                 <span className="text-blue-100">Instant access to all features</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">UniConnect</h1>
          </div>

          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create Account
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                Join our university community
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                         <Input
                       id="name"
                       value={formData.name}
                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                       className="pl-10 h-10 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                       placeholder="John Doe"
                       required
                     />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                         <Input
                       id="email"
                       type="email"
                       placeholder="your.email@university.edu"
                       value={formData.email}
                       onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                       className="pl-10 h-10 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                       required
                     />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                         <Input
                       id="password"
                       type={showPassword ? "text" : "password"}
                       value={formData.password}
                       onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                       className="pl-10 pr-10 h-10 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                       required
                     />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </Label>
                                     <Select onValueChange={(value) => setFormData({ ...formData, role: value })}>
                     <SelectTrigger className="h-10 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                       <SelectValue placeholder="Select your role" />
                     </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student" className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Student
                      </SelectItem>
                      <SelectItem value="lecturer" className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Lecturer
                      </SelectItem>
                      <SelectItem value="admin" className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Administrator
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Department {formData.role === "admin" && "(Optional for Administrators)"}
                  </Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, department: value })}>
                    <SelectTrigger className="h-10 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder={formData.role === "admin" ? "Select department (optional)" : "Select your department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENT_OPTIONS.map((department) => (
                        <SelectItem key={department.value} value={department.value}>
                          {department.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.role === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="studentId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Student ID
                    </Label>
                                         <Input
                       id="studentId"
                       placeholder="STU123456"
                       value={formData.studentId}
                       onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                       className="h-10 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                     />
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{" "}
                                     <Link 
                     href="/auth/login" 
                     className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                   >
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
