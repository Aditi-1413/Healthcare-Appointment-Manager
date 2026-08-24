const { PrismaClient } = require("../../generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

/*
====================================================
GET PATIENT MEDICAL RECORD
GET /api/patients/me
====================================================
*/
const getMyMedicalRecord = async (req, res) => {
  try {
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({
        message: "Only patients can access this record",
      });
    }

    const patient = await prisma.patient.findUnique({
      where: {
        userId: req.user.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },

        appointments: {
          orderBy: {
            startTime: "desc",
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

            symptomReport: true,

            preVisitSummary: true,

            consultation: {
              include: {
                postVisitSummary: true,
                prescriptions: {
                  include: {
                    medications: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    return res.status(200).json({
      patient: {
        id: patient.id,
        userId: patient.user.id,
        email: patient.user.email,
        firstName: patient.user.firstName,
        lastName: patient.user.lastName,
        phone: patient.user.phone,
        dateOfBirth: patient.dateOfBirth,
      },

      appointments: patient.appointments,
    });
  } catch (error) {
    console.error("Get patient medical record error:", error);

    return res.status(500).json({
      message: "Unable to fetch medical record",
    });
  }
};

module.exports = {
  getMyMedicalRecord,
};