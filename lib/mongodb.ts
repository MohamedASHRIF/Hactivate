import { MongoClient, type Db } from "mongodb";

if (!process.env.MONGODB_URI) {
	throw new Error('❌ Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
	const globalWithMongo = global as typeof globalThis & {
		_mongoClientPromise?: Promise<MongoClient>;
	};

	if (!globalWithMongo._mongoClientPromise) {
		client = new MongoClient(uri, options);
		globalWithMongo._mongoClientPromise = client.connect().then((client) => {
			console.log("✅ MongoDB connected in development mode");
			return client;
		});
	}
	clientPromise = globalWithMongo._mongoClientPromise;
} else {
	client = new MongoClient(uri, options);
	clientPromise = client.connect().then((client) => {
		console.log("✅ MongoDB connected in production mode");
		return client;
	});
}

export default clientPromise;

export async function getDatabase(): Promise<Db> {
	const client = await clientPromise;
	const db = client.db("uniconnect");
	console.log(`✅ MongoDB connected to database: ${db.databaseName}`);
	return db;
}
