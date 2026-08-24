const cron = require("node-cron");

const { PrismaClient } = require("../../generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");

const {
  notifyMedicationReminder,
} = require("../services/notificationService");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const processMedicationReminders = async () => {
  try {
    const now = new Date();

    const reminders = await prisma.medicationReminder.findMany({
      where: {
        reminderTime: {
          lte: now,
        },
        status: "PENDING",
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

    for (const reminder of reminders) {
      try {
        const prescription = reminder.prescription;

        const patient =
          prescription?.consultation?.appointment?.patient;

        if (!patient) {
          console.error(
            `Patient not found for reminder ${reminder.id}`
          );

          await prisma.medicationReminder.update({
            where: {
              id: reminder.id,
            },
            data: {
              status: "FAILED",
            },
          });

          continue;
        }

        const result = await notifyMedicationReminder({
          patient,
          prescription,
        });

        if (result?.success !== false) {
          await prisma.medicationReminder.update({
            where: {
              id: reminder.id,
            },
            data: {
              status: "SENT",
            },
          });

          console.log(
            `Medication reminder ${reminder.id} sent successfully`
          );
        } else {
          await prisma.medicationReminder.update({
            where: {
              id: reminder.id,
            },
            data: {
              status: "FAILED",
            },
          });

          console.error(
            `Medication reminder ${reminder.id} failed:`,
            result?.error
          );
        }
      } catch (error) {
        console.error(
          `Failed medication reminder ${reminder.id}:`,
          error.message
        );

        await prisma.medicationReminder.update({
          where: {
            id: reminder.id,
          },
          data: {
            status: "FAILED",
          },
        });
      }
    }
  } catch (error) {
    console.error(
      "Medication reminder job failed:",
      error.message
    );
  }
};

const startMedicationReminderJob = () => {
  cron.schedule("* * * * *", async () => {
    await processMedicationReminders();
  });

  console.log(
    "Medication reminder background job started"
  );
};

module.exports = {
  startMedicationReminderJob,
  processMedicationReminders,
};