# 🏥 MedTime Plus — AI-Powered Healthcare Appointment Platform

MedTime Plus is a full-stack healthcare appointment management platform designed to simplify and automate the complete patient–doctor appointment workflow.

The platform provides **separate portals for Patients, Doctors, and Admins**, allowing each role to manage the information and tasks relevant to them.

## ✨ Key Features

- 👤 **Patient Portal**
  - Patient registration and secure login
  - Search doctors by specialization
  - View available appointment slots
  - Book, confirm, and cancel appointments
  - Submit symptoms before the appointment
  - View medical history, consultations, prescriptions, and follow-ups
  - Set medication reminders

- 👨‍⚕️ **Doctor Portal**
  - View upcoming appointments
  - Access patient symptom information
  - Receive an **AI-generated pre-visit symptom summary**
  - Record clinical notes after consultation
  - Generate patient-friendly post-visit summaries using AI
  - Create prescriptions and medication schedules

- 🛠️ **Admin Portal**
  - Create and manage doctor profiles
  - Manage doctor specializations
  - Configure working hours and appointment slot duration
  - Manage doctor leave days
  - Handle appointment and scheduling operations

## 🤖 AI-Powered Healthcare

LLM integration is used to transform patient-provided symptoms into a concise **pre-visit summary** containing:

- Urgency level: Low / Medium / High
- Chief complaint
- Three suggested questions for the doctor

After consultation, clinical notes are converted into a **patient-friendly post-visit summary** containing medication schedules and follow-up instructions.

LLM failures are handled gracefully so that AI issues do not interrupt the appointment workflow.

## 🔐 Reliable Appointment Management

The system is designed to prevent double-booking during simultaneous booking attempts using database-level constraints and controlled slot handling.

Appointments follow a lifecycle such as:

`Available → Held → Confirmed → Completed / Cancelled`

Doctor leave management also handles existing appointments so affected patients can be notified appropriately.

## 📧 Notifications & Reminders

The platform supports automated notifications for:

- Appointment confirmations
- Appointment cancellations
- Medication reminders
- Doctor leave/appointment changes

Background jobs process scheduled medication reminders and support reliable notification delivery.

## 📅 Google Calendar Integration

Confirmed appointments can be synchronized with **Google Calendar**, keeping patients and doctors informed about their schedules.

Calendar events are designed to support appointment lifecycle changes such as cancellation and rescheduling.

## 🛠️ Technology Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- REST APIs
- JWT Authentication

**Database**
- PostgreSQL
- Prisma ORM

**AI**
- LLM integration for symptom analysis and post-visit summaries

**Integrations**
- Google Calendar API
- Email notification service
- Background scheduled jobs

## 🎯 Project Objective

MedTime Plus goes beyond a basic appointment booking system by connecting **appointment scheduling, symptom analysis, clinical documentation, prescriptions, AI-generated summaries, notifications, medication reminders, and calendar synchronization** into one healthcare workflow.

The goal is to reduce administrative effort for clinics while giving patients and doctors a more organized and informed appointment experience.