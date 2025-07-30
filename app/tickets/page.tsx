"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

import {
	Plus,
	Search,
	Filter,
	Clock,
	CheckCircle,
	AlertCircle,
	XCircle,
	MessageSquare,
	Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

interface Ticket {
	id?: string;
	_id?: string;
	title: string;
	description: string;
	category: "academic" | "technical" | "administrative" | "other";
	priority: "low" | "medium" | "high" | "urgent";
	status: "open" | "in-progress" | "resolved" | "closed";
	studentName: string;
	assignedTo?: string;
	createdAt: string;
	updatedAt: string;
	replies: TicketReply[];

}

interface TicketReply {
	id: string;
	userId: string;
	userName: string;
	message: string;
	createdAt: string;
}

interface CreateTicketData {
	title: string;
	description: string;
	category: string;
	priority: string;
}

export default function TicketsPage() {
	const { user } = useAuth();
	const { toast } = useToast();
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [replyMessage, setReplyMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		async function fetchTickets() {
			if (!user?.name) return;

			setIsLoading(true);
			try {
				const res = await fetch(`/api/tickets?userName=${encodeURIComponent(user.name)}`);
				if (!res.ok) throw new Error("Failed to fetch tickets");
				const data = await res.json();
				setTickets(Array.isArray(data) ? data : []);
			} catch (error) {
				console.error("Error fetching tickets:", error);
				toast({
					title: "Error",
					description: "Unable to load tickets",
					variant: "destructive",
				});
				setTickets([]);
			} finally {
				setIsLoading(false);
			}
		}

		fetchTickets();
	}, [user?.name, toast]);

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "open":
				return <AlertCircle className="h-4 w-4" />;
			case "in-progress":
				return <Clock className="h-4 w-4" />;
			case "resolved":
				return <CheckCircle className="h-4 w-4" />;
			case "closed":
				return <XCircle className="h-4 w-4" />;
			default:
				return <AlertCircle className="h-4 w-4" />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "open":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "in-progress":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			case "resolved":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "closed":
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "urgent":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "high":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
			case "medium":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			case "low":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	const filteredTickets = tickets.filter((ticket) => {
		const matchesSearch =
			ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
		const matchesCategory =
			categoryFilter === "all" || ticket.category === categoryFilter;
		return matchesSearch && matchesStatus && matchesCategory;
	});

	const handleCreateTicket = async (formData: CreateTicketData) => {
		if (!user?.name) return;

		try {
			const res = await fetch("/api/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...formData, studentName: user.name }),
			});

			if (!res.ok) throw new Error("Failed to create ticket");

			const newTicket = await res.json();
			setTickets([newTicket, ...tickets]);
			setIsCreateDialogOpen(false);

			toast({
				title: "Ticket created",
				description: "Your support ticket has been submitted successfully.",
			});
		} catch (error) {
			console.error("Error creating ticket:", error);
			toast({
				title: "Error",
				description: "Failed to create ticket",
				variant: "destructive",
			});
		}
	};

	const handleReply = async () => {
		if (!replyMessage.trim() || !selectedTicket || !user) return;

		try {
			// Create new reply object
			const newReply: TicketReply = {
				id: Date.now().toString(), // Add this missing id field
				userId: user._id || user.id || "",
				userName: user.name || "Unknown",
				message: replyMessage,
				createdAt: new Date().toISOString(),
			};

			// Update the selected ticket with the new reply
			const updatedTicket = {
				...selectedTicket,
				replies: [...selectedTicket.replies, newReply],
				updatedAt: new Date().toISOString(),
			};

			// Update local state
			setSelectedTicket(updatedTicket);
			setTickets(
				tickets.map((t) =>
					(t._id || t.id) === (selectedTicket._id || selectedTicket.id)
						? updatedTicket
						: t
				)
			);
			setReplyMessage("");

			toast({
				title: "Reply sent",
				description: "Your reply has been added to the ticket.",
			});

			// TODO: In production, make API call to save reply to backend
			// const res = await fetch(`/api/tickets/${selectedTicket._id}/replies`, {
			//   method: "POST",
			//   headers: { "Content-Type": "application/json" },
			//   body: JSON.stringify(newReply),
			// });
		} catch (error) {
			console.error("Error adding reply:", error);
			toast({
				title: "Error",
				description: "Failed to add reply",
				variant: "destructive",
			});
		}
	};

	if (!user) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<p className="text-muted-foreground">Please log in to view tickets.</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<Sidebar />
			<div className="md:ml-64">
				<Header />
				<main className="p-6">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h1 className="text-3xl font-bold">Support Tickets</h1>
							<p className="text-muted-foreground">
								Manage and track your support requests
							</p>
						</div>
						{user.role === "student" && (
							<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
								<DialogTrigger asChild>
									<Button>
										<Plus className="mr-2 h-4 w-4" />
										New Ticket
									</Button>
								</DialogTrigger>
								<DialogContent className="max-w-md">
									<DialogHeader>
										<DialogTitle>Create Support Ticket</DialogTitle>
										<DialogDescription>
											Describe your issue and we'll help you resolve it.
										</DialogDescription>
									</DialogHeader>
									<CreateTicketForm onSubmit={handleCreateTicket} />
								</DialogContent>
							</Dialog>
						)}
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Tickets List */}
						<div className="lg:col-span-1">
							<Card>
								<CardHeader>
									<div className="flex items-center space-x-2">
										<div className="relative flex-1">
											<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
											<Input
												placeholder="Search tickets..."
												className="pl-10"
												value={searchQuery}
												onChange={(e) => setSearchQuery(e.target.value)}
											/>
										</div>
										<Button variant="outline" size="icon">
											<Filter className="h-4 w-4" />
										</Button>
									</div>
									<div className="flex space-x-2">
										<Select value={statusFilter} onValueChange={setStatusFilter}>
											<SelectTrigger className="flex-1">
												<SelectValue placeholder="Status" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">All Status</SelectItem>
												<SelectItem value="open">Open</SelectItem>
												<SelectItem value="in-progress">In Progress</SelectItem>
												<SelectItem value="resolved">Resolved</SelectItem>
												<SelectItem value="closed">Closed</SelectItem>
											</SelectContent>
										</Select>
										<Select value={categoryFilter} onValueChange={setCategoryFilter}>
											<SelectTrigger className="flex-1">
												<SelectValue placeholder="Category" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">All Categories</SelectItem>
												<SelectItem value="academic">Academic</SelectItem>
												<SelectItem value="technical">Technical</SelectItem>
												<SelectItem value="administrative">Administrative</SelectItem>
												<SelectItem value="other">Other</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</CardHeader>
								<CardContent className="p-0">
									<ScrollArea className="h-[calc(100vh-20rem)]">
										<div className="space-y-2 p-4">
											{isLoading ? (
												<div className="flex items-center justify-center py-8">
													<p className="text-muted-foreground">Loading tickets...</p>
												</div>
											) : filteredTickets.length === 0 ? (
												<div className="flex items-center justify-center py-8">
													<p className="text-muted-foreground">No tickets found</p>
												</div>
											) : (
												filteredTickets.map((ticket) => (
													<div
														key={ticket._id || ticket.id}
														className={cn(
															"p-4 rounded-lg border cursor-pointer transition-colors",
															selectedTicket?._id === ticket._id ||
																selectedTicket?.id === ticket.id
																? "bg-primary/10 border-primary"
																: "hover:bg-muted"
														)}
														onClick={() => setSelectedTicket(ticket)}
													>
														<div className="flex items-start justify-between mb-2">
															<h3 className="font-medium text-sm truncate flex-1 pr-2">
																{ticket.title}
															</h3>
															<Badge
																variant="secondary"
																className={cn(
																	"text-xs flex items-center gap-1",
																	getStatusColor(ticket.status)
																)}
															>
																{getStatusIcon(ticket.status)}
																<span className="capitalize">
																	{ticket.status.replace("-", " ")}
																</span>
															</Badge>
														</div>
														<p
															className="text-xs text-muted-foreground mb-2 overflow-hidden text-ellipsis"
															style={{
																display: "-webkit-box",
																WebkitLineClamp: 2,
																WebkitBoxOrient: "vertical",
															}}
														>
															{ticket.description}
														</p>
														<div className="flex items-center justify-between">
															<Badge
																variant="outline"
																className={cn(
																	"text-xs",
																	getPriorityColor(ticket.priority)
																)}
															>
																{ticket.priority}
															</Badge>
															<span className="text-xs text-muted-foreground">
																{new Date(ticket.createdAt).toLocaleDateString()}
															</span>
														</div>
													</div>
												))
											)}
										</div>
									</ScrollArea>
								</CardContent>
							</Card>
						</div>

						{/* Ticket Details */}
						<div className="lg:col-span-2">
							{selectedTicket ? (
								<Card className="h-[calc(100vh-12rem)] flex flex-col">
									<CardHeader className="border-b flex-shrink-0">
										<div className="flex items-start justify-between">
											<div className="flex-1 min-w-0">
												<CardTitle className="text-xl truncate">
													{selectedTicket.title}
												</CardTitle>
												<CardDescription className="mt-2">
													Submitted by {selectedTicket.studentName} on{" "}
													{new Date(selectedTicket.createdAt).toLocaleDateString()}
												</CardDescription>
											</div>
											<div className="flex items-center space-x-2 flex-shrink-0 ml-4">
												<Badge
													variant="secondary"
													className={cn(
														"flex items-center gap-1",
														getStatusColor(selectedTicket.status)
													)}
												>
													{getStatusIcon(selectedTicket.status)}
													<span className="capitalize">
														{selectedTicket.status.replace("-", " ")}
													</span>
												</Badge>
												<Badge
													variant="outline"
													className={cn(getPriorityColor(selectedTicket.priority))}
												>
													{selectedTicket.priority}
												</Badge>
											</div>
										</div>
									</CardHeader>

									<CardContent className="flex-1 flex flex-col p-6">
										<div className="mb-6">
											<h4 className="font-semibold mb-2">Description</h4>
											<p className="text-sm text-muted-foreground whitespace-pre-wrap">
												{selectedTicket.description}
											</p>
										</div>

										<div className="flex-1 flex flex-col min-h-0">
											<h4 className="font-semibold mb-4">
												Replies ({selectedTicket.replies.length})
											</h4>

											<ScrollArea className="flex-1 mb-4">
												<div className="space-y-4">
													{selectedTicket.replies.length > 0 ? (
														selectedTicket.replies.map((reply) => (
															<div
																key={reply.id}
																className="border rounded-lg p-3 bg-muted/50"
															>
																<div className="flex items-start space-x-3">
																	<Avatar className="h-8 w-8">
																		<AvatarFallback className="text-xs">
																			{reply.userName.charAt(0).toUpperCase()}
																		</AvatarFallback>
																	</Avatar>
																	<div className="flex-1 min-w-0">
																		<div className="flex items-center justify-between mb-1">
																			<p className="text-sm font-medium">
																				{reply.userName}
																			</p>
																			<p className="text-xs text-muted-foreground">
																				{new Date(reply.createdAt).toLocaleString()}
																			</p>
																		</div>
																		<p className="text-sm whitespace-pre-wrap">
																			{reply.message}
																		</p>
																	</div>
																</div>
															</div>
														))
													) : (
														<div className="flex items-center justify-center py-8">
															<p className="text-muted-foreground">No replies yet.</p>
														</div>
													)}
												</div>
											</ScrollArea>

											<div className="flex items-end space-x-2 pt-4 border-t">
												<div className="flex-1">
													<Textarea
														placeholder="Write a reply..."
														value={replyMessage}
														onChange={(e) => setReplyMessage(e.target.value)}
														rows={3}
														className="resize-none"
													/>
												</div>
												<Button
													onClick={handleReply}
													disabled={!replyMessage.trim()}
													size="icon"
													className="h-10 w-10"
												>
													<Send className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							) : (
								<Card className="h-[calc(100vh-12rem)] flex items-center justify-center">
									<div className="text-center">
										<MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
										<p className="text-muted-foreground">
											Select a ticket to view details
										</p>
									</div>
								</Card>
							)}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}

