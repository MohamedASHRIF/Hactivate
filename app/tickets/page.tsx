"use client"

import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import UserTicketView from "@/components/tickets/student"
import AdminTicketView from "@/components/tickets/admin"

export const dynamic = "force-dynamic"

export default function TicketsPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to view tickets.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main className="p-6">{user.role === "admin" ? <AdminTicketView /> : <UserTicketView />}</main>
      </div>
    </div>
  )
}
