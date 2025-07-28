"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './auth-provider'

interface Notification {
  id: string
  title: string
  message: string
  type: 'announcement' | 'ticket' | 'appointment' | 'system'
  createdAt: Date
  isRead: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  refreshNotifications: () => Promise<void>
  markAsRead: (id: string) => void
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    if (!user) return

    try {
      // Fetch recent announcements
      const announcementsResponse = await fetch('/api/announcements')
      const announcements = announcementsResponse.ok ? await announcementsResponse.json() : []
      
      // Fetch recent tickets (for admins/lecturers)
      let tickets = []
      if (user.role === 'admin' || user.role === 'lecturer') {
        const ticketsResponse = await fetch('/api/tickets')
        tickets = ticketsResponse.ok ? await ticketsResponse.json() : []
      }

      // Fetch upcoming appointments
      const appointmentsResponse = await fetch('/api/appointments')
      const appointments = appointmentsResponse.ok ? await appointmentsResponse.json() : []

      // Convert to notifications
      const notificationsList: Notification[] = []

      // Add recent announcements (last 3)
      announcements.slice(0, 3).forEach((announcement: any) => {
        const createdAt = new Date(announcement.createdAt)
        // Only show announcements from last 7 days
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        if (createdAt > weekAgo) {
          notificationsList.push({
            id: `announcement-${announcement._id || announcement.id}`,
            title: announcement.title,
            message: announcement.content.slice(0, 60) + '...',
            type: 'announcement',
            createdAt,
            isRead: false
          })
        }
      })

      // Add recent tickets (last 2)
      tickets.slice(0, 2).forEach((ticket: any) => {
        const createdAt = new Date(ticket.createdAt)
        // Only show tickets from last 3 days
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        if (createdAt > threeDaysAgo) {
          notificationsList.push({
            id: `ticket-${ticket._id || ticket.id}`,
            title: `New ${ticket.category} ticket`,
            message: `${ticket.title} - ${ticket.priority} priority`,
            type: 'ticket',
            createdAt,
            isRead: false
          })
        }
      })

      // Add upcoming appointments (next 24 hours)
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      
      appointments
        .filter((apt: any) => {
          const aptDate = new Date(apt.startTime)
          return aptDate > now && aptDate < tomorrow && apt.status === 'scheduled'
        })
        .slice(0, 2)
        .forEach((appointment: any) => {
          notificationsList.push({
            id: `appointment-${appointment._id || appointment.id}`,
            title: 'Upcoming appointment',
            message: `${appointment.title} with ${user.role === 'student' ? appointment.lecturerName : appointment.studentName}`,
            type: 'appointment',
            createdAt: new Date(appointment.startTime),
            isRead: false
          })
        })

      // Sort by creation date (newest first)
      notificationsList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      setNotifications(notificationsList.slice(0, 5)) // Show max 5 notifications
      setUnreadCount(notificationsList.length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const refreshNotifications = async () => {
    await fetchNotifications()
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `custom-${Date.now()}`,
      createdAt: new Date(),
      isRead: false
    }
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)])
    setUnreadCount(prev => prev + 1)
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      // Refresh notifications every 5 minutes
      const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [user])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      refreshNotifications,
      markAsRead,
      addNotification
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
