const { PrismaClient } = require("../../generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const addDoctorLeave = async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);
    const { leaveDate, reason } = req.body;

    if (!doctorId || !leaveDate) {
      return res.status(400).json({
        message: "Doctor ID and leave date are required",
      });
    }

    // Check doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    // Normalize leave date to midnight
    const date = new Date(leaveDate);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Invalid leave date",
      });
    }

    date.setHours(0, 0, 0, 0);

    // Check if leave already exists
    const existingLeave = await prisma.doctorLeave.findUnique({
      where: {
        doctorId_leaveDate: {
          doctorId,
          leaveDate: date,
        },
      },
    });

    if (existingLeave) {
      return res.status(409).json({
        message: "Doctor is already marked on leave for this date",
      });
    }

    // Find appointments on that date
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const affectedAppointments = await prisma.appointment.findMany({
  where: {
    doctorId,
    startTime: {
      gte: date,
      lt: nextDate,
    },
    status: {
      in: ["HELD", "CONFIRMED"],
    },
  },
  include: {
    patient: true,
  },
});

    // Create leave + cancel affected appointments
    const result = await prisma.$transaction(async (tx) => {
      const leave = await tx.doctorLeave.create({
        data: {
          doctorId,
          leaveDate: date,
          reason: reason || null,
        },
      });

      if (affectedAppointments.length > 0) {
        await tx.appointment.updateMany({
          where: {
            id: {
              in: affectedAppointments.map(
                (appointment) => appointment.id
              ),
            },
          },
          data: {
            status: "CANCELLED",
          },
        });
      }

      // Create notifications for affected patients
      if (affectedAppointments.length > 0) {
        await tx.notification.createMany({
          data: affectedAppointments.map((appointment) => ({
            userId: appointment.patient.userId,
            type: "DOCTOR_LEAVE_APPOINTMENT_CANCELLED",
            status: "PENDING",
            scheduledAt: new Date(),
          })),
        });
      }

      return leave;
    });

    return res.status(201).json({
      message: "Doctor leave added successfully",
      leave: result,
      affectedAppointments: affectedAppointments.length,
    });
  } catch (error) {
    console.error("Add doctor leave error:", error);

    return res.status(500).json({
      message: "Unable to add doctor leave",
    });
  }
};

module.exports = {
  addDoctorLeave,
};