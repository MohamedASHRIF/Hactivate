import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

// GET: Get specific ticket
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const token = request.cookies.get("token")?.value;
		if (!token) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
		const db = await getDatabase();

		const ticket = await db
			.collection("tickets")
			.findOne({ _id: new ObjectId(params.id) });

		if (!ticket) {
			return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
		}

		// Check permissions
		if (decoded.role === "student" && ticket.studentId.toString() !== decoded.userId) {
			return NextResponse.json({ message: "Forbidden" }, { status: 403 });
		}

		// Populate user names
		const student = await db.collection("users").findOne({ _id: ticket.studentId });
		const assignedUser = ticket.assignedTo
			? await db.collection("users").findOne({ _id: ticket.assignedTo })
			: null;

		const ticketWithUsers = {
			...ticket,
			studentName: student?.fullName || "Unknown",
			assignedToName: assignedUser?.fullName || null,
		};

		return NextResponse.json(ticketWithUsers);
	} catch (error) {
		console.error("Get ticket error:", error);
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}

// PATCH: Update specific ticket
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const token = request.cookies.get("token")?.value;
		if (!token) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
		const updateFields = await request.json();

		// Add timestamp
		updateFields.updatedAt = new Date();

		const db = await getDatabase();

		// Check if ticket exists
		const existingTicket = await db
			.collection("tickets")
			.findOne({ _id: new ObjectId(params.id) });

		if (!existingTicket) {
			return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
		}

		// Permission check - admin can update any ticket, students can only update their own
		if (
			decoded.role === "student" &&
			existingTicket.studentId.toString() !== decoded.userId
		) {
			return NextResponse.json({ message: "Forbidden" }, { status: 403 });
		}

		// Update the ticket
		const result = await db
			.collection("tickets")
			.updateOne({ _id: new ObjectId(params.id) }, { $set: updateFields });

		if (result.matchedCount === 0) {
			return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
		}

		// Get the updated ticket with user names
		const updatedTicket = await db
			.collection("tickets")
			.findOne({ _id: new ObjectId(params.id) });

		if (!updatedTicket) {
			return NextResponse.json(
				{ message: "Failed to retrieve updated ticket" },
				{ status: 500 }
			);
		}

		const student = await db
			.collection("users")
			.findOne({ _id: updatedTicket.studentId });
		const assignedUser = updatedTicket.assignedTo
			? await db.collection("users").findOne({ _id: updatedTicket.assignedTo })
			: null;

		const ticketWithUsers = {
			...updatedTicket,
			studentName: student?.fullName || "Unknown",
			assignedToName: assignedUser?.fullName || null,
		};

		return NextResponse.json(ticketWithUsers);
	} catch (error) {
		console.error("Update ticket error:", error);
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}

// DELETE: Delete specific ticket (admin only)
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const token = request.cookies.get("token")?.value;
		if (!token) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
		if (decoded.role !== "admin") {
			return NextResponse.json({ message: "Forbidden" }, { status: 403 });
		}

		const db = await getDatabase();
		const result = await db
			.collection("tickets")
			.deleteOne({ _id: new ObjectId(params.id) });

		if (result.deletedCount === 0) {
			return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
		}

		return NextResponse.json({ message: "Ticket deleted successfully" });
	} catch (error) {
		console.error("Delete ticket error:", error);
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}
