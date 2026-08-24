# Healthcare Appointment Manager

A full-stack healthcare appointment management platform designed for clinics, patients, doctors, and administrators.

The platform goes beyond basic appointment booking by allowing patients to submit symptoms before their appointment, generating AI-powered pre-visit summaries for doctors, creating patient-friendly post-visit summaries, managing prescriptions and medication reminders, and keeping patients and doctors synchronized through email notifications and Google Calendar.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Objectives](#objectives)
- [Features](#features)
- [User Roles](#user-roles)
- [System Workflow](#system-workflow)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Appointment Management](#appointment-management)
- [Doctor Management](#doctor-management)
- [Leave Management](#leave-management)
- [Patient Medical Records](#patient-medical-records)
- [AI / LLM Integration](#ai--llm-integration)
- [Consultation and Post-Visit Summary](#consultation-and-post-visit-summary)
- [Prescription Management](#prescription-management)
- [Medication Reminders](#medication-reminders)
- [Email Notifications](#email-notifications)
- [Google Calendar Integration](#google-calendar-integration)
- [Background Jobs](#background-jobs)
- [Double-Booking Prevention](#double-booking-prevention)
- [Slot Hold Mechanism](#slot-hold-mechanism)
- [Doctor Leave Conflict Handling](#doctor-leave-conflict-handling)
- [Notification Failure Handling](#notification-failure-handling)
- [LLM Failure Handling](#llm-failure-handling)
- [Database Schema](#database-schema)
- [Security](#security)
- [Frontend](#frontend)
- [Backend](#backend)
- [Deployment](#deployment)
- [Testing](#testing)
- [System Design](#system-design)
- [Future Improvements](#future-improvements)
- [Evaluation Requirements](#evaluation-requirements)
- [License](#license)

---

# Project Overview

Healthcare Appointment Manager is a web-based healthcare platform that provides separate portals for:

- Patients
- Doctors
- Administrators

The system manages the complete appointment lifecycle:

```text
Patient Registration
        ↓
Doctor Search
        ↓
Slot Selection
        ↓
Slot Hold
        ↓
Symptom Submission
        ↓
AI Pre-Visit Summary
        ↓
Appointment Confirmation
        ↓
Email + Google Calendar
        ↓
Doctor Consultation
        ↓
Clinical Notes
        ↓
Prescription
        ↓
AI Post-Visit Summary
        ↓
Medication Reminders
        ↓
Follow-Up