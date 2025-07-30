
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
  // State for booking confirmation dialog
  const [confirmBookingDialogOpen, setConfirmBookingDialogOpen] = useState(false);
  const [pendingBookingForm, setPendingBookingForm] = useState<typeof bookingForm | null>(null);
  // Student cancels their own appointment
  async function handleCancelAppointment(appointmentId: string) {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Appointment cancelled", description: data.message });
        fetchAppointments();
      } else {
        toast({ title: "Error", description: data.message || "Failed to cancel appointment", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to cancel appointment", variant: "destructive" });
    } finally {
      setCancelLoading(false);
      setAppointmentToCancel(null);
      setCancelDialogOpen(false);
    }
  }
  // State for student appointment cancellation dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

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
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
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

  // Booking form submit handler: show confirmation dialog
  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingBookingForm({ ...bookingForm });
    setConfirmBookingDialogOpen(true);
  };

  // Actually perform booking after confirmation
  const confirmBookAppointment = async () => {
    if (!pendingBookingForm) return;
    setBookingLoading(true);
    try {
      // Calculate endTime from startTime and duration
      const start = new Date(pendingBookingForm.startTime);
      const end = new Date(start.getTime() + (Number(pendingBookingForm.duration) || 0) * 60000);
      const payload = {
        ...pendingBookingForm,
        endTime: end.toISOString(),
      };
      // delete payload.duration
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "Appointment Requested", description: "Your appointment request has been sent." });
        setIsBookingDialogOpen(false);
        setBookingForm({ lecturerId: "", title: "", description: "", startTime: "", duration: 30 });
        fetchAppointments();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.message || "Failed to request appointment", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to request appointment", variant: "destructive" });
    } finally {
      setBookingLoading(false);
      setConfirmBookingDialogOpen(false);
      setPendingBookingForm(null);
    }
  };

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



  // State for deleting cancelled appointments (must be before any early return)
  const [deleteAppointmentDialogOpen, setDeleteAppointmentDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [deleteAppointmentLoading, setDeleteAppointmentLoading] = useState(false);

  // State for rescheduling appointments (must be at top level)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleTime, setRescheduleTime] = useState<{startTime: string, duration: number}>({startTime: '', duration: 30});
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<string | null>(null);

  // Handler for rescheduling appointment
  const handleRescheduleAppointment = async () => {
    if (!appointmentToReschedule) return;
    // Validation: startTime in future
    const start = new Date(rescheduleTime.startTime);
    if (isNaN(start.getTime()) || start < new Date()) {
      toast({ title: "Invalid start time", description: "Please select a valid future start time.", variant: "destructive" });
      return;
    }
    setRescheduleLoading(true);
    try {
      // Calculate endTime from startTime and duration
      const end = new Date(start.getTime() + (Number(rescheduleTime.duration) || 0) * 60000);
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointmentToReschedule, action: 'reschedule', startTime: start.toISOString(), endTime: end.toISOString() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Appointment rescheduled', description: data.message });
        fetchAppointments();
        setRescheduleDialogOpen(false);
        setAppointmentToReschedule(null);
        setRescheduleTime({startTime: '', duration: 30});
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to reschedule appointment', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to reschedule appointment', variant: 'destructive' });
    } finally {
      setRescheduleLoading(false);
    }
  };

