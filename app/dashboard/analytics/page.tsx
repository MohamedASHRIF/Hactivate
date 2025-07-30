"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface AnalyticsData {
  totalUsers: number
  totalTickets: number
  openTickets: number
  closedTickets: number
  totalAnnouncements: number
  totalAppointments: number
  lastUpdated: string
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics")
      if (res.ok) {
        setData(await res.json())
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    }
  }

  const refreshAnalytics = async () => {
    setRefreshing(true)
    try {
      // Trigger recalculation of analytics
      const res = await fetch("/api/analytics", { method: "POST" })
      if (res.ok) {
        const newData = await res.json()
        setData(newData)
      }
    } catch (error) {
      console.error("Failed to refresh analytics:", error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    async function loadAnalytics() {
      await fetchAnalytics()
      setLoading(false)
    }
    loadAnalytics()
  }, [])

  if (!user) return null
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 md:ml-64 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-muted rounded-lg"></div>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-96 bg-muted rounded-lg"></div>
                  <div className="h-96 bg-muted rounded-lg"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }
  
  if (!data) return <div className="p-8 text-red-500">Failed to load analytics.</div>

  // Chart data configurations
  const barChartData = {
    labels: ['Users', 'Tickets', 'Announcements', 'Appointments'],
    datasets: [
      {
        label: 'Platform Statistics',
        data: [data.totalUsers, data.totalTickets, data.totalAnnouncements, data.totalAppointments],
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(249, 115, 22, 0.5)',
          'rgba(139, 92, 246, 0.5)',
          'rgba(34, 197, 94, 0.5)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(249, 115, 22)',
          'rgb(139, 92, 246)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const doughnutChartData = {
    labels: ['Open Tickets', 'Closed Tickets'],
    datasets: [
      {
        data: [data.openTickets, data.closedTickets],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',
          'rgba(156, 163, 175, 0.7)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(156, 163, 175)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: false,
      },
    },
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
                <p className="text-muted-foreground mt-2">Monitor platform performance and user engagement</p>
              </div>
              <Button 
                onClick={refreshAnalytics} 
                disabled={refreshing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                  <div className="h-4 w-4 text-blue-600">👥</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{data.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">Active platform users</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
                  <div className="h-4 w-4 text-orange-600">🎫</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{data.totalTickets}</div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span className="text-green-600">Open: {data.openTickets}</span>
                    <span className="text-gray-500">Closed: {data.closedTickets}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Announcements</CardTitle>
                  <div className="h-4 w-4 text-purple-600">📢</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{data.totalAnnouncements}</div>
                  <p className="text-xs text-muted-foreground mt-1">Published announcements</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Appointments</CardTitle>
                  <div className="h-4 w-4 text-green-600">📅</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{data.totalAppointments}</div>
                  <p className="text-xs text-muted-foreground mt-1">Scheduled appointments</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Platform Overview</CardTitle>
                  <p className="text-sm text-muted-foreground">Distribution of platform components</p>
                </CardHeader>
                <CardContent>
                  <div className="h-80 relative">
                    {refreshing && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                    <Bar data={barChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Ticket Status</CardTitle>
                  <p className="text-sm text-muted-foreground">Open vs Closed tickets distribution</p>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center relative">
                    {refreshing && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                    <Doughnut data={doughnutChartData} options={doughnutOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">System Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <span className="text-sm text-muted-foreground">Last Updated:</span>
                      <span className="text-sm font-medium text-foreground">{data.lastUpdated}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <span className="text-sm text-muted-foreground">Ticket Resolution Rate:</span>
                      <span className="text-sm font-medium text-foreground">
                        {data.totalTickets > 0 ? Math.round((data.closedTickets / data.totalTickets) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <span className="text-sm text-muted-foreground">Average per User:</span>
                      <span className="text-sm font-medium text-foreground">
                        {data.totalUsers > 0 ? Math.round((data.totalTickets + data.totalAppointments) / data.totalUsers * 100) / 100 : 0} items
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 