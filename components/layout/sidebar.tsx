"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/components/auth-provider"
import {
  MessageSquare,
  Ticket,
  Calendar,
  Megaphone,
  Settings,
  Home,
  Users,
  BarChart3,
  Menu,
  X,
  LogOut,
} from "lucide-react"

const navigation = {
  student: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Live Chat", href: "/chat", icon: MessageSquare },
    { name: "My Tickets", href: "/tickets", icon: Ticket },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "Announcements", href: "/announcements", icon: Megaphone },
    { name: "Settings", href: "/settings", icon: Settings },
  ],
  lecturer: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Live Chat", href: "/chat", icon: MessageSquare },
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

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  const userNavigation = navigation[user.role] || navigation.student

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <h1 className="text-xl font-bold text-primary">UniConnect</h1>
          </div>

          {/* User info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {userNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start" onClick={logout}>
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
