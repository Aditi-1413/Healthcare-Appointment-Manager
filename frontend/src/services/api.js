const API_BASE_URL = "http://localhost:5000/api";

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  const contentType =
    response.headers.get("content-type");

  let data;

  if (
    contentType &&
    contentType.includes("application/json")
  ) {
    data = await response.json();
  } else {
    const text = await response.text();

    data = {
      message:
        text || "Unexpected server response",
    };
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

export const api = {
  // ==================================================
  // AUTHENTICATION
  // ==================================================

  register: (data) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () =>
    request("/auth/me"),

  // ==================================================
  // DOCTORS
  // ==================================================

  getDoctors: (specialization = "") => {
    const query = specialization
      ? `?specialization=${encodeURIComponent(
          specialization
        )}`
      : "";

    return request(`/doctors${query}`);
  },

  getDoctorSlots: (doctorId, date) =>
    request(
      `/doctors/${doctorId}/slots?date=${encodeURIComponent(
        date
      )}`
    ),

  // ==================================================
  // APPOINTMENTS
  // ==================================================

  holdAppointment: (data) =>
    request("/appointments/hold", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // IMPORTANT:
  // symptoms must be submitted before confirmation
  submitSymptoms: (appointmentId, data) =>
    request(
      `/appointments/${appointmentId}/symptoms`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  confirmAppointment: (appointmentId) =>
    request(
      `/appointments/${appointmentId}/confirm`,
      {
        method: "POST",
      }
    ),

  cancelAppointment: (appointmentId) =>
    request(
      `/appointments/${appointmentId}/cancel`,
      {
        method: "POST",
      }
    ),

  getMyAppointments: () =>
    request("/appointments/my"),

  getDoctorAppointments: () =>
    request("/appointments/doctor"),

  // ==================================================
  // CONSULTATION
  // ==================================================

  createConsultation: (
    appointmentId,
    data
  ) =>
    request(
      `/appointments/${appointmentId}/consultation`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  createPostVisitSummary: (
    appointmentId,
    data
  ) =>
    request(
      `/appointments/${appointmentId}/post-visit-summary`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  createPrescription: (
    appointmentId,
    data
  ) =>
    request(
      `/appointments/${appointmentId}/prescription`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  // ==================================================
  // MEDICATION REMINDER
  // ==================================================

  createMedicationReminder: (
    prescriptionId,
    data
  ) =>
    request(
      `/appointments/prescriptions/${prescriptionId}/reminder`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  // ==================================================
  // PATIENT
  // ==================================================

  getMedicalRecord: () =>
    request("/patients/me"),
};

export default api;