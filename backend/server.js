const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Routes
const authRoutes = require("./src/routes/authRoutes");
const doctorRoutes = require("./src/routes/doctorRoutes");
const leaveRoutes = require("./src/routes/leaveRoutes");
const appointmentRoutes = require("./src/routes/appointmentRoutes");
const patientRoutes = require("./src/routes/patientRoutes");
const calendarRoutes = require("./src/routes/calendarRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");

// Background jobs
const {
  startMedicationReminderJob,
} = require("./src/jobs/medicationReminderJob");

const {
  startNotificationRetryJob,
} = require("./src/jobs/notificationRetryJob");
const app = express();

// ====================================================
// CONFIGURATION
// ====================================================

const PORT = process.env.PORT || 5000;

// ====================================================
// MIDDLEWARE
// ====================================================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// ====================================================
// HEALTH CHECK
// ====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Healthcare Appointment Manager API is running",
  });
});

// ====================================================
// ROUTES
// ====================================================

app.use("/api/auth", authRoutes);

app.use("/api/doctors", doctorRoutes);

app.use("/api", leaveRoutes);

app.use("/api/appointments", appointmentRoutes);

app.use("/api/patients", patientRoutes);

app.use("/api/calendar", calendarRoutes);

app.use("/api/notifications", notificationRoutes);

// ====================================================
// 404 HANDLER
// ====================================================

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ====================================================
// GLOBAL ERROR HANDLER
// ====================================================

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// ====================================================
// START SERVER
// ====================================================

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Start background medication reminder job
  startMedicationReminderJob();

  // Start background notification retry job
  startNotificationRetryJob();
  console.log("All background jobs started");
});