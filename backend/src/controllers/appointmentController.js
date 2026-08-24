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
GET MY APPOINTMENTS
GET /api/appointments/my
====================================================
*/
const getMyAppointments = async (req, res) => {
  try {
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({
        message: "Only patients can view their appointments",
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
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        symptomReport: true,
        preVisitSummary: true,
        consultation: {
          include: {
            postVisitSummary: true,
            prescriptions: true,
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
    console.error("Get my appointments error:", error);

    return res.status(500).json({
      message: "Unable to fetch appointments",
    });
  }
};

/*
====================================================
HOLD APPOINTMENT SLOT
POST /api/appointments/hold
====================================================
*/
const holdAppointment = async (req, res) => {
  try {
    const { doctorId, startTime } = req.body;

    // Validate request
    if (!doctorId || !startTime) {
      return res.status(400).json({
        message: "doctorId and startTime are required",
      });
    }

    // Only patients can book appointments
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({
        message: "Only patients can book appointments",
      });
    }

    // Find patient profile
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
      include: {
        workingHours: true,
        leaves: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    // Convert start time
    const slotStart = new Date(startTime);

    if (isNaN(slotStart.getTime())) {
      return res.status(400).json({
        message: "Invalid startTime",
      });
    }

    // Prevent past bookings
    if (slotStart <= new Date()) {
      return res.status(400).json({
        message: "Cannot book an appointment in the past",
      });
    }

    // Calculate end time
    const slotEnd = new Date(
      slotStart.getTime() + doctor.slotDuration * 60 * 1000
    );

    /*
    ------------------------------------------------
    CHECK WORKING DAY
    ------------------------------------------------
    */
    const dayOfWeek = slotStart.getDay();

    const workingHour = doctor.workingHours.find(
      (hour) => hour.dayOfWeek === dayOfWeek
    );

    if (!workingHour) {
      return res.status(400).json({
        message: "Doctor is not available on this day",
      });
    }

    /*
    ------------------------------------------------
    CHECK WORKING HOURS
    ------------------------------------------------
    */

    const [startHour, startMinute] = workingHour.startTime
      .split(":")
      .map(Number);

    const [endHour, endMinute] = workingHour.endTime
      .split(":")
      .map(Number);

    const requestedMinutes =
      slotStart.getHours() * 60 + slotStart.getMinutes();

    const workingStartMinutes =
      startHour * 60 + startMinute;

    const workingEndMinutes =
      endHour * 60 + endMinute;

    const slotEndMinutes =
      requestedMinutes + doctor.slotDuration;

    if (
      requestedMinutes < workingStartMinutes ||
      slotEndMinutes > workingEndMinutes
    ) {
      return res.status(400).json({
        message: "Selected slot is outside doctor's working hours",
      });
    }

    /*
    ------------------------------------------------
    CHECK SLOT ALIGNMENT
    ------------------------------------------------
    */

    if (
      (requestedMinutes - workingStartMinutes) %
        doctor.slotDuration !==
      0
    ) {
      return res.status(400).json({
        message: "Invalid appointment slot",
      });
    }

    /*
    ------------------------------------------------
    CHECK DOCTOR LEAVE
    ------------------------------------------------
    */

    const requestedYear = slotStart.getFullYear();
    const requestedMonth = slotStart.getMonth();
    const requestedDay = slotStart.getDate();

    const isOnLeave = doctor.leaves.some((leave) => {
      const leaveDate = new Date(leave.leaveDate);

      return (
        leaveDate.getFullYear() === requestedYear &&
        leaveDate.getMonth() === requestedMonth &&
        leaveDate.getDate() === requestedDay
      );
    });

    if (isOnLeave) {
      return res.status(409).json({
        message: "Doctor is on leave on this date",
      });
    }

    /*
    ------------------------------------------------
    CHECK EXISTING APPOINTMENT
    ------------------------------------------------
    */

    const existingAppointment =
      await prisma.appointment.findUnique({
        where: {
          doctorId_startTime: {
            doctorId: doctor.id,
            startTime: slotStart,
          },
        },
      });

    if (existingAppointment) {
      /*
      If an old HELD appointment has expired,
      mark it as EXPIRED.
      */

      if (
        existingAppointment.status === "HELD" &&
        existingAppointment.holdExpiresAt &&
        existingAppointment.holdExpiresAt < new Date()
      ) {
        await prisma.appointment.update({
          where: {
            id: existingAppointment.id,
          },
          data: {
            status: "EXPIRED",
          },
        });
      } else {
        return res.status(409).json({
          message: "This appointment slot is already booked",
        });
      }
    }

    /*
    ------------------------------------------------
    HOLD SLOT FOR 5 MINUTES
    ------------------------------------------------
    */

    const holdExpiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    /*
    ------------------------------------------------
    CREATE APPOINTMENT
    ------------------------------------------------
    */

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
                id: true,
                firstName: true,
                lastName: true,
                email: true,
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

    /*
    Prisma unique constraint error.
    This protects against duplicate bookings.
    */

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

/*
====================================================
CONFIRM APPOINTMENT
POST /api/appointments/:id/confirm
====================================================
*/
const confirmAppointment = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);

    if (!appointmentId) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

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
        id: appointmentId,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    // Make sure appointment belongs to logged-in patient
    if (appointment.patientId !== patient.id) {
      return res.status(403).json({
        message: "You cannot confirm this appointment",
      });
    }
    const symptomReport =
  await prisma.symptomReport.findUnique({
    where: {
      appointmentId: appointment.id,
    },
  });

if (!symptomReport) {
  return res.status(400).json({
    message:
      "Please submit your symptoms before confirming the appointment",
  });
}

    // Appointment must currently be HELD
    if (appointment.status !== "HELD") {
      return res.status(400).json({
        message: `Appointment cannot be confirmed because its status is ${appointment.status}`,
      });
    }

    // Check hold expiration
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

    // Confirm appointment
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
    id: true,
    firstName: true,
    lastName: true,
    email: true,
  },
},
            },
          },
        },
      });
    
      await prisma.notification.createMany({
  data: [
    {
      userId: patient.userId,
      type: "BOOKING_CONFIRMATION",
      status: "PENDING",
      scheduledAt: new Date(),
    },
    {
      userId: confirmedAppointment.doctor.userId,
      type: "BOOKING_CONFIRMATION",
      status: "PENDING",
      scheduledAt: new Date(),
    },
  ],
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

/*
====================================================
CANCEL APPOINTMENT
POST /api/appointments/:id/cancel
====================================================
*/
const cancelAppointment = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);

    if (!appointmentId) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

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
        id: appointmentId,
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
      return res.status(400).json({
        message: `Appointment cannot be cancelled because its status is ${appointment.status}`,
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
await prisma.notification.createMany({
  data: [
    {
      userId: patient.userId,
      type: "CANCELLATION",
      status: "PENDING",
      scheduledAt: new Date(),
    },
    {
      userId: cancelledAppointment.doctor.userId,
      type: "CANCELLATION",
      status: "PENDING",
      scheduledAt: new Date(),
    },
  ],
});
/*
====================================================
GET DOCTOR APPOINTMENTS
GET /api/appointments/doctor
====================================================
*/
const getDoctorAppointments = async (req, res) => {
  try {
    // Only doctors can access this endpoint
    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({
        message: "Only doctors can view doctor appointments",
      });
    }

    // Find doctor profile
    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor profile not found",
      });
    }

    // Get doctor's appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
      },
      include: {
        patient: {
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
          },
        },
        symptomReport: true,
        preVisitSummary: true,
        consultation: {
          include: {
            postVisitSummary: true,
            prescriptions: true,
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
    console.error("Get doctor appointments error:", error);

    return res.status(500).json({
      message: "Unable to fetch doctor appointments",
    });
  }
};
/*
====================================================
CREATE CONSULTATION
POST /api/appointments/:id/consultation
====================================================
*/
const createConsultation = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const { clinicalNotes } = req.body;

    // Validate appointment ID
    if (!appointmentId) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    // Validate clinical notes
    if (!clinicalNotes || !clinicalNotes.trim()) {
      return res.status(400).json({
        message: "Clinical notes are required",
      });
    }

    // Only doctors can create consultations
    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({
        message: "Only doctors can create consultations",
      });
    }

    // Find doctor
    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor profile not found",
      });
    }

    // Find appointment
    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        consultation: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    // Make sure appointment belongs to this doctor
    if (appointment.doctorId !== doctor.id) {
      return res.status(403).json({
        message: "You cannot access this appointment",
      });
    }

    // Appointment must be confirmed
    if (appointment.status !== "CONFIRMED") {
      return res.status(400).json({
        message:
          "Consultation can only be created for a confirmed appointment",
      });
    }

    // Prevent duplicate consultation
    if (appointment.consultation) {
      return res.status(409).json({
        message: "Consultation already exists",
      });
    }

    // Create consultation and complete appointment
    const result = await prisma.$transaction(async (tx) => {
      const consultation = await tx.consultation.create({
        data: {
          appointmentId,
          clinicalNotes: clinicalNotes.trim(),
        },
      });

      const updatedAppointment =
        await tx.appointment.update({
          where: {
            id: appointmentId,
          },
          data: {
            status: "COMPLETED",
          },
        });

      return {
        consultation,
        appointment: updatedAppointment,
      };
    });

    return res.status(201).json({
      message: "Consultation created successfully",
      consultation: result.consultation,
      appointment: result.appointment,
    });
  } catch (error) {
    console.error("Create consultation error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Consultation already exists",
      });
    }

    return res.status(500).json({
      message: "Unable to create consultation",
    });
  }
};
const createPostVisitSummary = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);

    if (!appointmentId) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    const { summary, followUpSteps } = req.body;

    // Find the appointment and consultation
    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        consultation: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (!appointment.consultation) {
      return res.status(400).json({
        message: "Consultation not found for this appointment",
      });
    }

    // Only doctors should create post-visit summaries
   if (req.user.role !== "DOCTOR") {
  return res.status(403).json({
    message: "Only doctors can create post-visit summaries",
  });
}

