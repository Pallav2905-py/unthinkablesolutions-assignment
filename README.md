# Healthcare Appointment & Follow-up Manager

> Built for **Unthinkable Solutions** — A production-ready healthcare SaaS platform with AI-powered appointment management, patient/doctor portals, and smart notifications.

![Healthcare Manager](https://img.shields.io/badge/Healthcare-Manager-16a34a?style=for-the-badge&logo=heart)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![Groq AI](https://img.shields.io/badge/Groq-AI-f97316?style=for-the-badge)

---

## 🌟 Features

### Patient Portal
- Register, log in, and manage profile
- Search doctors by specialisation with real-time filtering
- Book appointments with a 3-step guided flow
- **Slot hold mechanism** — 5-minute atomic hold prevents double-booking
- Submit symptom form before confirming appointment
- View AI-generated pre-visit summary (urgency level, chief complaint, suggested questions)
- View post-visit patient-friendly summaries
- Cancel appointments with automatic notifications

### Doctor Portal
- Dashboard with today's patients sorted by AI urgency
- View AI pre-visit summary before each patient arrives
- Submit clinical notes and prescription after visit
- AI auto-generates patient-friendly post-visit summary
- Retry AI summary generation if it fails
- Weekly appointment chart

### Admin Portal
- Create & manage doctor profiles (specialisation, working hours, slot duration, fees)
- Working hours toggle per day with custom start/end times
- Leave day management with **automatic conflict resolution**
  - Cancels existing appointments when leave is added
  - Sends cancellation emails to affected patients and doctor
- User management with role-based filtering
- Real-time analytics: bookings trend chart, specialisation pie chart, system health

### AI Integration (Groq)
- **Pre-visit**: Urgency level (Low/Medium/High), chief complaint, 3 suggested questions
- **Post-visit**: Patient-friendly summary with medication schedule and follow-up steps
- All AI failures handled gracefully — system never breaks
- Retry button available for failed summaries

### Notifications
- Email confirmation to patient and doctor on booking
- Appointment reminder 24 hours before (via cron job)
- Cancellation notification with reason
- Medication reminders every 8 hours (configurable)
- Failed notifications retried up to 3 times automatically

### Google Calendar (Optional)
- OAuth 2.0 integration creates calendar events on booking
- Events updated/deleted on reschedule/cancellation
- Gracefully disabled if OAuth credentials are not configured

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd unthinkablesolutions-assignment
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

Minimum required variables:
```env
MONGODB_URI=mongodb+srv://yash:yash@yash.clfmbdq.mongodb.net/
BETTER_AUTH_SECRET=any-random-32-char-string
GROQ_API_KEY=gsk_...
```

### 3. Start Development Server

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

### 4. (Optional) Seed Demo Data

```bash
node scripts/seed.js
```

Then register accounts via the UI:
- `admin@demo.com` (admin portal)
- `doctor@demo.com` (doctor portal)
- `patient@demo.com` (patient portal)

Password: **Demo@1234**

---

## 🗄️ Database Schema

### Users Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "role": "patient | doctor | admin",
  "phone": "string",
  "googleTokens": { "access_token": "", "refresh_token": "", "expiry_date": 0 },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Doctors Collection
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: User)",
  "specialisation": "string",
  "bio": "string",
  "experience": "number (years)",
  "workingHours": [
    { "day": "Monday", "startTime": "09:00", "endTime": "17:00", "isAvailable": true }
  ],
  "slotDurationMinutes": 30,
  "leaveDays": ["2024-12-25"],
  "consultationFee": 500,
  "rating": 4.8,
  "isActive": true
}
```

### Appointments Collection
```json
{
  "_id": "ObjectId",
  "patientId": "ObjectId (ref: User)",
  "doctorId": "ObjectId (ref: Doctor)",
  "date": "2024-12-25",
  "startTime": "09:00",
  "endTime": "09:30",
  "status": "confirmed | pending | cancelled | completed",
  "symptoms": {
    "text": "string",
    "selfAssessedUrgency": "Low | Medium | High",
    "duration": "string"
  },
  "preVisitSummary": {
    "urgencyLevel": "High",
    "chiefComplaint": "string",
    "suggestedQuestions": ["Q1", "Q2", "Q3"],
    "failed": false
  },
  "postVisitNotes": "string",
  "postVisitSummary": "string",
  "prescription": [
    {
      "medication": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "reminderActive": true
    }
  ]
}
```

### Slots Collection (TTL)
```json
{
  "_id": "ObjectId",
  "doctorId": "ObjectId",
  "date": "2024-12-25",
  "startTime": "09:00",
  "endTime": "09:30",
  "heldBy": "ObjectId (userId)",
  "heldUntil": "Date (TTL — 5 minutes)",
  "isBooked": false
}
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up/email` | Register new user |
| POST | `/api/auth/sign-in/email` | Sign in |
| POST | `/api/auth/sign-out` | Sign out |
| GET | `/api/auth/get-session` | Get current session |

### Doctors
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/doctors` | List doctors (with filters) | Public |
| POST | `/api/doctors` | Create doctor profile | Admin |
| GET | `/api/doctors/:id` | Get doctor details | Public |
| PUT | `/api/doctors/:id` | Update doctor / add leave | Admin |
| DELETE | `/api/doctors/:id` | Deactivate doctor | Admin |

