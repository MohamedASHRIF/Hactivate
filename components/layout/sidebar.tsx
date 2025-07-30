"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Home, 
  MessageSquare, 
  Ticket, 
  Calendar, 
  Megaphone, 
  Settings, 
  LogOut,
  Users,
  BarChart3,
  MessageCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const navigation = {
    student: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Live Chat", href: "/chat", icon: MessageSquare },
      { name: "Forum", href: "/forum", icon: MessageCircle },
      { name: "My Tickets", href: "/tickets", icon: Ticket },
      { name: "Appointments", href: "/appointments", icon: Calendar },
      { name: "Announcements", href: "/announcements", icon: Megaphone },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
    lecturer: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Live Chat", href: "/chat", icon: MessageSquare },
      { name: "Forum", href: "/forum", icon: MessageCircle },
      { name: "Tickets", href: "/tickets", icon: Ticket },
      { name: "Appointments", href: "/appointments", icon: Calendar },
      { name: "Announcements", href: "/announcements", icon: Megaphone },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
    admin: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { name: "User Management", href: "/admin/users", icon: Users },
      { name: "Tickets", href: "/tickets", icon: Ticket },
      { name: "Announcements", href: "/announcements", icon: Megaphone },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  }

  const currentNav = navigation[user?.role as keyof typeof navigation] || navigation.student

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">UniConnect</h1>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role || "User"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {currentNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
