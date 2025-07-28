const { MongoClient } = require('mongodb');

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'uniconnect';

const analyticsData = {
  totalUsers: 1247,
  totalTickets: 156,
  openTickets: 23,
  closedTickets: 133,
  totalAnnouncements: 42,
  totalAppointments: 89,
  lastUpdated: new Date().toLocaleString(),
  createdAt: new Date(),
  updatedAt: new Date()
};

const additionalUsers = [
  { name: "John Doe", email: "john.doe@university.edu", role: "student", department: "Computer Science", createdAt: new Date() },
  { name: "Jane Smith", email: "jane.smith@university.edu", role: "lecturer", department: "Mathematics", createdAt: new Date() },
  { name: "Mike Johnson", email: "mike.johnson@university.edu", role: "student", department: "Physics", createdAt: new Date() },
  { name: "Sarah Wilson", email: "sarah.wilson@university.edu", role: "lecturer", department: "Chemistry", createdAt: new Date() },
  { name: "Admin User", email: "admin@university.edu", role: "admin", department: "Administration", createdAt: new Date() }
];

const sampleTickets = [
  { title: "Login Issue", description: "Cannot access my account", status: "open", priority: "high", createdBy: "john.doe@university.edu", createdAt: new Date() },
  { title: "Grade Inquiry", description: "Question about final exam grade", status: "closed", priority: "medium", createdBy: "jane.smith@university.edu", createdAt: new Date() },
  { title: "System Bug", description: "Error when submitting assignment", status: "open", priority: "high", createdBy: "mike.johnson@university.edu", createdAt: new Date() }
];

const sampleAnnouncements = [
  { title: "Campus Maintenance", content: "Scheduled maintenance this weekend", priority: "medium", createdBy: "admin@university.edu", createdAt: new Date() },
  { title: "New Course Registration", content: "Registration opens next Monday", priority: "high", createdBy: "admin@university.edu", createdAt: new Date() }
];

const sampleAppointments = [
  { title: "Academic Advising", description: "Course planning session", date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), studentEmail: "john.doe@university.edu", lecturerEmail: "jane.smith@university.edu", status: "scheduled" },
  { title: "Office Hours", description: "Math tutoring session", date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), studentEmail: "mike.johnson@university.edu", lecturerEmail: "sarah.wilson@university.edu", status: "scheduled" }
];

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Clear existing analytics data
    await db.collection('analytics').deleteMany({});
    console.log('Cleared existing analytics data');
    
    // Insert analytics data
    await db.collection('analytics').insertOne(analyticsData);
    console.log('Inserted analytics data');
    
    // Insert sample users (only if collection is empty)
    const userCount = await db.collection('users').countDocuments();
    if (userCount === 0) {
      await db.collection('users').insertMany(additionalUsers);
      console.log('Inserted sample users');
    }
    
    // Insert sample tickets (only if collection is empty)
    const ticketCount = await db.collection('tickets').countDocuments();
    if (ticketCount === 0) {
      await db.collection('tickets').insertMany(sampleTickets);
      console.log('Inserted sample tickets');
    }
    
    // Insert sample announcements (only if collection is empty)
    const announcementCount = await db.collection('announcements').countDocuments();
    if (announcementCount === 0) {
      await db.collection('announcements').insertMany(sampleAnnouncements);
      console.log('Inserted sample announcements');
    }
    
    // Insert sample appointments (only if collection is empty)
    const appointmentCount = await db.collection('appointments').countDocuments();
    if (appointmentCount === 0) {
      await db.collection('appointments').insertMany(sampleAppointments);
      console.log('Inserted sample appointments');
    }
    
    console.log('Database seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

seedDatabase();
