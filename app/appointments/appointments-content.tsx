"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
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
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { Plus, CalendarIcon, Clock, User, Video, MapPin, Edit, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Appointment {
  id: string
  title: string
  description?: string
  lecturerName: string
  studentName: string
  startTime: Date
  endTime: Date
  status: "scheduled" | "completed" | "cancelled" | "rescheduled"
  meetingLink?: string
  location?: string
  notes?: string
}

interface TimeSlot {
  id: string
  lecturerId: string
  lecturerName: string
  startTime: Date
  endTime: Date
  isAvailable: boolean
}

export default function AppointmentsContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [isCreateSlotDialogOpen, setIsCreateSlotDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check for URL parameters to auto-open booking dialog
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'book') {
      setIsBookingDialogOpen(true)
    }
  }, [searchParams])

  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/appointments')
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      } else {
        toast({
          title: "Error fetching appointments",
          description: "Failed to load appointments",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch time slots from API
  const fetchTimeSlots = async () => {
    try {
      const response = await fetch('/api/timeslots')
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data)
      }
    } catch (error) {
      console.error('Error fetching time slots:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAppointments()
      fetchTimeSlots()
    }
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "rescheduled":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleBookAppointment = (slotId: string, formData: any) => {
    // Handle booking logic here
    toast({
      title: "Appointment Booked",
      description: "Your appointment has been successfully booked.",
    })
    setIsBookingDialogOpen(false)
  }

  const handleCreateTimeSlot = (formData: any) => {
    // Handle slot creation logic here
    toast({
      title: "Time Slot Created",
      description: "New time slot has been created successfully.",
    })
    setIsCreateSlotDialogOpen(false)
  }

  if (!user) return null

  return (
    <main className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Appointments</h1>
            <p className="text-muted-foreground">Schedule and manage your appointments</p>
          </div>
          <div className="flex gap-2">
            {user?.role === "lecturer" && (
              <Dialog open={isCreateSlotDialogOpen} onOpenChange={setIsCreateSlotDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Time Slot
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Time Slot</DialogTitle>
                    <DialogDescription>Add a new available time slot for students to book appointments.</DialogDescription>
                  </DialogHeader>
                  {/* Time slot creation form would go here */}
                </DialogContent>
              </Dialog>
            )}
            {user?.role === "student" && (
              <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Book New Appointment</DialogTitle>
                    <DialogDescription>Choose an available time slot and provide appointment details.</DialogDescription>
                  </DialogHeader>
                  {/* Booking form would go here */}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar and Available Slots */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar 
                mode="single" 
                selected={selectedDate} 
                onSelect={(date) => date && setSelectedDate(date)} 
                className="rounded-md border" 
              />
              
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Available Slots</h3>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {availableSlots
                      .filter((slot) => 
                        slot.startTime.toDateString() === selectedDate.toDateString()
                      )
                      .map((slot) => (
                        <div key={slot.id} className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{slot.lecturerName}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                              </p>
                            </div>
                            {user?.role === "student" && (
                              <Button size="sm" onClick={() => setIsBookingDialogOpen(true)}>
                                Book
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* Appointments List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Your Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No appointments found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{appointment.title}</h3>
                              <Badge className={getStatusColor(appointment.status)}>
                                {appointment.status}
                              </Badge>
                            </div>
                            {appointment.description && (
                              <p className="text-sm text-muted-foreground mb-3">{appointment.description}</p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{user?.role === "student" ? appointment.lecturerName : appointment.studentName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDate(appointment.startTime)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                </span>
                              </div>
                              {appointment.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{appointment.location}</span>
                                </div>
                              )}
                              {appointment.meetingLink && (
                                <div className="flex items-center gap-2">
                                  <Video className="h-4 w-4 text-muted-foreground" />
                                  <a href={appointment.meetingLink} className="text-blue-600 hover:underline">
                                    Join Meeting
                                  </a>
                                </div>
                              )}
                            </div>
                            {appointment.notes && (
                              <div className="mt-3 p-2 bg-muted rounded text-sm">
                                <p className="font-medium">Notes:</p>
                                <p>{appointment.notes}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
