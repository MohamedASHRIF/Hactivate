"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
	Search,
	Filter,
	Clock,
	CheckCircle,
	AlertCircle,
	XCircle,
	MessageSquare,
	Send,
	User,
	Calendar,
	Tag,
	AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function AdminTicketView() {
	const { user } = useAuth();
	const { toast } = useToast();
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [priorityFilter, setPriorityFilter] = useState("all");
	const [replyMessage, setReplyMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		async function fetchAllTickets() {
			setIsLoading(true);
			try {
				const res = await fetch("/api/tickets"); // Fetch all tickets for admin
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

		fetchAllTickets();
	}, [toast]);

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
			ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			ticket.studentName.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
		const matchesCategory =
			categoryFilter === "all" || ticket.category === categoryFilter;
		const matchesPriority =
			priorityFilter === "all" || ticket.priority === priorityFilter;
		return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
	});

	const handleStatusChange = async (ticketId: string, newStatus: string) => {
		try {
			const res = await fetch(`/api/tickets/${ticketId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});

			if (!res.ok) throw new Error("Failed to update status");

			const updatedTicket = await res.json();
			setTickets(tickets.map((t) => ((t._id || t.id) === ticketId ? updatedTicket : t)));

			if (selectedTicket && (selectedTicket._id || selectedTicket.id) === ticketId) {
				setSelectedTicket(updatedTicket);
			}

			toast({
				title: "Status updated",
				description: `Ticket status changed to ${newStatus.replace("-", " ")}`,
			});
		} catch (error) {
			console.error("Error updating status:", error);
			toast({
				title: "Error",
				description: "Failed to update ticket status",
				variant: "destructive",
			});
		}
	};

	const handleReply = async () => {
		if (!replyMessage.trim() || !selectedTicket || !user) return;
		try {
			const newReply: TicketReply = {
				id: Date.now().toString(),
				userId: user._id || "",
				userName: user.name || "Admin",
				message: replyMessage,
				createdAt: new Date().toISOString(),
			};

			const updatedTicket = {
				...selectedTicket,
				replies: [...selectedTicket.replies, newReply],
				updatedAt: new Date().toISOString(),
			};

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
		} catch (error) {
			console.error("Error adding reply:", error);
			toast({
				title: "Error",
				description: "Failed to add reply",
				variant: "destructive",
			});
		}
	};

	const getTicketStats = () => {
		const stats = {
			total: tickets.length,
			open: tickets.filter((t) => t.status === "open").length,
			inProgress: tickets.filter((t) => t.status === "in-progress").length,
			resolved: tickets.filter((t) => t.status === "resolved").length,
			urgent: tickets.filter((t) => t.priority === "urgent").length,
		};
		return stats;
	};

	const stats = getTicketStats();

	if (!user) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<p className="text-muted-foreground">Please log in to view tickets.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Admin Ticket Dashboard</h1>
					<p className="text-muted-foreground">
						Manage and respond to all support tickets
					</p>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<MessageSquare className="h-4 w-4 text-muted-foreground" />
							<div>
								<p className="text-sm font-medium">Total</p>
								<p className="text-2xl font-bold">{stats.total}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<AlertCircle className="h-4 w-4 text-red-500" />
							<div>
								<p className="text-sm font-medium">Open</p>
								<p className="text-2xl font-bold">{stats.open}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<Clock className="h-4 w-4 text-yellow-500" />
							<div>
								<p className="text-sm font-medium">In Progress</p>
								<p className="text-2xl font-bold">{stats.inProgress}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<CheckCircle className="h-4 w-4 text-green-500" />
							<div>
								<p className="text-sm font-medium">Resolved</p>
								<p className="text-2xl font-bold">{stats.resolved}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<AlertTriangle className="h-4 w-4 text-red-500" />
							<div>
								<p className="text-sm font-medium">Urgent</p>
								<p className="text-2xl font-bold">{stats.urgent}</p>
							</div>
						</div>
					</CardContent>
				</Card>
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
										placeholder="Search tickets or students..."
										className="pl-10"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
									/>
								</div>
								<Button variant="outline" size="icon">
									<Filter className="h-4 w-4" />
								</Button>
							</div>
							<div className="grid grid-cols-1 gap-2">
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger>
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
								<div className="flex space-x-2">
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
									<Select value={priorityFilter} onValueChange={setPriorityFilter}>
										<SelectTrigger className="flex-1">
											<SelectValue placeholder="Priority" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Priorities</SelectItem>
											<SelectItem value="urgent">Urgent</SelectItem>
											<SelectItem value="high">High</SelectItem>
											<SelectItem value="medium">Medium</SelectItem>
											<SelectItem value="low">Low</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<ScrollArea className="h-[calc(100vh-25rem)]">
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
												<div className="flex items-center space-x-2 mb-2">
													<User className="h-3 w-3 text-muted-foreground" />
													<span className="text-xs text-muted-foreground">
														{ticket.studentName}
													</span>
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
													<div className="flex items-center space-x-2">
														<Badge
															variant="outline"
															className={cn("text-xs", getPriorityColor(ticket.priority))}
														>
															{ticket.priority}
														</Badge>
														<Badge variant="outline" className="text-xs">
															<Tag className="h-3 w-3 mr-1" />
															{ticket.category}
														</Badge>
													</div>
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
						<Card className="h-[calc(100vh-17rem)] flex flex-col">
							<CardHeader className="border-b flex-shrink-0">
								<div className="flex items-start justify-between">
									<div className="flex-1 min-w-0">
										<CardTitle className="text-xl truncate">
											{selectedTicket.title}
										</CardTitle>
										<CardDescription className="mt-2 flex items-center space-x-4">
											<span className="flex items-center space-x-1">
												<User className="h-4 w-4" />
												<span>{selectedTicket.studentName}</span>
											</span>
											<span className="flex items-center space-x-1">
												<Calendar className="h-4 w-4" />
												<span>
													{new Date(selectedTicket.createdAt).toLocaleDateString()}
												</span>
											</span>
										</CardDescription>
									</div>
									<div className="flex items-center space-x-2 flex-shrink-0 ml-4">
										<Select
											value={selectedTicket.status}
											onValueChange={(value) =>
												handleStatusChange(
													selectedTicket._id || selectedTicket.id || "",
													value
												)
											}
										>
											<SelectTrigger className="w-32">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="open">Open</SelectItem>
												<SelectItem value="in-progress">In Progress</SelectItem>
												<SelectItem value="resolved">Resolved</SelectItem>
												<SelectItem value="closed">Closed</SelectItem>
											</SelectContent>
										</Select>
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
																	<p className="text-sm font-medium">{reply.userName}</p>
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
						<Card className="h-[calc(100vh-17rem)] flex items-center justify-center">
							<div className="text-center">
								<MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<p className="text-muted-foreground">
									Select a ticket to view details and respond
								</p>
							</div>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
