// models/Ticket.ts
import mongoose, { Schema, model, models } from "mongoose";

const ReplySchema = new Schema({
	userId: String,
	userName: String,
	message: String,
	createdAt: { type: Date, default: Date.now },
});

const TicketSchema = new Schema({
	title: String,
	description: String,
	category: String,
	priority: String,
	status: { type: String, default: "open" },
	studentName: String,
	assignedTo: String,
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
	replies: [ReplySchema],
});

// Prevent model overwrite upon hot reloads in dev
const Ticket = models.Ticket || model("Ticket", TicketSchema);
export default Ticket;