const doctor = await prisma.doctor.findUnique({
  where: {
    userId: req.user.userId,
  },
});

if (!doctor) {
  return res.status(403).json({
    message: "Doctor profile not found",
  });
}

if (appointment.doctorId !== doctor.id) {
  return res.status(403).json({
    message: "You are not authorized to access this appointment",
  });
}
    // Import LLM service
    const {
      generatePostVisitSummary,
    } = require("../services/llmService");

    let aiSummary = null;

    // Generate AI summary safely
    try {
      aiSummary = await generatePostVisitSummary(
        appointment.consultation.clinicalNotes
      );
    } catch (llmError) {
      console.error("LLM post-visit summary failed:", llmError);

      // LLM failure should NOT break the appointment workflow
      aiSummary = null;
    }

    // Use AI-generated summary if available.
    // Otherwise use the manually supplied summary.
    const finalSummary = aiSummary || summary || null;

    // Save summary in database
    const postVisitSummary =
      await prisma.postVisitSummary.upsert({
        where: {
          consultationId: appointment.consultation.id,
        },
        update: {
          summary: finalSummary,
          followUpSteps: followUpSteps || null,
        },
        create: {
          consultationId: appointment.consultation.id,
          summary: finalSummary,
          followUpSteps: followUpSteps || null,
        },
      });

    return res.status(201).json({
      message: "Post-visit summary created successfully",
      postVisitSummary,
    });
  } catch (error) {
    console.error(
      "Create post-visit summary error:",
      error
    );

    return res.status(500).json({
      message: "Unable to create post-visit summary",
    });
  }
};
const createPrescription = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);

    const {
      medicineName,
      dosage,
      frequency,
      durationDays,
      instructions,
    } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    if (
      !medicineName ||
      !dosage ||
      !frequency ||
      !durationDays
    ) {
      return res.status(400).json({
        message:
          "Medicine name, dosage, frequency and duration are required",
      });
    }

    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({
        message: "Only doctors can create prescriptions",
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor profile not found",
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        consultation: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (appointment.doctorId !== doctor.id) {
      return res.status(403).json({
        message: "You cannot access this appointment",
      });
    }

    if (appointment.status !== "COMPLETED") {
      return res.status(400).json({
        message: "Appointment must be completed first",
      });
    }

    if (!appointment.consultation) {
      return res.status(400).json({
        message: "Consultation must be created first",
      });
    }

    const prescription = await prisma.prescription.create({
      data: {
        consultationId: appointment.consultation.id,
        medicineName: medicineName.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        durationDays: Number(durationDays),
        instructions: instructions
          ? instructions.trim()
          : null,
      },
    });

    return res.status(201).json({
      message: "Prescription created successfully",
      prescription,
    });
  } catch (error) {
    console.error("Create prescription error:", error);

    return res.status(500).json({
      message: "Unable to create prescription",
    });
  }
};
const createMedicationReminder = async (req, res) => {
  try {
    const prescriptionId = Number(req.params.prescriptionId);
    const { reminderTime } = req.body;

    if (!prescriptionId) {
      return res.status(400).json({
        message: "Invalid prescription ID",
      });
    }

    if (!reminderTime) {
      return res.status(400).json({
        message: "Reminder time is required",
      });
    }

    if (req.user.role !== "PATIENT") {
      return res.status(403).json({
        message: "Only patients can create medication reminders",
      });
    }

    const prescription = await prisma.prescription.findUnique({
      where: {
        id: prescriptionId,
      },
      include: {
        consultation: {
          include: {
            appointment: true,
          },
        },
      },
    });

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found",
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

    if (
      prescription.consultation.appointment.patientId !==
      patient.id
    ) {
      return res.status(403).json({
        message: "You cannot access this prescription",
      });
    }

    const reminder = await prisma.medicationReminder.create({
      data: {
        prescriptionId,
        reminderTime: new Date(reminderTime),
        status: "PENDING",
      },
    });

    return res.status(201).json({
      message: "Medication reminder created successfully",
      reminder,
    });
  } catch (error) {
    console.error(
      "Create medication reminder error:",
      error
    );

    return res.status(500).json({
      message: "Unable to create medication reminder",
    });
  }
};
const {
  generatePreVisitSummary,
} = require("../services/llmService");
const createSymptomReport = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const { symptoms } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    if (!symptoms || !symptoms.trim()) {
      return res.status(400).json({
        message: "Symptoms are required",
      });
    }

    if (req.user.role !== "PATIENT") {
      return res.status(403).json({
        message: "Only patients can submit symptoms",
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
        id: appointmentId,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (appointment.patientId !== patient.id) {
      return res.status(403).json({
        message: "You cannot access this appointment",
      });
    }

    const existing = await prisma.symptomReport.findUnique({
      where: {
        appointmentId,
      },
    });

    if (existing) {
      return res.status(409).json({
        message: "Symptoms have already been submitted",
        symptomReport: existing,
      });
    }

    const summary = await generatePreVisitSummary(
      symptoms.trim()
    );

    const symptomReport = await prisma.symptomReport.create({
      data: {
        appointmentId,
        symptoms: symptoms.trim(),
      },
    });

    let preVisitSummary = null;

    if (summary) {
      preVisitSummary =
        await prisma.preVisitSummary.create({
          data: {
            appointmentId,
            summary,
          },
        });
    }

    return res.status(201).json({
      message: "Symptoms submitted successfully",
      symptomReport,
      preVisitSummary,
      llmGenerated: Boolean(summary),
    });
  } catch (error) {
    console.error(
      "Create symptom report error:",
      error
    );

    return res.status(500).json({
      message: "Unable to submit symptoms",
    });
  }
};
module.exports = {
  getMyAppointments,
  holdAppointment,
  confirmAppointment,
  cancelAppointment,
  createSymptomReport,
  createMedicationReminder,
  createPrescription,
  createConsultation,
    getDoctorAppointments,
    createPostVisitSummary,
};