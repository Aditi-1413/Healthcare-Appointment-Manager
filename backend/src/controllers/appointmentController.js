const { PrismaClient } = require("../../generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// --------------------------------------------------
// HOLD AN APPOINTMENT SLOT
// --------------------------------------------------

const holdAppointment = async (req, res) => {
  try {
    const { doctorId, startTime } = req.body;

    if (!doctorId || !startTime) {
      return res.status(400).json({
        message: "doctorId and startTime are required",
      });
    }

    // Only patients can hold appointments
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({
        message: "Only patients can book appointments",
      });
    }

    // Find patient associated with logged-in user
    const patient = await prisma.patient.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    // Find doctor
    const doctor = await prisma.doctor.findUnique({
      where: {
        id: Number(doctorId),
      },
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    const slotStart = new Date(startTime);

    if (isNaN(slotStart.getTime())) {
      return res.status(400).json({
        message: "Invalid startTime",
      });
    }

    const slotEnd = new Date(
      slotStart.getTime() + doctor.slotDuration * 60 * 1000
    );

    // Check whether doctor is on leave
    const leave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId: doctor.id,
        leaveDate: {
          gte: new Date(
            `${slotStart.toISOString().slice(0, 10)}T00:00:00.000Z`
          ),
          lt: new Date(
            `${slotStart.toISOString().slice(0, 10)}T00:00:00.000Z`
          ).getTime() + 24 * 60 * 60 * 1000,
        },
      },
    });

    if (leave) {
      return res.status(409).json({
        message: "Doctor is on leave on this date",
      });
    }

    // Check whether the slot is already occupied
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        startTime: slotStart,
        status: {
          in: ["HELD", "CONFIRMED"],
        },
      },
    });

    if (existingAppointment) {
      return res.status(409).json({
        message: "This appointment slot is already booked",
      });
    }

    // Hold expires after 5 minutes
    const holdExpiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        startTime: slotStart,
        endTime: slotEnd,
        status: "HELD",
        holdExpiresAt,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      message: "Appointment slot held successfully",
      appointment,
    });
  } catch (error) {
    console.error("Hold appointment error:", error);

    // Prisma unique constraint
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "This appointment slot is already booked",
      });
    }

    return res.status(500).json({
      message: "Unable to hold appointment",
    });
  }
};

// --------------------------------------------------
// CONFIRM APPOINTMENT
// --------------------------------------------------

const confirmAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (req.user.role !== "PATIENT") {
      return res.status(403).json({
        message: "Only patients can confirm appointments",
      });
    }

    const patient = await prisma.patient.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: Number(appointmentId),
      },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (appointment.patientId !== patient.id) {
      return res.status(403).json({
        message: "You cannot confirm this appointment",
      });
    }

    if (appointment.status !== "HELD") {
      return res.status(409).json({
        message: "Appointment is not currently held",
      });
    }

    if (
      appointment.holdExpiresAt &&
      appointment.holdExpiresAt < new Date()
    ) {
      await prisma.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: "EXPIRED",
        },
      });

      return res.status(409).json({
        message: "Appointment hold has expired",
      });
    }

    const confirmedAppointment =
      await prisma.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: "CONFIRMED",
          holdExpiresAt: null,
        },
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

    return res.status(200).json({
      message: "Appointment confirmed successfully",
      appointment: confirmedAppointment,
    });
  } catch (error) {
    console.error("Confirm appointment error:", error);

    return res.status(500).json({
      message: "Unable to confirm appointment",
    });
  }
};

// --------------------------------------------------
// GET PATIENT APPOINTMENTS
// --------------------------------------------------

const getMyAppointments = async (req, res) => {
  try {
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({
        message: "Only patients can access this endpoint",
      });
    }

    const patient = await prisma.patient.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patient.id,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return res.status(200).json({
      appointments,
    });
  } catch (error) {
    console.error("Get appointments error:", error);

    return res.status(500).json({
      message: "Unable to fetch appointments",
    });
  }
};

// --------------------------------------------------
// CANCEL APPOINTMENT
// --------------------------------------------------

const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (req.user.role !== "PATIENT") {
      return res.status(403).json({
        message: "Only patients can cancel appointments",
      });
    }

    const patient = await prisma.patient.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: Number(appointmentId),
      },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (appointment.patientId !== patient.id) {
      return res.status(403).json({
        message: "You cannot cancel this appointment",
      });
    }

    if (
      appointment.status === "CANCELLED" ||
      appointment.status === "COMPLETED"
    ) {
      return res.status(409).json({
        message: "Appointment cannot be cancelled",
      });
    }

    const cancelledAppointment =
      await prisma.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: "CANCELLED",
          holdExpiresAt: null,
        },
      });

    return res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment: cancelledAppointment,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);

    return res.status(500).json({
      message: "Unable to cancel appointment",
    });
  }
};

module.exports = {
  holdAppointment,
  confirmAppointment,
  getMyAppointments,
  cancelAppointment,
};