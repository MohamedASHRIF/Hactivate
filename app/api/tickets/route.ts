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
	if (!userName) return NextResponse.json({ error: "Missing userName" }, { status: 400 });

	const tickets = await Ticket.find({ studentName: userName }).lean();
	return NextResponse.json(tickets);
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
