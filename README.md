# 🏛️ CiviqAI: Grievance Network System
> **Digital India Redressal Initiative** — An AI-powered, geolocated civic grievance logging, tracking, and resolution platform.

---

## 🌟 Key Features

* **📍 Geolocated Grievance Lodging**: Citizens can pin the exact issue location on an interactive, responsive widescreen 16:9 Leaflet Map with integrated reverse-geocoding (OSM Nominatim).
* **⚡ Smart AI Routing Engine**: Automated NLP categorizes grievances, estimates severity, assigns appropriate departments, and highlights insights.
* **📈 5-Checkpoint Redressal Stepper**: End-to-end tracking system for complaint life cycles. Integrates dynamic connector lines that transition to dark blue as stages are completed.
* **👥 Role-Based Portals**:
  * **Citizens**: Lodge complaints, track timeline changes, and chat with the AI twin.
  * **Admins / Dept Heads**: Oversee division tickets, register & allocate field officers.
  * **Field Officers**: Update progress notes and progress complaints through checkpoints.
* **💬 Synchronized AI Chat Workspace**: A full-page voice/chat assistant workspace synced in real-time with the floating chatbot widget.
* **📞 Department Directory**: Live central helplines (GHMC toll-free, State MyGov Desk, WhatsApp Support) and division contact coordinates.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Lucide Icons, Recharts, Leaflet
* **Backend**: Next.js Serverless API endpoints
* **Database & ORM**: Supabase (PostgreSQL) + Prisma Client
* **Deployment**: Vercel Production Build

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Digital-India-Hackathon-2026/team-fortis.git
cd team-fortis
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and configure the variables:
```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/civiqai"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-secret-role-key"
GEMINI_API_KEYS="key1,key2,key3"
```

### 3. Database Migration & Seed
Run Prisma migrations to set up schema tables and seed sample data:
```bash
npx prisma migrate dev
node prisma/seed.js
```

### 4. Run Locally
Start the local development server:
```bash
npm run dev
```

### 5. Build for Production
To package the app for production:
```bash
npm run build
```

---

## 🌐 Live Deployment
The project is live at: **[https://civiqai-seven.vercel.app](https://civiqai-seven.vercel.app)**
