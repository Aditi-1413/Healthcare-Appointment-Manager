const {
  hashPassword,
  generateToken,
} = require("../utils/auth");

const { PrismaClient } = require("../../generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const registerPatient = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        message:
          "Email, password, first name and last name are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: "PATIENT",

        patient: {
          create: {
            dateOfBirth: dateOfBirth
              ? new Date(dateOfBirth)
              : null,
          },
        },
      },
      include: {
        patient: true,
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: "Patient registered successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        patientId: user.patient.id,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Unable to register patient",
    });
  }
};

module.exports = {
  registerPatient,
};