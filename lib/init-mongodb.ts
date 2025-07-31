import { getDatabase } from "@/lib/mongodb";

let mongoConnected = false;

export async function initMongoConnection() {
	if (mongoConnected) return; // skip if already connected/logged

	try {
		const db = await getDatabase();
		console.log(`✅ MongoDB connected to: ${db.databaseName}`);
		mongoConnected = true;
	} catch (err) {
		console.error("❌ MongoDB connection failed:", err);
	}
}
