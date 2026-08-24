const {
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
  notifyMedicationReminder,
} = require("../services/notificationService");

const sendAppointmentConfirmation = async (req, res) => {
  try {
    const result = await notifyAppointmentConfirmed(req.body);

    return res.status(200).json({
      message: "Appointment confirmation notification processed",
      result,
    });
  } catch (error) {
    console.error(
      "Appointment confirmation controller error:",
      error
    );

    return res.status(500).json({
      message: "Unable to send appointment confirmation",
    });
  }
};

const sendAppointmentCancellation = async (req, res) => {
  try {
    const result = await notifyAppointmentCancelled(req.body);

    return res.status(200).json({
      message: "Cancellation notification processed",
      result,
    });
  } catch (error) {
    console.error(
      "Appointment cancellation controller error:",
      error
    );

    return res.status(500).json({
      message: "Unable to send cancellation notification",
    });
  }
};

const sendMedicationReminderNotification = async (req, res) => {
  try {
    const { patient, prescription } = req.body;

    const result = await notifyMedicationReminder({
      patient,
      prescription,
    });

    return res.status(200).json({
      message: "Medication reminder processed",
      result,
    });
  } catch (error) {
    console.error(
      "Medication reminder controller error:",
      error
    );

    return res.status(500).json({
      message: "Unable to send medication reminder",
    });
  }
};

module.exports = {
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendMedicationReminderNotification,
};