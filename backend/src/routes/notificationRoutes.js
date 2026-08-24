const express = require("express");

const {
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendMedicationReminderNotification,
} = require("../controllers/notificationController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/appointment-confirmation",
  authenticate,
  sendAppointmentConfirmation
);

router.post(
  "/appointment-cancellation",
  authenticate,
  sendAppointmentCancellation
);

router.post(
  "/medication-reminder",
  authenticate,
  sendMedicationReminderNotification
);

module.exports = router;