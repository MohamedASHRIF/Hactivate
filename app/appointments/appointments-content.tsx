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
import { Plus, CalendarIcon, Clock, User, Video, MapPin, Edit, Trash2, Loader2, CheckCircle, XCircle, AlertCircle, Calendar as CalendarLarge, Users } from "lucide-react"
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
        return "bg-yellow-50 text-amber-700 border-amber-200 dark:bg-yellow-900/20 dark:text-amber-300 dark:border-amber-800"
      case "accepted":
        return "bg-green-50 text-emerald-700 border-emerald-200 dark:bg-green-900/20 dark:text-emerald-300 dark:border-emerald-800"
      case "rejected":
        return "bg-rose-50 text-red-700 border-red-200 dark:bg-rose-900/20 dark:text-red-300 dark:border-red-800"
      case "scheduled":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
      case "completed":
        return "bg-violet-50 text-purple-700 border-purple-200 dark:bg-violet-900/20 dark:text-purple-300 dark:border-purple-800"
      case "cancelled":
        return "bg-slate-50 text-gray-700 border-gray-200 dark:bg-slate-900/20 dark:text-gray-300 dark:border-gray-800"
      case "rescheduled":
        return "bg-amber-50 text-orange-700 border-orange-200 dark:bg-amber-900/20 dark:text-orange-300 dark:border-orange-800"
      default:
        return "bg-slate-50 text-gray-700 border-gray-200 dark:bg-slate-900/20 dark:text-gray-300 dark:border-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-3 w-3" />
      case "accepted":
      case "scheduled":
        return <CheckCircle className="h-3 w-3" />
      case "rejected":
      case "cancelled":
        return <XCircle className="h-3 w-3" />
      case "completed":
        return <CheckCircle className="h-3 w-3" />
      case "rescheduled":
        return <Clock className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
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

  // AppointmentCalendar: highlights days with appointments for both students and lecturers
  function AppointmentCalendar({ appointments, selectedDate, setSelectedDate }: AppointmentCalendarProps) {
    // Collect all appointment dates (startTime) as Date objects with time set to 00:00:00
    const appointmentDays = appointments.map(a => {
      const d = new Date(a.startTime);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    });
    const appointmentDaySet = new Set(appointmentDays.map(d => d.getTime()));

    // For lecturers, also collect all their available slot dates
    let slotDaySet = new Set<number>();
    if (user?.role === "lecturer" && Array.isArray(availableSlots)) {
      const slotDays = availableSlots
        .filter(slot => slot.lecturerId === String(user._id))
        .map(slot => {
          const d = typeof slot.startTime === "string" ? new Date(slot.startTime) : slot.startTime;
          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        });
      slotDaySet = new Set(slotDays.map(d => d.getTime()));
    }

    // Highlight days with appointments and with free slots
    const modifiers: Record<string, (day: Date) => boolean> = {
      hasAppointment: (day: Date) => appointmentDaySet.has(new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()),
    };
    if (user?.role === "lecturer") {
      modifiers.hasSlot = (day: Date) => slotDaySet.has(new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime());
    }
    const modifiersClassNames: Record<string, string> = {
      hasAppointment: 'bg-blue-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105',
      hasSlot: 'bg-green-200 text-green-900 font-semibold rounded-full border-2 border-green-400',
    };

    // Find appointments for the selected date
    const selectedDayAppointments = appointments.filter(a => {
      const d = new Date(a.startTime);
      return d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getDate() === selectedDate.getDate();
    });

    return (
      <div className="space-y-6">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={date => date && setSelectedDate(date)}
          className="rounded-xl border-0 shadow-lg bg-white dark:bg-gray-900 p-4"
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
        />
        {/* Appointment details for selected date */}
        <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <CalendarLarge className="h-5 w-5 text-blue-600" />
            {selectedDate.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>
          {selectedDayAppointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <CalendarLarge className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No appointments scheduled</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your day is free!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayAppointments.map((a, idx) => (
                <div key={idx} className="group bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{a.title}</h4>
                        <Badge className={cn("text-xs px-2 py-1 rounded-full border", getStatusColor(a.status))}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(a.status)}
                            {a.status}
                          </div>
                        </Badge>
                      </div>
                      {a.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">{a.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(a.startTime)} - {formatTime(a.endTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{user?.role === "student" ? a.lecturerName : a.studentName}</span>
                        </div>
                      </div>
                      {a.meetingLink && (
                        <div className="mt-3">
                          <a 
                            href={a.meetingLink} 
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Video className="h-4 w-4" />
                            Join Meeting
                          </a>
                        </div>
                      )}
                      {a.notes && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            <span className="font-medium">Notes:</span> {a.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Interface for AppointmentCalendar props
  interface AppointmentCalendarProps {
    appointments: Appointment[];
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
  }

  return (
    <main className="min-h-screen ">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Enhanced Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">
                Appointments
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                {user?.role === "student" ? "Schedule meetings with your lecturers" : "Manage your teaching schedule"}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'} total</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              {user?.role === "lecturer" && (
                <Dialog open={isCreateSlotDialogOpen} onOpenChange={setIsCreateSlotDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 shadow-md hover:shadow-lg">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Time Slot
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">Create New Time Slot</DialogTitle>
                      <DialogDescription className="text-gray-600 dark:text-gray-400">
                        Add a new available time slot for students to book appointments.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSlot} className="space-y-6">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</Label>
                          <Input
                            type="datetime-local"
                            value={slotForm.startTime}
                            min={(() => {
                              const d = new Date();
                              const pad = (n: number) => n.toString().padStart(2, '0');
                              return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                            })()}
                            onChange={e => setSlotForm(f => ({ ...f, startTime: e.target.value }))}
                            className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Time</Label>
                          <Input
                            type="datetime-local"
                            value={slotForm.endTime}
                            min={slotForm.startTime || undefined}
                            onChange={e => setSlotForm(f => ({ ...f, endTime: e.target.value }))}
                            className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateSlotDialogOpen(false)}
                          className="px-6"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={slotLoading}
                          className="px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          {slotLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Slot
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              
              {user?.role === "student" && (
                <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                      <Plus className="mr-2 h-4 w-4" />
                      Book Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">Book New Appointment</DialogTitle>
                      <DialogDescription className="text-gray-600 dark:text-gray-400">
                        Select a lecturer to view their free time slots and book an appointment.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lecturer</Label>
                        <Select value={bookingForm.lecturerId} onValueChange={v => setBookingForm(f => ({ ...f, lecturerId: v }))}>
                          <SelectTrigger className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Time Slots</Label>
                          <div className="mt-2 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                            {availableSlots.filter(slot => slot.lecturerId === bookingForm.lecturerId && new Date(slot.startTime) > new Date()).length === 0 ? (
                              <div className="p-6 text-center">
                                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No upcoming slots available</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">This lecturer hasn't created any time slots yet.</p>
                              </div>
                            ) : (
                              <div className="p-2">
                                {availableSlots
                                  .filter(slot => slot.lecturerId === bookingForm.lecturerId && new Date(slot.startTime) > new Date())
                                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                                  .map(slot => (
                                    <div key={slot.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(slot.startTime)}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</p>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => setBookingForm(f => ({
                                          ...f,
                                          startTime: (() => {
                                            const d = typeof slot.startTime === "string" ? new Date(slot.startTime) : slot.startTime;
                                            const pad = (n: number) => n.toString().padStart(2, '0');
                                            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                          })()
                                        }))}
                                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                                      >
                                        Select
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <form onSubmit={handleBookAppointment} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</Label>
                            <Input
                              type="datetime-local"
                              value={bookingForm.startTime}
                              min={(() => {
                                const d = new Date();
                                const pad = (n: number) => n.toString().padStart(2, '0');
                                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                              })()}
                              onChange={e => setBookingForm(f => ({ ...f, startTime: e.target.value }))}
                              className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</Label>
                            <Select
                              value={String(bookingForm.duration)}
                              onValueChange={v => setBookingForm(f => ({ ...f, duration: Number(v) }))}
                            >
                              <SelectTrigger className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</Label>
                          <Input 
                            value={bookingForm.title} 
                            onChange={e => setBookingForm(f => ({ ...f, title: e.target.value }))} 
                            className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Project Discussion, Question Session"
                            required 
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
                          <Textarea 
                            value={bookingForm.description} 
                            onChange={e => setBookingForm(f => ({ ...f, description: e.target.value }))} 
                            className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none"
                            placeholder="Please provide details about what you'd like to discuss..."
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsBookingDialogOpen(false)}
                            className="px-6"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={bookingLoading}
                            className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            {bookingLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Booking...
                              </>
                            ) : (
                              "Book Appointment"
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Enhanced Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Calendar Section */}
            <div className="xl:col-span-4">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AppointmentCalendar appointments={appointments} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                  
                  {/* Available Slots for lecturers */}
                  {user?.role === "lecturer" && (
                    <div className="mt-8 space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <Clock className="h-5 w-5 text-green-600" />
                        Available Slots
                      </h3>
                      <div className="max-h-64 overflow-y-auto">
                        <div className="space-y-3">
                          {loading ? (
                            [...Array(3)].map((_, i) => (
                              <div key={i} className="p-4 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg h-20" />
                            ))
                          ) : availableSlots
                            .filter((slot) => {
                              const slotDate = typeof slot.startTime === "string" ? new Date(slot.startTime) : slot.startTime;
                              return slotDate.toDateString() === selectedDate.toDateString() && slot.lecturerId === String(user._id);
                            })
                            .map((slot) => {
                              const slotKey = (slot as any)._id || slot.id;
                              return (
                                <div key={slotKey} className="group p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 hover:shadow-md transition-all duration-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-green-800 dark:text-green-300">{slot.lecturerName}</p>
                                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                      </p>
                                    </div>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400" 
                                      onClick={() => { setSlotToDelete(String(slotKey)); }} 
                                      disabled={slotDeleteLoading === slotKey}
                                    >
                                      {slotDeleteLoading === slotKey ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          
                          {!loading && availableSlots.filter((slot) => {
                            const slotDate = typeof slot.startTime === "string" ? new Date(slot.startTime) : slot.startTime;
                            return slotDate.toDateString() === selectedDate.toDateString() && slot.lecturerId === String(user._id);
                          }).length === 0 && (
                            <div className="text-center py-6">
                              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                              <p className="text-gray-500 dark:text-gray-400 font-medium">No slots for this day</p>
                              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create a new time slot to get started.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Appointments List */}
            <div className="xl:col-span-8">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                    <User className="h-5 w-5 text-indigo-600" />
                    Your Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[700px] overflow-y-auto">
                    {loading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
                            <div className="space-y-4">
                              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : appointments.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <CalendarIcon className="h-12 w-12 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No appointments yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                          {user?.role === "student" 
                            ? "Ready to schedule your first appointment? Click the button above to get started." 
                            : "No student appointments scheduled yet. Create some time slots to allow bookings."
                          }
                        </p>
                        {user?.role === "student" && (
                          <Button 
                            onClick={() => setIsBookingDialogOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Book Your First Appointment
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {appointments.map((appointment) => {
                          const isStudent = user?.role === "student";
                          const now = new Date();
                          const endTime = new Date(appointment.endTime);
                          let status = appointment.status;
                          if (status !== "completed" && endTime < now) {
                            status = "completed";
                          }
                          const isUpcoming = new Date(appointment.startTime) > now;
                          const canCancel = isStudent && isUpcoming && status === "pending";
                          const canDelete = ["cancelled", "rejected", "completed"].includes(status);
                          const canReschedule = user?.role === "lecturer" && status === "accepted";
                          const canStudentRespondReschedule = user?.role === "student" && status === "rescheduled";
                          
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
                            <div key={appointmentId} className="group relative p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{appointment.title}</h3>
                                      <Badge className={cn("text-xs px-3 py-1 rounded-full border shadow-sm", getStatusColor(status))}>
                                        <div className="flex items-center gap-1.5">
                                          {getStatusIcon(status)}
                                          <span className="font-medium capitalize">{status}</span>
                                        </div>
                                      </Badge>
                                    </div>
                                    {canDelete && (
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-full" 
                                        onClick={() => { setAppointmentToDelete(appointmentId); setDeleteAppointmentDialogOpen(true); }} 
                                        title="Delete appointment"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {appointment.description && (
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                      {appointment.description}
                                    </p>
                                  )}
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                      <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-full">
                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
                                          {isStudent ? "Lecturer" : "Student"}
                                        </p>
                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                          {isStudent ? appointment.lecturerName : appointment.studentName}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                      <div className="p-2 bg-green-100 dark:bg-green-800/50 rounded-full">
                                        <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                      </div>
                                      <div>
                                        <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Date</p>
                                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                          {new Date(appointment.startTime).toLocaleDateString([], { 
                                            month: 'short', 
                                            day: 'numeric',
                                            year: 'numeric'
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                      <div className="p-2 bg-purple-100 dark:bg-purple-800/50 rounded-full">
                                        <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                      </div>
                                      <div>
                                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">Time</p>
                                        <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {(appointment.location || appointment.meetingLink) && (
                                    <div className="flex flex-wrap gap-4">
                                      {appointment.location && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                                          <MapPin className="h-4 w-4 text-gray-500" />
                                          <span>{appointment.location}</span>
                                        </div>
                                      )}
                                      {appointment.meetingLink && (
                                        <a 
                                          href={appointment.meetingLink} 
                                          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                        >
                                          <Video className="h-4 w-4" />
                                          Join Meeting
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  
                                  {appointment.notes && (
                                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                      <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-1">Notes:</p>
                                      <p className="text-sm text-indigo-700 dark:text-indigo-200 leading-relaxed">{appointment.notes}</p>
                                    </div>
                                  )}
                                  
                                  {/* Action Buttons */}
                                  <div className="flex flex-wrap gap-3 pt-2">
                                    {/* Lecturer: Accept/Reject for pending appointments */}
                                    {user?.role === "lecturer" && appointment.status === "pending" && (
                                      <>
                                        <Button 
                                          size="sm" 
                                          onClick={() => handleAppointmentAction(appointment._id as string, "accept")}
                                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Accept
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => handleAppointmentAction(appointment._id as string, "reject")}
                                          className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                        >
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Reject
                                        </Button>
                                      </>
                                    )}
                                    
                                    {/* Lecturer: Reschedule for accepted appointments */}
                                    {canReschedule && (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => {
                                          setAppointmentToReschedule(appointmentId);
                                          setRescheduleDialogOpen(true);
                                          setRescheduleTime({startTime: '', duration: 30});
                                        }}
                                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                      >
                                        <Clock className="mr-2 h-4 w-4" />
                                        Reschedule
                                      </Button>
                                    )}
                                    
                                    {/* Student: Accept/Reject for rescheduled appointments */}
                                    {canStudentRespondReschedule && (
                                      <>
                                        <Button 
                                          size="sm" 
                                          onClick={() => handleStudentRescheduleResponse(appointment._id as string, 'accept')}
                                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Accept Reschedule
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => handleStudentRescheduleResponse(appointment._id as string, 'reject')}
                                          className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                        >
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Reject Reschedule
                                        </Button>
                                      </>
                                    )}
                                    
                                    {/* Student: Cancel button for upcoming appointments */}
                                    {canCancel && (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => { setAppointmentToCancel(appointment._id as string); setCancelDialogOpen(true); }}
                                        className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel Appointment
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* All Dialogs */}
        
        {/* Reschedule dialog for lecturers */}
        <Dialog open={rescheduleDialogOpen} onOpenChange={(open) => {
          setRescheduleDialogOpen(open);
          if (!open) {
            setAppointmentToReschedule(null);
            setRescheduleTime({startTime: '', duration: 30});
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Reschedule Appointment</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Select a new start time and duration for this appointment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</Label>
                <Input 
                  type="datetime-local" 
                  value={rescheduleTime.startTime} 
                  min={(() => {
                    const d = new Date();
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                  })()} 
                  onChange={e => setRescheduleTime(t => ({ ...t, startTime: e.target.value }))} 
                  className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required 
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</Label>
                <Select value={String(rescheduleTime.duration)} onValueChange={v => setRescheduleTime(t => ({ ...t, duration: Number(v) }))}>
                  <SelectTrigger className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setRescheduleDialogOpen(false)} 
                disabled={rescheduleLoading}
                className="px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRescheduleAppointment} 
                disabled={rescheduleLoading || !rescheduleTime.startTime || !rescheduleTime.duration}
                className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                {rescheduleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Reschedule
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Booking confirmation dialog for students */}
        <Dialog open={confirmBookingDialogOpen} onOpenChange={setConfirmBookingDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Confirm Booking</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Please review your appointment details before confirming.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-blue-800 dark:text-blue-300">Lecturer:</span>
                      <span className="text-blue-700 dark:text-blue-200">
                        {pendingBookingForm?.lecturerId ? lecturers.find(l => l._id === pendingBookingForm.lecturerId)?.name : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-blue-800 dark:text-blue-300">Title:</span>
                      <span className="text-blue-700 dark:text-blue-200">{pendingBookingForm?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-blue-800 dark:text-blue-300">Date:</span>
                      <span className="text-blue-700 dark:text-blue-200">
                        {pendingBookingForm?.startTime ? new Date(pendingBookingForm.startTime).toLocaleDateString([], {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        }) : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-blue-800 dark:text-blue-300">Time:</span>
                      <span className="text-blue-700 dark:text-blue-200">
                        {pendingBookingForm?.startTime ? formatTime(pendingBookingForm.startTime) : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-blue-800 dark:text-blue-300">Duration:</span>
                      <span className="text-blue-700 dark:text-blue-200">{pendingBookingForm?.duration} minutes</span>
                    </div>
                  </div>
                </div>
                {pendingBookingForm?.description && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="font-medium text-gray-800 dark:text-gray-300 mb-2">Description:</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{pendingBookingForm.description}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => { setConfirmBookingDialogOpen(false); setPendingBookingForm(null); }} 
                disabled={bookingLoading}
                className="px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmBookAppointment} 
                disabled={bookingLoading}
                className="px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Student appointment cancellation dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Cancel Appointment?</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setCancelDialogOpen(false)}
                className="px-6"
              >
                Keep Appointment
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => appointmentToCancel && handleCancelAppointment(appointmentToCancel)} 
                disabled={cancelLoading}
                className="px-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                {cancelLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Yes, Cancel
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete cancelled appointment dialog */}
        <Dialog open={deleteAppointmentDialogOpen} onOpenChange={setDeleteAppointmentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Delete Appointment?</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Are you sure you want to permanently delete this appointment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setDeleteAppointmentDialogOpen(false)} 
                disabled={deleteAppointmentLoading}
                className="px-6"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => appointmentToDelete && handleDeleteAppointment(appointmentToDelete)} 
                disabled={deleteAppointmentLoading}
                className="px-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                {deleteAppointmentLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Permanently
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete slot confirmation dialog */}
        {user?.role === "lecturer" && (
          <Dialog open={!!slotToDelete} onOpenChange={(open) => { if (!open) setSlotToDelete(null); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Delete Time Slot?</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete this time slot? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setSlotToDelete(null)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => slotToDelete && handleDeleteSlot(slotToDelete)} 
                  disabled={slotDeleteLoading === slotToDelete}
                  className="px-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {slotDeleteLoading === slotToDelete ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Slot
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </main>
  )
}