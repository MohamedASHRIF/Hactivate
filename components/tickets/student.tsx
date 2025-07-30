"use client";

import { useEffect, useState } from "react";
import {
	TextField,
	Button,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@mui/material";

interface Ticket {
	_id: string;
	title: string;
	description: string;
	status: string;
}

export default function UserView() {
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	useEffect(() => {
		fetch("/api/tickets/my")
			.then((res) => res.json())
			.then((data) => setTickets(data));
	}, []);

	const handleSubmit = async () => {
		const res = await fetch("/api/tickets", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title, description }),
		});

		const newTicket = await res.json();
		setTickets((prev) => [...prev, newTicket]);
		setTitle("");
		setDescription("");
	};

	return (
		<Paper className="p-6 space-y-6">
			<Typography variant="h5">Submit a Ticket</Typography>
			<TextField
				fullWidth
				label="Title"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
			/>
			<TextField
				fullWidth
				multiline
				rows={4}
				label="Description"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
			/>
			<Button variant="contained" onClick={handleSubmit}>
				Submit
			</Button>

			<Typography variant="h6" className="pt-6">
				Your Tickets
			</Typography>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell>Title</TableCell>
						<TableCell>Description</TableCell>
						<TableCell>Status</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{tickets.map((ticket) => (
						<TableRow key={ticket._id}>
							<TableCell>{ticket.title}</TableCell>
							<TableCell>{ticket.description}</TableCell>
							<TableCell>{ticket.status}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</Paper>
	);
}
