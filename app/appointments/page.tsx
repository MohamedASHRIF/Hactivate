"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
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

export default function AppointmentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [isCreateSlotDialogOpen, setIsCreateSlotDialogOpen] = useState(false)

  // Mock appointments data
  const mockAppointments: Appointment[] = [
    {
      id: "1",
      title: "Assignment Discussion",
      description: "Discuss progress on final project",
      lecturerName: "Dr. Jane Smith",
      studentName: "John Student",
      startTime: new Date(2024, 0, 20, 14, 0),
      endTime: new Date(2024, 0, 20, 15, 0),
      status: "scheduled",
      meetingLink: "https://meet.google.com/abc-def-ghi",
      location: "Room 201",
    },
    {
      id: "2",
      title: "Thesis Guidance",
      description: "Review thesis outline and methodology",
      lecturerName: "Prof. Robert Davis",
      studentName: "Jane Doe",
      startTime: new Date(2024, 0, 22, 10, 30),
      endTime: new Date(2024, 0, 22, 11, 30),
      status: "scheduled",
      location: "Office 305",
    },
    {
      id: "3",
      title: "Career Counseling",
      description: "Discuss career opportunities in tech",
      lecturerName: "Dr. Sarah Wilson",
      studentName: "Mike Johnson",
      startTime: new Date(2024, 0, 18, 16, 0),
      endTime: new Date(2024, 0, 18, 17, 0),
      status: "completed",
      notes: "Provided industry contacts and internship opportunities",
    },
  ]

  // Mock available slots
  const mockSlots: TimeSlot[] = [
    {
      id: "1",
      lecturerId: "1",
      lecturerName: "Dr. Jane Smith",
      startTime: new Date(2024, 0, 25, 9, 0),
      endTime: new Date(2024, 0, 25, 10, 0),
      isAvailable: true,
    },
    {
      id: "2",
      lecturerId: "1",
      lecturerName: "Dr. Jane Smith",
      startTime: new Date(2024, 0, 25, 14, 0),
      endTime: new Date(2024, 0, 25, 15, 0),
      isAvailable: true,
    },
    {
      id: "3",
      lecturerId: "2",
      lecturerName: "Prof. Robert Davis",
      startTime: new Date(2024, 0, 26, 11, 0),
      endTime: new Date(2024, 0, 26, 12, 0),
      isAvailable: true,
    },
  ]

  useEffect(() => {
    setAppointments(mockAppointments)
    setAvailableSlots(mockSlots)
  }, [])

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
    const slot = availableSlots.find((s) => s.id === slotId)
    if (!slot) return

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      lecturerName: slot.lecturerName,
      studentName: user?.name || "Unknown",
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: "scheduled",
      meetingLink: formData.meetingType === "online" ? "https://meet.google.com/generated-link" : undefined,
      location: formData.meetingType === "in-person" ? formData.location : undefined,
    }

    setAppointments([...appointments, newAppointment])
    setAvailableSlots(availableSlots.filter((s) => s.id !== slotId))
    setIsBookingDialogOpen(false)

    toast({
      title: "Appointment booked",
      description: `Your appointment with ${slot.lecturerName} has been scheduled.`,
    })
  }

  const handleCreateTimeSlot = (formData: any) => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      lecturerId: user?._id || "",
      lecturerName: user?.name || "Unknown",
      startTime: new Date(formData.date + "T" + formData.startTime),
      endTime: new Date(formData.date + "T" + formData.endTime),
      isAvailable: true,
    }

    setAvailableSlots([...availableSlots, newSlot])
    setIsCreateSlotDialogOpen(false)

    toast({
      title: "Time slot created",
      description: "Your available time slot has been added.",
    })
  }

  const upcomingAppointments = appointments.filter((apt) => apt.status === "scheduled" && apt.startTime > new Date())

  const todayAppointments = appointments.filter((apt) => {
    const today = new Date()
    const aptDate = apt.startTime
    return aptDate.toDateString() === today.toDateString()
  })

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Appointments</h1>
              <p className="text-muted-foreground">
                {user.role === "student"
                  ? "Book and manage your appointments with lecturers"
                  : "Manage your availability and student appointments"}
              </p>
            </div>
            <div className="flex space-x-2">
              {user.role === "student" && (
                <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Book Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Book an Appointment</DialogTitle>
                      <DialogDescription>Choose an available time slot with a lecturer</DialogDescription>
                    </DialogHeader>
                    <BookAppointmentForm availableSlots={availableSlots} onSubmit={handleBookAppointment} />
                  </DialogContent>
                </Dialog>
              )}
              {user.role === "lecturer" && (
                <Dialog open={isCreateSlotDialogOpen} onOpenChange={setIsCreateSlotDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Time Slot
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Time Slot</DialogTitle>
                      <DialogDescription>Add an available time slot for student appointments</DialogDescription>
                    </DialogHeader>
                    <CreateTimeSlotForm onSubmit={handleCreateTimeSlot} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Appointments List */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>
                  {selectedDate.toDateString() === new Date().toDateString()
                    ? "Today's Appointments"
                    : `Appointments for ${formatDate(selectedDate)}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {appointments
                      .filter((apt) => apt.startTime.toDateString() === selectedDate.toDateString())
                      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                      .map((appointment) => (
                        <div key={appointment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{appointment.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {user.role === "student"
                                  ? `with ${appointment.lecturerName}`
                                  : `with ${appointment.studentName}`}
                              </p>
                            </div>
                            <Badge className={cn(getStatusColor(appointment.status))}>{appointment.status}</Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                              </span>
                            </div>
                            {appointment.location && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{appointment.location}</span>
                              </div>
                            )}
                            {appointment.meetingLink && (
                              <div className="flex items-center space-x-2">
                                <Video className="h-4 w-4 text-muted-foreground" />
                                <a
                                  href={appointment.meetingLink}
                                  className="text-sm text-primary hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Join Meeting
                                </a>
                              </div>
                            )}
                          </div>

                          {appointment.description && (
                            <p className="text-sm text-muted-foreground mb-3">{appointment.description}</p>
                          )}

                          {appointment.notes && (
                            <div className="bg-muted/50 rounded p-3 mb-3">
                              <p className="text-sm">
                                <strong>Notes:</strong> {appointment.notes}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {(user.role === "student" ? appointment.lecturerName : appointment.studentName)
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">
                                {user.role === "student" ? appointment.lecturerName : appointment.studentName}
                              </span>
                            </div>
                            {appointment.status === "scheduled" && (
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-3 w-3 mr-1" />
                                  Reschedule
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                    {appointments.filter((apt) => apt.startTime.toDateString() === selectedDate.toDateString())
                      .length === 0 && (
                      <div className="text-center py-12">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No appointments</h3>
                        <p className="text-muted-foreground">No appointments scheduled for this date.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayAppointments.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {user.role === "lecturer" ? "Available Slots" : "Available Bookings"}
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{availableSlots.length}</div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

function BookAppointmentForm({
  availableSlots,
  onSubmit,
}: {
  availableSlots: TimeSlot[]
  onSubmit: (slotId: string, data: any) => void
}) {
  const [selectedSlot, setSelectedSlot] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    meetingType: "in-person",
    location: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return
    onSubmit(selectedSlot, formData)
    setFormData({ title: "", description: "", meetingType: "in-person", location: "" })
    setSelectedSlot("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Available Time Slots</Label>
        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
          {availableSlots.map((slot) => (
            <div
              key={slot.id}
              className={cn(
                "p-3 border rounded-lg cursor-pointer transition-colors",
                selectedSlot === slot.id ? "border-primary bg-primary/10" : "hover:bg-muted",
              )}
              onClick={() => setSelectedSlot(slot.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{slot.lecturerName}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(slot.startTime)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Appointment Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Assignment Discussion"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of what you'd like to discuss"
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Meeting Type</Label>
        <Select
          value={formData.meetingType}
          onValueChange={(value) => setFormData({ ...formData, meetingType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in-person">In Person</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.meetingType === "in-person" && (
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Room 201, Office 305"
          />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={!selectedSlot}>
        Book Appointment
      </Button>
    </form>
  )
}

function CreateTimeSlotForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ date: "", startTime: "", endTime: "" })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          min={new Date().toISOString().split("T")[0]}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Create Time Slot
      </Button>
    </form>
  )
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDate(date: Date) {
  return date.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
