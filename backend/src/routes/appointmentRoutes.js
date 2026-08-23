const express = require("express");

const {
  holdAppointment,
  confirmAppointment,
  getMyAppointments,
  cancelAppointment,
} = require("../controllers/appointmentController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Hold a slot
router.post(
  "/hold",
  authenticate,
  holdAppointment
);

// Confirm a held appointment
router.post(
  "/:appointmentId/confirm",
  authenticate,
  confirmAppointment
);

// Get logged-in patient's appointments
router.get(
  "/my",
  authenticate,
  getMyAppointments
);

// Cancel appointment
router.post(
  "/:appointmentId/cancel",
  authenticate,
  cancelAppointment
);

module.exports = router;