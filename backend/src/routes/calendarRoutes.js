const {
  sendBookingConfirmation,
  sendCancellationEmail,
  sendMedicationReminder,
} = require("./emailService");

const notifyAppointmentConfirmed = async (appointment) => {
  try {
    const patient = appointment.patient?.user;
    const doctor = appointment.doctor?.user;

    if (!patient && !doctor) {
      return {
        success: false,
        error: "Patient and doctor information not found",
      };
    }

    return await sendBookingConfirmation({
      patientEmail: patient?.email,
      doctorEmail: doctor?.email,

      patientName:
        `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim(),

      doctorName:
        `${doctor?.firstName || ""} ${doctor?.lastName || ""}`.trim(),

      startTime: appointment.startTime,
      endTime: appointment.endTime,
    });
  } catch (error) {
    console.error(
      "Appointment confirmation notification failed:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

const notifyAppointmentCancelled = async (appointment) => {
  try {
    const patient = appointment.patient?.user;
    const doctor = appointment.doctor?.user;

    return await sendCancellationEmail({
      patientEmail: patient?.email,
      doctorEmail: doctor?.email,

      patientName:
        `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim(),

      doctorName:
        `${doctor?.firstName || ""} ${doctor?.lastName || ""}`.trim(),

      startTime: appointment.startTime,
    });
  } catch (error) {
    console.error(
      "Appointment cancellation notification failed:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

const notifyMedicationReminder = async ({
  patient,
  prescription,
}) => {
  try {
    if (!patient?.user?.email) {
      return {
        success: false,
        error: "Patient email not found",
      };
    }

    return await sendMedicationReminder({
      patientEmail: patient.user.email,

      patientName:
        `${patient.user.firstName || ""} ${patient.user.lastName || ""}`.trim(),

      medicineName: prescription.medicineName,
      dosage: prescription.dosage,
      instructions: prescription.instructions,
    });
  } catch (error) {
    console.error(
      "Medication notification failed:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
  notifyMedicationReminder,
};