### Slots
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/slots/available?doctorId=&date=` | Get available time slots | Patient |
| POST | `/api/slots/hold` | Atomically hold a slot (5 min) | Patient |

### Appointments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/appointments` | List user's appointments | Patient/Doctor |
| POST | `/api/appointments` | Book appointment | Patient |
| GET | `/api/appointments/:id` | Get appointment detail | Owner |
| PUT | `/api/appointments/:id` | Cancel / update status | Owner |
| POST | `/api/appointments/:id/post-visit` | Submit clinical notes | Doctor |
| PUT | `/api/appointments/:id/post-visit` | Retry AI summary | Doctor/Patient |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/stats` | Dashboard analytics | Admin |
| GET | `/api/admin/users` | List all users | Admin |

---

## 🤖 LLM Prompts

### Pre-Visit Summary (Groq → `openai/gpt-oss-120b`)
```
Analyse these symptoms and return a JSON object with exactly these fields:
- urgencyLevel: one of "Low", "Medium", or "High"
- chiefComplaint: a brief (max 20 words) statement of the primary complaint
- suggestedQuestions: an array of exactly 3 questions the doctor should ask

Return ONLY valid JSON, no markdown, no explanation.

Symptoms: {patient_symptoms}
```

### Post-Visit Summary
```
Convert these clinical notes into a patient-friendly summary.
Use simple, clear language a patient can understand. Include:
1. What was diagnosed / found
2. Medication schedule (from prescription: {prescription_text})
3. Follow-up steps and lifestyle advice
4. When to seek emergency care (if applicable)

Keep it warm, reassuring, and under 300 words.

Clinical Notes: {clinical_notes}
```

---

## 📅 Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Calendar API**
4. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/calendar/callback`
7. Copy **Client ID** and **Client Secret** to `.env.local`

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
```

> **Note**: Google Calendar integration is fully implemented but optional. The app works completely without it — calendar events are silently skipped if credentials are not configured.

---

## 🔒 Security

- Role-based access enforced on every API route
- Session validation via Better Auth on each request
- Passwords hashed by Better Auth (bcrypt)
- Environment variables for all secrets
- MongoDB TTL indexes for automatic slot expiry

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database | MongoDB Atlas (Mongoose) |
| Auth | Better Auth |
| AI | Groq API (openai/gpt-oss-120b) |
| Email | Nodemailer (Gmail SMTP) |
| Calendar | Google Calendar API v3 |
| Background Jobs | node-cron |
| Charts | Recharts |
| Icons | Lucide React |
| Styling | Tailwind CSS 4 |

---

## 👥 Team

Built by **Unthinkable Solutions** for the healthcare platform assignment.

---

*© 2024 Unthinkable Solutions. All rights reserved.*
