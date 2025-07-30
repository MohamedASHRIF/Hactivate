// app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import mongoose from "mongoose";
import Ticket from "@/lib/models/Ticket";

async function dbConnect() {
	await clientPromise; // already connected via MongoClient
	if (mongoose.connection.readyState >= 1) return;

	return mongoose.connect(`${process.env.MONGODB_URI}/uniconnect`);
}

export async function GET(request: NextRequest) {
	await dbConnect();
	const url = new URL(request.url);
	const userName = url.searchParams.get("userName");

	// If userName is provided, return only that user's tickets
	if (userName) {
		const userTickets = await Ticket.find({ studentName: userName }).lean();
		return NextResponse.json(userTickets);
	}

	// Else return all tickets (admin access)
	const allTickets = await Ticket.find().lean();
	return NextResponse.json(allTickets);
}

export async function POST(request: NextRequest) {
	await dbConnect();
	const data = await request.json();

	if (
		!data.title ||
		!data.description ||
		!data.category ||
		!data.priority ||
		!data.studentName
	) {
		return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
	}

	const newTicket = await Ticket.create({
		title: data.title,
		description: data.description,
		category: data.category,
		priority: data.priority,
		status: "open",
		studentName: data.studentName,
		createdAt: new Date(),
		updatedAt: new Date(),
		replies: [],
	});

	return NextResponse.json(newTicket, { status: 201 });
}

// PATCH: Update ticket (admin only, assign/escalate)
export async function PATCH(request: NextRequest) {
	try {
		const token = request.cookies.get("token")?.value;
		if (!token) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}
		const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
		if (decoded.role !== "admin") {
			return NextResponse.json({ message: "Forbidden" }, { status: 403 });
		}
		const { ticketId, ...updateFields } = await request.json();
		if (!ticketId) {
			return NextResponse.json({ message: "Ticket ID is required" }, { status: 400 });
		}
		updateFields.updatedAt = new Date();
		const db = await getDatabase();
		const result = await db
			.collection("tickets")
			.updateOne({ _id: new ObjectId(ticketId) }, { $set: updateFields });
		if (result.matchedCount === 0) {
			return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
		}
		return NextResponse.json({ message: "Ticket updated successfully" });
	} catch (error) {
		console.error("Update ticket error:", error);
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}

// DELETE: Delete ticket (admin only)
export async function DELETE(request: NextRequest) {
	try {
		const token = request.cookies.get("token")?.value;
		if (!token) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}
		const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
		if (decoded.role !== "admin") {
			return NextResponse.json({ message: "Forbidden" }, { status: 403 });
		}
		const { ticketId } = await request.json();
		if (!ticketId) {
			return NextResponse.json({ message: "Ticket ID is required" }, { status: 400 });
		}
		const db = await getDatabase();
		const result = await db
			.collection("tickets")
			.deleteOne({ _id: new ObjectId(ticketId) });
		if (result.deletedCount === 0) {
			return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
		}
		return NextResponse.json({ message: "Ticket deleted successfully" });
	} catch (error) {
		console.error("Delete ticket error:", error);
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}
