const { PrismaClient } = require("../../generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const createDoctor = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      specialization,
      slotDuration,
      workingHours,
    } = req.body;

    // Validate required fields
    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !specialization ||
      !slotDuration
    ) {
      return res.status(400).json({
        message:
          "Email, password, first name, last name, specialization and slot duration are required",
      });
    }

    // Check whether email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    // Hash password
    const bcrypt = require("bcryptjs");

    const passwordHash = await bcrypt.hash(password, 10);

    // Create doctor and user together
    const doctor = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: "DOCTOR",

        doctor: {
          create: {
            specialization,
            slotDuration: Number(slotDuration),

            workingHours: workingHours
              ? {
                  create: workingHours.map((hour) => ({
                    dayOfWeek: Number(hour.dayOfWeek),
                    startTime: hour.startTime,
                    endTime: hour.endTime,
                  })),
                }
              : undefined,
          },
        },
      },

      include: {
        doctor: {
          include: {
            workingHours: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Doctor created successfully",

      doctor: {
        id: doctor.doctor.id,
        userId: doctor.id,
        email: doctor.email,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        phone: doctor.phone,
        specialization: doctor.doctor.specialization,
        slotDuration: doctor.doctor.slotDuration,
        workingHours: doctor.doctor.workingHours,
      },
    });
  } catch (error) {
    console.error("Create doctor error:", error);

    return res.status(500).json({
      message: "Unable to create doctor",
    });
  }
};
const getDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;

    const where = specialization
      ? {
          specialization: {
            contains: specialization,
            mode: "insensitive",
          },
        }
      : {};

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        workingHours: true,
        leaves: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      doctors,
    });
  } catch (error) {
    console.error("Get doctors error:", error);

    return res.status(500).json({
      message: "Unable to fetch doctors",
    });
  }
};
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "Date is required. Use YYYY-MM-DD format",
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        id: Number(doctorId),
      },
      include: {
        workingHours: true,
        leaves: true,
        appointments: {
          where: {
            startTime: {
              gte: new Date(`${date}T00:00:00.000Z`),
            },
            endTime: {
              lte: new Date(`${date}T23:59:59.999Z`),
            },
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    // Convert requested date into a JavaScript date
    const requestedDate = new Date(`${date}T00:00:00`);

    // JavaScript: Sunday = 0, Monday = 1, ..., Saturday = 6
    const dayOfWeek = requestedDate.getDay();

    // Check whether doctor is on leave
    const isOnLeave = doctor.leaves.some((leave) => {
      const leaveDate = new Date(leave.leaveDate);

      return (
        leaveDate.getUTCFullYear() === requestedDate.getFullYear() &&
        leaveDate.getUTCMonth() === requestedDate.getMonth() &&
        leaveDate.getUTCDate() === requestedDate.getDate()
      );
    });

    if (isOnLeave) {
      return res.status(200).json({
        doctorId: doctor.id,
        date,
        slots: [],
        message: "Doctor is on leave",
      });
    }

    // Find working hours for this day
    const workingHour = doctor.workingHours.find(
      (hour) => hour.dayOfWeek === dayOfWeek
    );

    if (!workingHour) {
      return res.status(200).json({
        doctorId: doctor.id,
        date,
        slots: [],
        message: "Doctor is not available on this day",
      });
    }

    const slots = [];

    const [startHour, startMinute] = workingHour.startTime
      .split(":")
      .map(Number);

    const [endHour, endMinute] = workingHour.endTime
      .split(":")
      .map(Number);

    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    while (currentMinutes + doctor.slotDuration <= endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;

      const slotStart = new Date(
        `${date}T${String(hours).padStart(2, "0")}:${String(
          minutes
        ).padStart(2, "0")}:00`
      );

      const slotEnd = new Date(
        slotStart.getTime() + doctor.slotDuration * 60 * 1000
      );

      // Check whether this slot overlaps an existing appointment
      const isBooked = doctor.appointments.some((appointment) => {
        const appointmentStart = new Date(appointment.startTime);
        const appointmentEnd = new Date(appointment.endTime);

        return (
          slotStart < appointmentEnd &&
          slotEnd > appointmentStart
        );
      });

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available: !isBooked,
      });

      currentMinutes += doctor.slotDuration;
    }

    return res.status(200).json({
      doctorId: doctor.id,
      date,
      slotDuration: doctor.slotDuration,
      workingHours: {
        startTime: workingHour.startTime,
        endTime: workingHour.endTime,
      },
      slots,
    });
  } catch (error) {
    console.error("Get available slots error:", error);

    return res.status(500).json({
      message: "Unable to fetch available slots",
    });
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  getAvailableSlots,  
};