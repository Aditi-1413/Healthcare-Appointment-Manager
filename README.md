<div align="center">

# 🏥 MedTime Plus

### AI-Powered Healthcare Appointment Platform

*A full-stack booking platform with AI-assisted pre/post-visit summaries, race-safe slot handling, automated notifications, and Google Calendar sync.*

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

[Features](#-key-features) · [Architecture](#architecture) · [Getting started](#getting-started) · [API docs](#api-documentation)

</div>

---

## Overview

MedTime Plus is a role-based appointment platform connecting **Patients**, **Doctors**, and **Admins** in one workflow. Patients book a slot and describe their symptoms; doctors walk into each visit already briefed by an AI-generated triage summary; admins manage the doctor roster, working hours, and leave days — all backed by the same source of truth. Confirmed appointments sync to Google Calendar, and email notifications cover confirmations, cancellations, and medication reminders.

## ✨ Key Features

### 👤 Patient Portal
- Registration and secure login (JWT)
- Search doctors by specialization
- View available appointment slots
- Book, confirm, and cancel appointments
- Submit symptoms before the appointment
- View medical history, consultations, prescriptions, and follow-ups
- Set medication reminders

### 👨‍⚕️ Doctor Portal
- View upcoming appointments
- Access patient symptom information
- Receive an AI-generated pre-visit symptom summary
- Record clinical notes after consultation
- Generate patient-friendly post-visit summaries using AI
- Create prescriptions and medication schedules

### 🛠️ Admin Portal
- Create and manage doctor profiles
- Manage doctor specializations
- Configure working hours and appointment slot duration
- Manage doctor leave days
- Handle appointment and scheduling operations

## 🤖 AI-Powered Healthcare

LLM integration turns patient-submitted symptoms into a concise pre-visit summary:

- Urgency level: Low / Medium / High
- Chief complaint
- Three suggested questions for the doctor

After consultation, the doctor's clinical notes are converted into a patient-friendly post-visit summary with a medication schedule and follow-up instructions. LLM failures are handled gracefully so an AI outage never blocks the appointment workflow.

## 🔐 Reliable Appointment Management

Double-booking is prevented at the database level (a unique constraint on doctor + date + slot), not through application-side locking, so two simultaneous booking attempts for the same slot can't both succeed.

Appointments follow a lifecycle:

`Available → Held → Confirmed → Completed / Cancelled`

Marking a doctor on leave cascades to their existing appointments so affected patients can be notified.

## 📧 Notifications & Reminders

Automated notifications cover:

- Appointment confirmations
- Appointment cancellations
- Medication reminders
- Doctor leave / appointment changes

Background jobs handle scheduled medication reminders and retry failed sends rather than dropping them silently.

## 📅 Google Calendar Integration

Confirmed appointments sync to Google Calendar for both patient and doctor, and calendar events are updated on cancellation or rescheduling.

## Architecture

```mermaid
flowchart LR
    subgraph Client["React SPA (Vite)"]
        UI["Patient / Doctor / Admin portals"]
    end

    subgraph Server["Express API"]
        API["REST routes"]
        Jobs["Scheduled jobs\nslot cleanup · reminders\nnotification retry"]
    end

    DB[("PostgreSQL")]
    LLM["LLM API"]
    Email["Email service"]
    GCal["Google Calendar API"]

    UI <-- "JWT Bearer" --> API
    API <--> DB
    API -- "pre/post-visit summaries" --> LLM
    API -- "confirmations, reminders" --> Email
    API -- "OAuth 2.0" --> GCal
    Jobs --> DB
    Jobs --> Email
    Jobs --> LLM
```

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js, REST APIs |
| Auth | JWT Authentication |
| Database | PostgreSQL, Prisma ORM |
| AI | LLM integration for symptom analysis and post-visit summaries |
| Integrations | Google Calendar API, email notification service, background scheduled jobs |

## Project structure

```
medtime-plus/
├── client/                 React frontend (Vite)
│   └── src/
│       ├── components/     Shared UI
│       ├── pages/          Route pages by role: patient/, doctor/, admin/
│       ├── context/        AuthContext (JWT session)
│       └── services/       API wrappers
├── server/                 Express API
│   ├── prisma/             Prisma schema and migrations
│   ├── controllers/        Route handlers by domain
│   ├── routes/              Route definitions
│   ├── middleware/           auth.js (JWT verify), roleGuard.js, errorHandler.js
│   ├── services/               llm.js, email.js, calendar.js, slots.js
│   ├── jobs/                    Scheduled background jobs
│   └── templates/                Email templates
├── .env.example
└── README.md
```

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+
- A PostgreSQL database

### 1. Clone and install

```bash
git clone https://github.com/Aditi-1413/Healthcare-Appointment-Manager.git
cd Healthcare-Appointment-Manager
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/medtimeplus
JWT_SECRET=your_jwt_secret
LLM_API_KEY=your_llm_api_key
SMTP_HOST=smtp.example.com
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/callback
```

### 3. Run database migrations

```bash
npx prisma migrate dev
```

### 4. Run locally

```bash
npm run dev
```

## API documentation

All routes are mounted under `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth (`/api/auth`)

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/register` | Public | `{ name, email, password, phone? }` | `201` `{ token, user }` |
| POST | `/login` | Public | `{ email, password }` | `200` `{ token, user }` |
| GET | `/me` | Any role | — | `200` current user profile |

### Doctors (`/api/doctors`)

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/` | Public | query: `specialization?`, `search?`, `page?`, `limit?` | `200` `{ doctors, page, total }` |
| GET | `/:id` | Public | — | `200` doctor profile |
| GET | `/:id/slots` | Public | query: `date=YYYY-MM-DD` | `200` `{ date, slots: [...] }` |

### Appointments — patient (`/api/appointments`, role: `patient`)

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/hold` | `{ doctorId, date, startTime }` | `200` `{ appointmentId, heldUntil }` or `409` if taken |
| POST | `/confirm` | `{ appointmentId, symptoms }` | `200` confirmed appointment |
| GET | `/my` | — | `200` patient's appointments |
| PUT | `/:id/cancel` | — | `200` cancelled appointment |

### Doctor portal (`/api/doctor`, role: `doctor`)

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/appointments` | — | `200` doctor's appointments |
| PUT | `/appointments/:id/complete` | `{ notes, prescription: [{medication, dosage, frequency, duration}] }` | `200` completed appointment with AI post-visit summary |

### Admin portal (`/api/admin`, role: `admin`)

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/doctors` | query: `search?`, `page?` | `200` doctor list |
| POST | `/doctors` | `{ name, email, password, specialization, workingHours? }` | `201` created doctor |
| PUT | `/doctors/:id/leave` | `{ date }` | `200` `{ doctor, cancelledAppointments }` |

## Database schema (Prisma)

```prisma
model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(PATIENT)
  phone        String?
  createdAt    DateTime @default(now())
}

model DoctorProfile {
  id             String   @id @default(uuid())
  userId         String   @unique
  specialization String
  workingHours   Json
  slotDuration   Int      @default(30)
  leaveDays      DateTime[]
}

model Appointment {
  id                 String   @id @default(uuid())
  patientId          String
  doctorId           String
  date               DateTime
  startTime          String
  status             Status   @default(PENDING)
  symptoms           String?
  preVisitSummary    Json?
  postVisitSummary   Json?
  prescription       Json?
  createdAt          DateTime @default(now())

  @@unique([doctorId, date, startTime])
}

enum Role {
  PATIENT
  DOCTOR
  ADMIN
}

enum Status {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}
```

The `@@unique([doctorId, date, startTime])` constraint is what prevents double-booking at the database level.

## 🎯 Project Objective

MedTime Plus goes beyond a basic appointment booking system by connecting appointment scheduling, symptom analysis, clinical documentation, prescriptions, AI-generated summaries, notifications, medication reminders, and calendar synchronization into one healthcare workflow — reducing administrative effort for clinics while giving patients and doctors a more organized, informed appointment experience.

## Author

**Aditi** — [@Aditi-1413](https://github.com/Aditi-1413)

## License

MIT