if (!user) return null

  // Handler for deleting cancelled appointments (must be inside component to access toast/fetchAppointments)
  const handleDeleteAppointment = async (appointmentIdRaw: string | { $oid: string }) => {
    setDeleteAppointmentLoading(true);
    try {
      // If appointmentId is an object (MongoDB ObjectId), extract the string value
      let appointmentId: string;
      if (typeof appointmentIdRaw === "object" && appointmentIdRaw !== null && "$oid" in appointmentIdRaw) {
        appointmentId = appointmentIdRaw.$oid;
      } else {
        appointmentId = String(appointmentIdRaw);
      }
      const res = await fetch(`/api/appointments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, hardDelete: true }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Appointment deleted", description: data.message });
        fetchAppointments();
      } else {
        toast({ title: "Error", description: data.message || "Failed to delete appointment", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete appointment", variant: "destructive" });
    } finally {
      setDeleteAppointmentLoading(false);
      setAppointmentToDelete(null);
      setDeleteAppointmentDialogOpen(false);
    }
  };

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
                    {appointments.map((appointment) => {
                      const isStudent = user?.role === "student";
                      const now = new Date();
                      const endTime = new Date(appointment.endTime);
                      // If appointment is not completed and endTime is in the past, mark as completed (frontend only)
                      let status = appointment.status;
                      if (status !== "completed" && endTime < now) {
                        status = "completed";
                      }
                      const isUpcoming = new Date(appointment.startTime) > now;
                      const canCancel = isStudent && isUpcoming && status === "pending";
                      const canDelete = ["cancelled", "rejected", "completed"].includes(status);
                      const canReschedule = user?.role === "lecturer" && status === "accepted";
                      const canStudentRespondReschedule = user?.role === "student" && status === "rescheduled";
                      // Use _id if present, else fallback to id, and always extract string if $oid
                      let appointmentId: string = "";
                      if (appointment._id) {
                        const _id: any = appointment._id;
                        if (typeof _id === "object" && _id !== null && "$oid" in _id) {
                          appointmentId = _id.$oid;
                        } else {
                          appointmentId = String(_id);
                        }
                      } else if ((appointment as any).id) {
                        appointmentId = String((appointment as any).id);
                      }
                      // Handler for student accept/reject reschedule
                      const handleStudentRescheduleResponse = async (appointmentId: string, action: 'accept' | 'reject') => {
                        try {
                          const res = await fetch('/api/appointments', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ appointmentId, action }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            toast({ title: `Appointment ${action === 'accept' ? 'Accepted' : 'Rejected'}` });
                            fetchAppointments();
                          } else {
                            toast({ title: 'Error', description: data.message || 'Failed to update appointment', variant: 'destructive' });
                          }
                        } catch (err) {
                          toast({ title: 'Error', description: 'Failed to update appointment', variant: 'destructive' });
                        }
                      };
                      return (
                        <div key={appointmentId} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{appointment.title}</h3>
                                <Badge className={getStatusColor(status)}>
                                  {status}
                                </Badge>
                              </div>
                              {appointment.description && (
                                <p className="text-sm text-muted-foreground mb-3">{appointment.description}</p>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>{isStudent ? appointment.lecturerName : appointment.studentName}</span>
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
                              {/* Lecturer: Reschedule for accepted appointments */}
                              {canReschedule && (
                                <div className="mt-3 flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => {
                                    setAppointmentToReschedule(appointmentId);
                                    setRescheduleDialogOpen(true);
                                    setRescheduleTime({startTime: '', duration: 30});
                                  }}>Reschedule</Button>
                                </div>
                              )}
                              {/* Student: Accept/Reject for rescheduled appointments */}
                              {canStudentRespondReschedule && (
                                <div className="mt-3 flex gap-2">
                                  <Button size="sm" variant="default" onClick={() => handleStudentRescheduleResponse(appointment._id as string, 'accept')}>Accept</Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleStudentRescheduleResponse(appointment._id as string, 'reject')}>Reject</Button>
                                </div>
                              )}
        {/* Reschedule dialog for lecturers */}
        <Dialog open={rescheduleDialogOpen} onOpenChange={(open) => {
          setRescheduleDialogOpen(open);
          if (!open) {
            setAppointmentToReschedule(null);
            setRescheduleTime({startTime: '', duration: 30});
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Appointment</DialogTitle>
              <DialogDescription>Select a new start time and duration for this appointment.</DialogDescription>
            </DialogHeader>
            <div className="mb-4">
              <Label>Start Time</Label>
              <Input type="datetime-local" value={rescheduleTime.startTime} min={(() => {
                const d = new Date();
                const pad = (n: number) => n.toString().padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
              })()} onChange={e => setRescheduleTime(t => ({ ...t, startTime: e.target.value }))} required />
            </div>
            <div className="mb-4">
              <Label>Duration</Label>
              <Select value={String(rescheduleTime.duration)} onValueChange={v => setRescheduleTime(t => ({ ...t, duration: Number(v) }))} required>
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
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)} disabled={rescheduleLoading}>Cancel</Button>
              <Button variant="default" onClick={handleRescheduleAppointment} disabled={rescheduleLoading || !rescheduleTime.startTime || !rescheduleTime.duration}>
                {rescheduleLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Reschedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
                              {/* Student: Cancel button for upcoming appointments */}
                              {canCancel && (
                                <div className="mt-3 flex gap-2">
                                  <Button size="sm" variant="destructive" onClick={() => { setAppointmentToCancel(appointment._id as string); setCancelDialogOpen(true); }}>
                                    Cancel Appointment
                                  </Button>
                                </div>
                              )}
                            </div>
                            {/* Delete button for cancelled appointments (right side) */}
                            {canDelete && (
                              <div className="flex items-center ml-2">
                                <Button size="icon" variant="ghost" onClick={() => { setAppointmentToDelete(appointmentId); setDeleteAppointmentDialogOpen(true); }} title="Delete appointment">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
        {/* Delete cancelled appointment dialog */}
        <Dialog open={deleteAppointmentDialogOpen} onOpenChange={setDeleteAppointmentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Cancelled Appointment?</DialogTitle>
              <DialogDescription>Are you sure you want to permanently delete this cancelled appointment? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteAppointmentDialogOpen(false)} disabled={deleteAppointmentLoading}>Cancel</Button>
              <Button variant="destructive" onClick={() => appointmentToDelete && handleDeleteAppointment(appointmentToDelete)} disabled={deleteAppointmentLoading}>
                {deleteAppointmentLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        {/* Booking confirmation dialog for students */}
        <Dialog open={confirmBookingDialogOpen} onOpenChange={setConfirmBookingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to book this appointment? Please confirm your details before proceeding.
              </DialogDescription>
            </DialogHeader>
            <div className="mb-4">
              <div><b>Lecturer:</b> {pendingBookingForm?.lecturerId ? lecturers.find(l => l._id === pendingBookingForm.lecturerId)?.name : ""}</div>
              <div><b>Title:</b> {pendingBookingForm?.title}</div>
              <div><b>Date:</b> {pendingBookingForm?.startTime ? formatDate(pendingBookingForm.startTime) : ""}</div>
              <div><b>Time:</b> {pendingBookingForm?.startTime ? formatTime(pendingBookingForm.startTime) : ""}</div>
              <div><b>Duration:</b> {pendingBookingForm?.duration} minutes</div>
              {pendingBookingForm?.description && <div><b>Description:</b> {pendingBookingForm.description}</div>}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setConfirmBookingDialogOpen(false); setPendingBookingForm(null); }} disabled={bookingLoading}>Cancel</Button>
              <Button variant="default" onClick={confirmBookAppointment} disabled={bookingLoading}>
                {bookingLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Confirm Booking"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Student appointment cancellation dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Appointment?</DialogTitle>
              <DialogDescription>Are you sure you want to cancel this appointment? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>No, keep it</Button>
              <Button variant="destructive" onClick={() => appointmentToCancel && handleCancelAppointment(appointmentToCancel)} disabled={cancelLoading}>
                {cancelLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Yes, cancel"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
