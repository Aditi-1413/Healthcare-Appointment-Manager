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

module.exports = {
  createDoctor,
};