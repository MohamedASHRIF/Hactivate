import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid appointment id" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection("appointments").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Appointment deleted" });
  } catch (err) {
    return NextResponse.json({ message: "Failed to delete appointment" }, { status: 500 });
  }
}
