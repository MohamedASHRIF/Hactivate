// app/layout.tsx

import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth-provider";
import { NotificationProvider } from "@/components/notification-provider";
import { initMongoConnection } from "@/lib/init-mongodb";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "UniConnect - University Communication Platform",
	description: "Connect students, lecturers, and administrators seamlessly",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	await initMongoConnection(); // ✅ Call it here safely (because this function is async)

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
						</NotificationProvider>
					</AuthProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
