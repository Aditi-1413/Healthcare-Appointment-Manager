const express = require("express");

const {
  getMyAppointments,
  getDoctorAppointments,
  holdAppointment,
  confirmAppointment,
  cancelAppointment,
  createConsultation,
  createPostVisitSummary,
  createPrescription,
  createMedicationReminder,
} = require("../controllers/appointmentController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();
const {
  createSymptomReport,
} = require("../controllers/appointmentController");
// Patient: view own appointments
router.post(
  "/:id/symptoms",
  authenticate,
  createSymptomReport
);
router.get(
  "/my",
  authenticate,
  getMyAppointments
);

// Doctor: view own appointments
router.get(
  "/doctor",
  authenticate,
  getDoctorAppointments
);

// Patient: hold appointment
router.post(
  "/hold",
  authenticate,
  holdAppointment
);

// Patient: confirm appointment
router.post(
  "/:id/confirm",
  authenticate,
  confirmAppointment
);

// Patient: cancel appointment
router.post(
  "/:id/cancel",
  authenticate,
  cancelAppointment
);

// Doctor: create consultation
router.post(
  "/:id/consultation",
  authenticate,
  createConsultation
);

// Doctor: create post-visit summary
router.post(
  "/:id/post-visit-summary",
  authenticate,
  createPostVisitSummary
);

// Doctor: create prescription
router.post(
  "/:id/prescription",
  authenticate,
  createPrescription
);

// Patient: create medication reminder
router.post(
  "/prescriptions/:prescriptionId/reminder",
  authenticate,
  createMedicationReminder
);

module.exports = router;