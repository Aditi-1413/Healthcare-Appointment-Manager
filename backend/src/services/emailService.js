const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASSWORD
  ) {
    console.warn("Email configuration is missing.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  return transporter;
};


const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  try {
    const mailer = getTransporter();

    if (!mailer) {
      return {
        success: false,
        error: "Email service is not configured",
      };
    }

    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email error:", error.message);

    // Do not break appointment operations.
    return {
      success: false,
      error: error.message,
    };
  }
};


const sendBookingConfirmation = async ({
  patientEmail,
  doctorEmail,
  patientName,
  doctorName,
  startTime,
  endTime,
}) => {
  const subject = "Appointment Confirmation";

  const text = `
Hello,

Your healthcare appointment has been confirmed.

Patient: ${patientName}
Doctor: ${doctorName}

Start: ${new Date(startTime).toLocaleString()}
End: ${new Date(endTime).toLocaleString()}

Thank you.
`;

  const results = [];

  if (patientEmail) {
    results.push(
      await sendEmail({
        to: patientEmail,
        subject,
        text,
      })
    );
  }

  if (doctorEmail) {
    results.push(
      await sendEmail({
        to: doctorEmail,
        subject,
        text,
      })
    );
  }

  return results;
};


const sendCancellationEmail = async ({
  patientEmail,
  doctorEmail,
  patientName,
  doctorName,
  startTime,
}) => {
  const subject = "Appointment Cancelled";

  const text = `
Hello,

The following healthcare appointment has been cancelled.

Patient: ${patientName}
Doctor: ${doctorName}
Appointment: ${new Date(startTime).toLocaleString()}

Please book another appointment if required.
`;

  const results = [];

  if (patientEmail) {
    results.push(
      await sendEmail({
        to: patientEmail,
        subject,
        text,
      })
    );
  }

  if (doctorEmail) {
    results.push(
      await sendEmail({
        to: doctorEmail,
        subject,
        text,
      })
    );
  }

  return results;
};


const sendMedicationReminder = async ({
  patientEmail,
  patientName,
  medicineName,
  dosage,
  instructions,
}) => {
  return sendEmail({
    to: patientEmail,
    subject: `Medication Reminder: ${medicineName}`,
    text: `
Hello ${patientName},

This is your medication reminder.

Medicine: ${medicineName}
Dosage: ${dosage}

${instructions || ""}

Please follow the prescription provided by your doctor.
`,
  });
};


module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendCancellationEmail,
  sendMedicationReminder,
};