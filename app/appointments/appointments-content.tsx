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
import { Plus, CalendarIcon, Clock, User, Video, MapPin, Edit, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Appointment {
  _id?: string
  title: string
  description?: string
  lecturerName: string
  studentName: string
  lecturerId: string
  studentId: string
  startTime: string | Date
  endTime: string | Date
  status: "pending" | "accepted" | "rejected" | "scheduled" | "completed" | "cancelled" | "rescheduled"
  meetingLink?: string
  location?: string
  notes?: string
}


interface TimeSlot {
  id: string
  lecturerId: string
  lecturerName: string
  startTime: Date | string
  endTime: Date | string
  isAvailable: boolean
}


interface LecturerOption {
  _id: string
  name: string
}

export default function AppointmentsContent() {

  // State and handler for slot deletion (lecturer)
  const [slotDeleteLoading, setSlotDeleteLoading] = useState<string | null>(null)
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null)
  const handleDeleteSlot = async (slotId: string) => {
    setSlotDeleteLoading(slotId)
    try {
      const res = await fetch("/api/timeslots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Slot deleted", description: data.message })
        fetchTimeSlots()
      } else {
        toast({ title: "Error", description: data.message || "Failed to delete slot", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete slot", variant: "destructive" })
    } finally {
      setSlotDeleteLoading(null)
      setSlotToDelete(null)
    }
  }
  


  const { user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [lecturers, setLecturers] = useState<LecturerOption[]>([])
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

  // Fetch lecturers for dropdown
  const fetchLecturers = async () => {
    try {
      const res = await fetch("/api/users?role=lecturer")
      if (res.ok) {
        const data = await res.json()
        setLecturers(data)
      }
    } catch (err) {
      // ignore
    }
  }

  useEffect(() => {
    if (user) {
      fetchAppointments()
      fetchTimeSlots()
      fetchLecturers()
    }
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
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

  const formatTime = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Booking form state
  const [bookingForm, setBookingForm] = useState<{
    lecturerId: string;
    title: string;
    description: string;
    startTime: string;
    duration?: number;
    slotId?: string;
  }>({
    lecturerId: "",
    title: "",
    description: "",
    startTime: "",
    duration: 30,
    slotId: "",
  })

  // State for creating a time slot (lecturer)
  const [slotForm, setSlotForm] = useState({
    startTime: "",
    endTime: "",
  })
  const [slotLoading, setSlotLoading] = useState(false)

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setSlotLoading(true)
    try {
      // Validation: startTime in future, endTime after startTime
      const start = new Date(slotForm.startTime)
      const end = new Date(slotForm.endTime)
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start < new Date() || end <= start) {
        toast({ title: "Invalid time slot", description: "Please select a valid future start and end time.", variant: "destructive" })
        setSlotLoading(false)
        return
      }
      const res = await fetch("/api/timeslots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime: start.toISOString(), endTime: end.toISOString() }),
      })
      if (res.ok) {
        toast({ title: "Time slot created" })
        setSlotForm({ startTime: "", endTime: "" })
        setIsCreateSlotDialogOpen(false)
        fetchTimeSlots()
      } else {
        const data = await res.json()
        toast({ title: "Error", description: data.message || "Failed to create time slot", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to create time slot", variant: "destructive" })
    } finally {
      setSlotLoading(false)
    }
  }
  const [bookingLoading, setBookingLoading] = useState(false)

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingLoading(true)
    try {
      // Calculate endTime from startTime and duration
      const start = new Date(bookingForm.startTime)
      const end = new Date(start.getTime() + (Number(bookingForm.duration) || 0) * 60000)
      const payload = {
        ...bookingForm,
        endTime: end.toISOString(),
      }
      // delete payload.duration
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast({ title: "Appointment Requested", description: "Your appointment request has been sent." })
        setIsBookingDialogOpen(false)
        setBookingForm({ lecturerId: "", title: "", description: "", startTime: "", duration: 30 })
        fetchAppointments()
      } else {
        const data = await res.json()
        toast({ title: "Error", description: data.message || "Failed to request appointment", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to request appointment", variant: "destructive" })
    } finally {
      setBookingLoading(false)
    }
  }

  // Accept/reject appointment (lecturer)
  const handleAppointmentAction = async (appointmentId: string, action: "accept" | "reject") => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, action }),
      })
      if (res.ok) {
        toast({ title: `Appointment ${action === "accept" ? "Accepted" : "Rejected"}` })
        fetchAppointments()
      } else {
        const data = await res.json()
        toast({ title: "Error", description: data.message || "Failed to update appointment", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update appointment", variant: "destructive" })
    }
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
                  <form onSubmit={handleCreateSlot} className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label>Start Time</Label>
                        <Input
                          type="datetime-local"
                          value={slotForm.startTime}
                          min={(() => {
                            const d = new Date();
                            const pad = (n: number) => n.toString().padStart(2, '0');
                            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                          })()}
                          onChange={e => setSlotForm(f => ({ ...f, startTime: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <Label>End Time</Label>
                        <Input
                          type="datetime-local"
                          value={slotForm.endTime}
                          min={slotForm.startTime || undefined}
                          onChange={e => setSlotForm(f => ({ ...f, endTime: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={slotLoading}>{slotLoading ? "Creating..." : "Create Slot"}</Button>
                    </div>
                  </form>
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
                    <DialogDescription>Select a lecturer to view their free time slots and book an appointment.</DialogDescription>
                  </DialogHeader>
                  <div className="mb-4">
                    <Label>Lecturer</Label>
                    <Select value={bookingForm.lecturerId} onValueChange={v => setBookingForm(f => ({ ...f, lecturerId: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Lecturer" />
                      </SelectTrigger>
                      <SelectContent>
                        {lecturers.map(l => (
                          <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {bookingForm.lecturerId && (
                    <div className="mb-4">
                      <Label>Available Time Slots</Label>
                      <ScrollArea className="h-40 border rounded p-2 mt-2">
                        {availableSlots.filter(slot => slot.lecturerId === bookingForm.lecturerId && new Date(slot.startTime) > new Date()).length === 0 ? (
                          <div className="text-muted-foreground text-sm">No upcoming slots for this lecturer.</div>
                        ) : (
                          availableSlots
                            .filter(slot => slot.lecturerId === bookingForm.lecturerId && new Date(slot.startTime) > new Date())
                            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                            .map(slot => (
                              <div key={slot.id} className="flex items-center justify-between border-b py-2 last:border-b-0">
                                <div>
                                  <span className="font-medium">{formatDate(slot.startTime)}</span>
                                  <span className="ml-2 text-muted-foreground">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setBookingForm(f => ({
                                  ...f,
                                  startTime: (() => {
                                    const d = typeof slot.startTime === "string" ? new Date(slot.startTime) : slot.startTime;
                                    // Format to yyyy-MM-ddTHH:mm in local time
                                    const pad = (n: number) => n.toString().padStart(2, '0');
                                    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                  })()
                                }))}>
                                  Select
                                </Button>
                              </div>
                            ))
                        )}
                      </ScrollArea>
                    </div>
                  )}
                  <form onSubmit={handleBookAppointment} className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label>Start Time</Label>
                        <Input
                          type="datetime-local"
                          value={bookingForm.startTime}
                          min={(() => {
                            const d = new Date();
                            const pad = (n: number) => n.toString().padStart(2, '0');
                            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                          })()}
                          onChange={e => setBookingForm(f => ({ ...f, startTime: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Duration</Label>
                        <Select
                          value={String(bookingForm.duration)}
                          onValueChange={v => setBookingForm(f => ({ ...f, duration: Number(v) }))}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(8)].map((_, i) => {
                              const min = (i + 1) * 15;
                              return (
                                <SelectItem key={min} value={String(min)}>{min} minutes</SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input value={bookingForm.title} onChange={e => setBookingForm(f => ({ ...f, title: e.target.value }))} required />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={bookingForm.description} onChange={e => setBookingForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={bookingLoading}>{bookingLoading ? "Booking..." : "Book Appointment"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar and Available Slots (Lecturer only) */}
          {user?.role === "lecturer" && (
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
                      {loading ? (
                        [...Array(3)].map((_, i) => (
                          <div key={i} className="p-3 border rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse h-16" />
                        ))
                      ) : availableSlots
                        .filter((slot) => {
                          const slotDate = typeof slot.startTime === "string" ? new Date(slot.startTime) : slot.startTime;
                          return slotDate.toDateString() === selectedDate.toDateString() && slot.lecturerId === String(user._id);
                        })
                        .map((slot) => {
                          // Use slot._id if present, else fallback to slot.id
                          const slotKey = (slot as any)._id || slot.id;
                          return (
                            <div key={slotKey} className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/10 flex items-center justify-between">
                              <div>
                                <p className="font-medium">{slot.lecturerName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                </p>
                              </div>
                              <Button size="icon" variant="ghost" className="ml-2" onClick={() => { console.log('Delete slot clicked:', slotKey); setSlotToDelete(String(slotKey)); }} disabled={slotDeleteLoading === slotKey}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}

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
                      <div key={appointment._id} className="p-4 border rounded-lg">
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
                            {/* Lecturer: Accept/Reject for pending appointments */}
                            {user?.role === "lecturer" && appointment.status === "pending" && (
                              <div className="mt-3 flex gap-2">
                                <Button size="sm" variant="default" onClick={() => handleAppointmentAction(appointment._id as string, "accept")}>Accept</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleAppointmentAction(appointment._id as string, "reject")}>Reject</Button>
                              </div>
                            )}
                          </div>
                          {/* Optionally, edit/delete buttons for future use */}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        {/* Delete confirmation dialog rendered at the top level */}
        {user?.role === "lecturer" && (
          <Dialog open={!!slotToDelete} onOpenChange={(open) => { if (!open) setSlotToDelete(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Slot?</DialogTitle>
                <DialogDescription>Are you sure you want to delete this slot? This action cannot be undone.</DialogDescription>
              </DialogHeader>
              <div className="text-xs text-muted-foreground mb-2">slotToDelete: {slotToDelete || "(none)"}</div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setSlotToDelete(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => slotToDelete && handleDeleteSlot(slotToDelete)} disabled={slotDeleteLoading === slotToDelete}>
                  {slotDeleteLoading === slotToDelete ? <Loader2 className="animate-spin w-4 h-4" /> : "Delete"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </main>
  )
}
