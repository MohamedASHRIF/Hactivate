# 🚀 Hactivate

*Hactivate* is a full-featured developer toolset designed to accelerate the development of modern, scalable, and accessible web applications. It brings together powerful UI components, secure user management, and real-time communication — all styled with a clean and responsive design system.

---

## 🌟 Features

### 🎨 Styling Pipeline
- Seamless integration of *Tailwind CSS, **PostCSS, and **Autoprefixer*.
- Utility-first styling approach for rapid UI development.
- Consistent and maintainable design patterns.

### 🧱 Modular UI Components
- Built with *Radix UI primitives* for accessibility and flexibility.
- Includes reusable components: buttons, modals, inputs, forms, dropdowns, etc.
- Fully theme-compatible with light/dark mode toggle support.

### 🔐 User & Role Management
- Secure *JWT-based authentication*.
- Role-based access control for granular permissions.
- Built-in theme toggling and session persistence.

### 💬 Real-Time Messaging
- Instant messaging system using *WebSockets* or *Socket.IO*.
- Real-time notifications and live chat features.
- Integrated seamlessly into the UI components.

### 🗓 Scheduling & Ticketing System
- API endpoints for managing:
  - Appointments
  - Tickets
  - Time slots
  - Announcements
- Designed for team-based collaboration and project tracking.

### 👨‍💻 Developer-Centric
- Built with *TypeScript* for safety and developer confidence.
- Scalable architecture for team collaboration.
- Easy to extend, integrate, and customize.

---

## 📁 Project Structure

Hactivate/
├── components/ # Reusable UI components
├── pages/ # App pages (Next.js or React Router)
├── api/ # Backend API endpoints
├── lib/ # Utilities (auth, DB, helpers)
├── styles/ # Tailwind and global styles
├── public/ # Static assets
└── README.md

yaml
Copy
Edit

---

## 🚀 Getting Started

### ✅ Prerequisites

Make sure you have the following installed:

- *Node.js* (v18+ recommended)
- *npm* (v9+)
- *TypeScript*

---

### 📦 Installation

1. *Clone the repository*

```bash
git clone https://github.com/MohamedASHRIF/Hactivate
Navigate to the project directory

bash
Copy
Edit
cd Hactivate
Install dependencies
npm install

create .env.local in project root
MONGODB_URI=mongodb+srv://mohamedashrif325:JTD72imp3LVTr903@cluster0.iug9zvr.mongodb.net/

JWT_SECRET=X4v9$R3e!M7u@2LpZc#T8vBn%Q1s*W6d

GEMINI_API_KEY=AIzaSyDmxGUpOfhvU5Fu8Onl3dwyeE2eStgwTyw
add them

🧪 Running the Project
Start the development server:

bash
Copy
Edit
npm run dev
Visit the app at http://localhost:3000

