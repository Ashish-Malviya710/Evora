# 🎟️ Evora - AI-Powered MERN Event Booking Platform

Evora is a modern, high-performance **MERN stack event booking & management platform** equipped with **Google Gemini AI**, real-time seat availability via **Socket.io**, digital **QR code ticket verification**, UPI payment proof submission workflows, and automated cron reminders.

Designed for attendees, event organizers, and platform administrators with robust role-based access control and high-speed database query optimization.

---

## ✨ Key Features

- **🤖 Google Gemini AI Integration**:
  - **AI Natural Language Search**: Search for events using conversational prompts (e.g., *"Show free coding workshops this weekend"*).
  - **Multi-Factor Recommendation Engine**: Personalized curation calculated from previous user bookings, wishlist categories, and live event popularity ratios.
  - **AI Content Generator**: Automatic creation of detailed event descriptions, key highlights, and tags for organizers.
  - **AI Review Summarizer**: Instant pro/con sentiment extraction from attendee ratings and reviews.
  - **Interactive AI Assistant**: Embedded chatbot answering event FAQs, timings, seat availability, and ticket pricing.

- **⚡ Real-Time Capabilities**:
  - **Live Seat Updates**: Powered by Socket.io for instantaneous seat count syncing across all active clients.
  - **Push Notifications**: Real-time notifications for ticket approvals, status updates, and reminders.

- **🎟️ Ticketing & Check-In**:
  - **QR Code Digital Tickets**: Automatic generation of unique, tamper-evident QR code passes upon ticket approval.
  - **In-Browser Camera QR Scanner**: Organizers and admins can scan attendee QR passes directly using device camera for instant check-in.
  - **2FA OTP Verification**: Security OTP sent via email for user registration and booking confirmations.

- **💳 Payment & Approval System**:
  - **Custom Organizer UPI QR**: Dynamic QR code generation containing organizer's UPI ID and event ticket price.
  - **Screenshot Proof Upload**: Attendees upload payment receipts; organizers verify and issue tickets with one click.

- **📊 Comprehensive Analytics Dashboards**:
  - **Organizer Dashboard**: Stat cards with popup modal reports, revenue tracking per event, attendee booking logs, and active status toggles.
  - **Admin Panel**: Platform-wide user management, event moderation, global revenue reports, and category distribution charts.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Axios, Socket.io-client, Chart.js, HTML5 QR Scanner, React Icons |
| **Backend** | Node.js, Express.js, Socket.io, Node-cron, Nodemailer, Cloudinary, Helmet, Express Validator |
| **Database** | MongoDB & Mongoose (with custom indexes & `.lean()` query optimizations) |
| **AI Integration** | `@google/genai` (Gemini 2.0 Flash) |
| **Authentication** | JSON Web Tokens (JWT), BcryptJS, Email 2FA OTP |

---

## 📁 Repository Structure

```
Eventora-MERN/
├── client/                     # Frontend Vite + React application
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, AIAssistant, etc.)
│   │   ├── context/            # Auth, Socket, Theme context providers
│   │   ├── pages/              # App routes (Home, EventDetail, OrganizerDashboard, etc.)
│   │   └── utils/              # Axios instance with VITE_API_URL support
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend Node.js + Express application
│   ├── controllers/            # Logic for auth, events, bookings, gemini, analytics, etc.
│   ├── middleware/             # JWT auth & Multer file upload middlewares
│   ├── models/                 # Mongoose schemas (User, Event, Booking, Review, etc.)
│   ├── routes/                 # Express API routes (/api/*)
│   ├── utils/                  # Socket.io, Cloudinary, Email, Cron Scheduler, Helpers
│   ├── package.json
│   └── server.js
└── package.json                # Root package with monorepo concurrency scripts
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/cloud/atlas) database connection string
- [Google Gemini API Key](https://aistudio.google.com/) (Optional, smart fallback logic works without key)
- Gmail App Password for email notifications (Optional)

### 1. Environment Setup

Create a `.env` file inside the `server/` directory:

```env
# server/.env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/evora?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here

# Optional: Cloud Services
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Optional: Email Service for OTPs
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

*(Optional)* Create a `.env` file inside the `client/` directory for local environment configuration:

```env
# client/.env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 2. Install & Run in Single Terminal

Run the following commands from the root directory:

```bash
# Install dependencies for both root, server, and client
npm run setup

# Run both backend and frontend concurrently
npm run dev
```

- **Backend** runs on: `http://localhost:5000`
- **Frontend** runs on: `http://localhost:5173` (Vite)

---

## 🌐 Production Deployment Guide

Deploying Evora to cloud hosting services (such as **Render / Railway** for backend and **Vercel / Netlify** for frontend) takes just a few steps.

### Step 1: Deploy Database (MongoDB Atlas)
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free Cluster and a Database User.
3. Under **Network Access**, allow IP access from anywhere (`0.0.0.0/0`) so cloud servers can connect.
4. Copy your MongoDB Connection String.

---

### Step 2: Deploy Backend (Render / Railway / Render Web Service)

#### Deploying on Render:
1. Push your project to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your_production_secret
   GEMINI_API_KEY=your_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```
6. Click **Create Web Service**. Note down your live backend URL (e.g., `https://evora-backend.onrender.com`).

---

### Step 3: Deploy Frontend (Vercel / Netlify)

#### Deploying on Vercel:
1. Go to [Vercel Dashboard](https://vercel.com/) → **Add New Project**.
2. Import your GitHub repository.
3. Set the following settings:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   ```env
   VITE_API_URL=https://evora-backend.onrender.com/api
   VITE_SOCKET_URL=https://evora-backend.onrender.com
   ```
5. Click **Deploy**. Vercel will build and publish your frontend application!

---

## ⚡ Performance Optimizations Applied

Evora has been engineered for minimum loading times and response latency:

- **`.lean()` Mongoose Queries**: Added to 20+ read queries across all controllers, bypassing heavy Mongoose Document overhead for 30–50% faster query execution.
- **MongoDB Database Indexes**: Added compound indexes on `{ status: 1, date: 1 }`, `{ userId: 1 }`, `{ eventId: 1 }`, and `{ createdBy: 1 }` for rapid lookups at scale.
- **Code Splitting with `React.lazy()`**: Client-side routes are split into lazy-loaded chunks, reducing the initial JavaScript bundle size by ~65%.
- **Parallel Query Dispatching**: Replaced sequential backend queries with `Promise.all()` in analytics & EventDetail routes for concurrent data fetching.
- **Batch Scheduler Execution**: Transformed reminder cron job from N+1 query loops into bulk `$in` queries and `insertMany` batch operations.

---

## 🔑 Environment Variables Reference

| Variable | Scope | Description |
|---|---|---|
| `PORT` | Server | Port for Express backend server (default: `5000`) |
| `MONGO_URI` | Server | Connection URI for MongoDB cluster |
| `JWT_SECRET` | Server | Secret string used to sign auth tokens |
| `GEMINI_API_KEY` | Server | Google AI Studio API key for Gemini 2.0 Flash features |
| `CLOUDINARY_*` | Server | Cloudinary keys for image uploads (Cloud Name, API Key, API Secret) |
| `EMAIL_*` | Server | Nodemailer Gmail configuration for OTP sending |
| `VITE_API_URL` | Client | Live backend URL pointing to `/api` route |
| `VITE_SOCKET_URL` | Client | Live backend URL for Socket.io WebSocket connection |

---

## 📄 License & Credits

Developed & Maintained by **Ashish Kumar**.  
Built with ❤️ using the MERN Stack & Google Gemini AI.
