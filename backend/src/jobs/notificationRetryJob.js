const { PrismaClient } = require("../../generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");
const {
  sendBookingConfirmation,
  sendCancellationEmail,
  sendMedicationReminder,
} = require("../services/emailService");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// ====================================================
// PROCESS PENDING NOTIFICATIONS
// ====================================================

const processPendingNotifications = async () => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        status: "PENDING",
        scheduledAt: {
          lte: new Date(),
        },
        attempts: {
          lt: 3,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        scheduledAt: "asc",
      },
      take: 20,
    });

    for (const notification of notifications) {
      await processNotification(notification);
    }
  } catch (error) {
    console.error(
      "Notification retry job error:",
      error.message
    );
  }
};

// ====================================================
// PROCESS ONE NOTIFICATION
// ====================================================

const processNotification = async (notification) => {
  try {
    // Mark as processing
    await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        status: "PROCESSING",
        attempts: {
          increment: 1,
        },
      },
    });

    let result;

    // --------------------------------------------------
    // BOOKING CONFIRMATION
    // --------------------------------------------------

    if (notification.type === "BOOKING_CONFIRMATION") {
      const appointment = await prisma.appointment.findFirst({
        where: {
          OR: [
            {
              patient: {
                userId: notification.userId,
              },
            },
            {
              doctor: {
                userId: notification.userId,
              },
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
          doctor: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new Error(
          "Appointment not found for booking notification"
        );
      }

      result = await sendBookingConfirmation({
        patientEmail: appointment.patient.user.email,
        doctorEmail: appointment.doctor.user.email,
        patientName:
          `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`.trim(),
        doctorName:
          `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`.trim(),
        startTime: appointment.startTime,
        endTime: appointment.endTime,
      });
    }

    // --------------------------------------------------
    // CANCELLATION
    // --------------------------------------------------

    else if (notification.type === "CANCELLATION") {
      const appointment = await prisma.appointment.findFirst({
        where: {
          OR: [
            {
              patient: {
                userId: notification.userId,
              },
            },
            {
              doctor: {
                userId: notification.userId,
              },
            },
          ],
        },
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
          doctor: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new Error(
          "Appointment not found for cancellation notification"
        );
      }

      result = await sendCancellationEmail({
        patientEmail: appointment.patient.user.email,
        doctorEmail: appointment.doctor.user.email,
        patientName:
          `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`.trim(),
        doctorName:
          `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`.trim(),
        startTime: appointment.startTime,
      });
    }

    // --------------------------------------------------
    // MEDICATION REMINDER
    // --------------------------------------------------

    else if (notification.type === "MEDICATION_REMINDER") {
      const reminder = await prisma.medicationReminder.findFirst({
        where: {
          reminderTime: {
            lte: new Date(),
          },
        },
        orderBy: {
          reminderTime: "asc",
        },
        include: {
          prescription: {
            include: {
              consultation: {
                include: {
                  appointment: {
                    include: {
                      patient: {
                        include: {
                          user: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!reminder) {
        throw new Error(
          "Medication reminder not found"
        );
      }

      const patient =
        reminder.prescription.consultation.appointment.patient;

      result = await sendMedicationReminder({
        patientEmail: patient.user.email,
        patientName:
          `${patient.user.firstName} ${patient.user.lastName}`.trim(),
        medicineName:
          reminder.prescription.medicineName,
        dosage:
          reminder.prescription.dosage,
        instructions:
          reminder.prescription.instructions,
      });
    }

    // --------------------------------------------------
    // UNKNOWN NOTIFICATION
    // --------------------------------------------------

    else {
      throw new Error(
        `Unsupported notification type: ${notification.type}`
      );
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        status: "SENT",
        sentAt: new Date(),
        lastError: null,
      },
    });

    console.log(
      `Notification ${notification.id} sent successfully`
    );

    return result;
  } catch (error) {
    console.error(
      `Notification ${notification.id} failed:`,
      error.message
    );

    const updatedNotification =
      await prisma.notification.findUnique({
        where: {
          id: notification.id,
        },
      });

    const attempts = updatedNotification?.attempts || 1;

    await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        status: attempts >= 3 ? "FAILED" : "PENDING",
        lastError: error.message,
        scheduledAt: new Date(
          Date.now() + 5 * 60 * 1000
        ),
      },
    });
  }
};

// ====================================================
// START RETRY JOB
// ====================================================

const startNotificationRetryJob = () => {
  console.log(
    "Notification retry job started"
  );

  // Run immediately
  processPendingNotifications();

  // Check every minute
  setInterval(
    processPendingNotifications,
    60 * 1000
  );
};

module.exports = {
  processPendingNotifications,
  processNotification,
  startNotificationRetryJob,
};