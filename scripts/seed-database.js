const { MongoClient } = require("mongodb")
const bcrypt = require("bcryptjs")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "uniconnect"

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db(DB_NAME)

    // Clear existing data
    await db.collection("users").deleteMany({})
    await db.collection("tickets").deleteMany({})
    await db.collection("messages").deleteMany({})
    await db.collection("appointments").deleteMany({})
    await db.collection("announcements").deleteMany({})

    console.log("Cleared existing data")

    // Create demo users
    const hashedPassword = await bcrypt.hash("password", 12)

    const users = [
      {
        name: "John Student",
        email: "student@uni.edu",
        password: hashedPassword,
        role: "student",
        department: "Computer Science",
        studentId: "STU123456",
        isOnline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Dr. Jane Lecturer",
        email: "lecturer@uni.edu",
        password: hashedPassword,
        role: "lecturer",
        department: "Computer Science",
        isOnline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Admin User",
        email: "admin@uni.edu",
        password: hashedPassword,
        role: "admin",
        department: "Administration",
        isOnline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const userResult = await db.collection("users").insertMany(users)
    console.log("Created demo users")

    // Create sample tickets
    const studentId = userResult.insertedIds[0]
    const lecturerId = userResult.insertedIds[1]

    const tickets = [
      {
        studentId,
        assignedTo: lecturerId,
        title: "Cannot access course materials",
        description: "I am unable to download the lecture slides from the portal.",
        category: "technical",
        priority: "medium",
        status: "open",
        replies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        studentId,
        title: "Question about assignment deadline",
        description: "Can the deadline for Assignment 2 be extended?",
        category: "academic",
        priority: "low",
        status: "in-progress",
        replies: [
          {
            userId: lecturerId,
            message: "I will review this request and get back to you.",
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        updatedAt: new Date(),
      },
    ]

    await db.collection("tickets").insertMany(tickets)
    console.log("Created sample tickets")

    // Create sample announcements
    const adminId = userResult.insertedIds[2]

    const announcements = [
      {
        authorId: adminId,
        title: "System Maintenance Scheduled",
        content: "The university portal will be under maintenance this weekend from 2 AM to 6 AM.",
        category: "general",
        targetAudience: ["student", "lecturer"],
        isPinned: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        authorId: lecturerId,
        title: "New Course Materials Available",
        content: "Week 5 lecture slides and assignments have been uploaded to the portal.",
        category: "academic",
        targetAudience: ["student"],
        isPinned: false,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        updatedAt: new Date(Date.now() - 3600000),
      },
    ]

    await db.collection("announcements").insertMany(announcements)
    console.log("Created sample announcements")

    // Create indexes for better performance
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("tickets").createIndex({ studentId: 1 })
    await db.collection("tickets").createIndex({ assignedTo: 1 })
    await db.collection("messages").createIndex({ chatId: 1 })
    await db.collection("appointments").createIndex({ lecturerId: 1 })
    await db.collection("appointments").createIndex({ studentId: 1 })

    console.log("Created database indexes")
    console.log("Database seeded successfully!")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await client.close()
  }
}

seedDatabase()