function CreateTicketForm({ onSubmit }: { onSubmit: (data: CreateTicketData) => void }) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState("academic");
	const [priority, setPriority] = useState("low");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !description.trim() || isSubmitting) return;

		setIsSubmitting(true);
		try {
			await onSubmit({
				title: title.trim(),
				description: description.trim(),
				category,
				priority,
			});
			// Reset form
			setTitle("");
			setDescription("");
			setCategory("academic");
			setPriority("low");
		} catch (error) {
			console.error("Error submitting form:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<Label htmlFor="title">Title *</Label>
				<Input
					id="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Brief description of your issue"
					required
					disabled={isSubmitting}
				/>
			</div>

			<div>
				<Label htmlFor="description">Description *</Label>
				<Textarea
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Provide detailed information about your issue"
					required
					rows={4}
					disabled={isSubmitting}
				/>
			</div>

			<div>
				<Label htmlFor="category">Category</Label>
				<Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
					<SelectTrigger id="category">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="academic">Academic</SelectItem>
						<SelectItem value="technical">Technical</SelectItem>
						<SelectItem value="administrative">Administrative</SelectItem>
						<SelectItem value="other">Other</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div>
				<Label htmlFor="priority">Priority</Label>
				<Select value={priority} onValueChange={setPriority} disabled={isSubmitting}>
					<SelectTrigger id="priority">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="low">Low</SelectItem>
						<SelectItem value="medium">Medium</SelectItem>
						<SelectItem value="high">High</SelectItem>
						<SelectItem value="urgent">Urgent</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<Button
				type="submit"
				className="w-full"
				disabled={isSubmitting || !title.trim() || !description.trim()}
			>
				{isSubmitting ? "Creating..." : "Create Ticket"}
			</Button>
		</form>
	);
}
