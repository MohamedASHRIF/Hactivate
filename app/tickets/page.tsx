"use client";

import { useAuth } from "@/components/auth-provider";
import AdminView from "@/components/tickets/admin";
import UserView from "@/components/tickets/student";

export default function TicketPage() {
	const { user } = useAuth();

	if (!user) {
		return <div>Loading...</div>;
	}

	if (user.role === "admin") {
		return <AdminView />;
	}

	return <UserView />;
}
