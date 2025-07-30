"use client";

import { useEffect, useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Ticket {
	_id: string;
	title: string;
	description: string;
	category: string;
	priority: string;
	status: string;
	studentName: string;
	createdAt: string;
}

export default function AdminTicketView() {
	const [tickets, setTickets] = useState<Ticket[] | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchTickets = async () => {
			try {
				const res = await fetch("/api/tickets"); // All tickets (admin)
				const data = await res.json();

				if (!Array.isArray(data)) throw new Error("Tickets not an array");
				setTickets(data);
			} catch (error) {
				console.error("Error fetching tickets:", error);
				setTickets([]);
			} finally {
				setLoading(false);
			}
		};

		fetchTickets();
	}, []);

	return (
		<Card className="p-4 mt-4">
			<CardHeader>
				<CardTitle className="text-xl">Admin Ticket Dashboard</CardTitle>
			</CardHeader>
			<CardContent>
				{loading ? (
					<Skeleton className="w-full h-32 rounded-md" />
				) : tickets?.length === 0 ? (
					<p>No tickets found.</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Student</TableHead>
								<TableHead>Title</TableHead>
								<TableHead>Category</TableHead>
								<TableHead>Priority</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Created At</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{tickets?.map((ticket) => (
								<TableRow key={ticket._id}>
									<TableCell>{ticket.studentName}</TableCell>
									<TableCell>{ticket.title}</TableCell>
									<TableCell>{ticket.category}</TableCell>
									<TableCell>{ticket.priority}</TableCell>
									<TableCell>{ticket.status}</TableCell>
									<TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
