"use client"

import { Suspense } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import AppointmentsContent from "@/app/appointments/appointments-content"

export default function AppointmentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <Suspense fallback={
          <main className="p-6">
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="lg:col-span-2 h-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </main>
        }>
          <AppointmentsContent />
        </Suspense>
      </div>
    </div>
  )
}
