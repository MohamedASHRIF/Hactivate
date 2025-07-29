// app/layout.tsx

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/components/auth-provider"
import { NotificationProvider } from "@/components/notification-provider"
import { initMongoConnection } from "@/lib/init-mongodb"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UniConnect - University Communication Platform",
  description: "Connect students, lecturers, and administrators seamlessly",
  manifest: "/manifest.json",
  generator: "v0.dev",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await initMongoConnection()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <NotificationProvider>
              {children}
              <Toaster />
              <SonnerToaster />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
