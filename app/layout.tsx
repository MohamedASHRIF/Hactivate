

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "UniConnect - University Communication Platform",
	description: "Connect students, lecturers, and administrators seamlessly",
	manifest: "/manifest.json",
	generator: "v0.dev",
};

//  Call the DB connection trigger at the top level
initMongoConnection();
