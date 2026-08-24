import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import Navbar from "../../components/Navbar";

export default function MyAppointments() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.getMyAppointments();

      const data =
        response.appointments ||
        response.data ||
        response;

      setAppointments(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Unable to load appointments."
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) return;

    try {
      setCancelling(id);
      setError("");

      await api.cancelAppointment(id);

      alert(
        "Appointment cancelled successfully."
      );

      await loadAppointments();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to cancel appointment."
      );
    } finally {
      setCancelling(null);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "status confirmed";

      case "CANCELLED":
        return "status cancelled";

      case "COMPLETED":
        return "status completed";

      case "HELD":
        return "status held";

      default:
        return "status";
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="container">
          <h1>My Appointments</h1>
          <p>Loading appointments...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="container">
        <div className="page-header">
          <div>
            <h1>My Appointments</h1>

            <p className="subtitle">
              View your upcoming and previous
              appointments.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() =>
              navigate("/patient/doctors")
            }
          >
            Book New Appointment
          </button>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {appointments.length === 0 ? (
          <div className="booking-card">
            <h2>No appointments found</h2>

            <p>
              You don't have any appointments
              yet.
            </p>

            <button
              className="primary-btn"
              onClick={() =>
                navigate("/patient/doctors")
              }
            >
              Find a Doctor
            </button>
          </div>
        ) : (
          <div className="appointments-list">
            {appointments.map(
              (appointment) => {
                const doctor =
                  appointment.doctor;

                const doctorName =
                  doctor?.user?.name ||
                  doctor?.name ||
                  appointment.doctorName ||
                  "Doctor";

                const specialization =
                  doctor?.specialization ||
                  doctor?.specialisation ||
                  "";

                const startTime =
                  appointment.startTime ||
                  appointment.scheduledAt ||
                  appointment.date;

                const isCancelled =
                  appointment.status ===
                  "CANCELLED";

                const isCompleted =
                  appointment.status ===
                  "COMPLETED";

                return (
                  <div
                    className="appointment-card"
                    key={
                      appointment.id
                    }
                  >
                    <div className="appointment-header">
                      <div>
                        <h2>
                          Dr. {doctorName}
                        </h2>

                        {specialization && (
                          <p>
                            {specialization}
                          </p>
                        )}
                      </div>

                      <span
                        className={getStatusClass(
                          appointment.status
                        )}
                      >
                        {
                          appointment.status
                        }
                      </span>
                    </div>

                    <div className="appointment-info">
                      <p>
                        <strong>
                          Appointment:
                        </strong>{" "}
                        {formatDateTime(
                          startTime
                        )}
                      </p>

                      <p>
                        <strong>
                          Appointment ID:
                        </strong>{" "}
                        {appointment.id}
                      </p>
                    </div>

                    {/* ==========================
                        SYMPTOMS
                    =========================== */}

                    {appointment
                      .symptomReport && (
                      <div className="section">
                        <h3>
                          Symptoms
                        </h3>

                        <p>
                          {appointment
                            .symptomReport
                            .symptoms ||
                            appointment
                              .symptomReport}
                        </p>
                      </div>
                    )}

                    {/* ==========================
                        PRE-VISIT SUMMARY
                    =========================== */}

                    {appointment
                      .preVisitSummary && (
                      <div className="section ai-section">
                        <h3>
                          AI Pre-Visit Summary
                        </h3>

                        {typeof appointment.preVisitSummary ===
                        "string" ? (
                          <p>
                            {
                              appointment.preVisitSummary
                            }
                          </p>
                        ) : (
                          <pre>
                            {JSON.stringify(
                              appointment.preVisitSummary,
                              null,
                              2
                            )}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* ==========================
                        POST-VISIT SUMMARY
                    =========================== */}

                    {appointment
                      .postVisitSummary && (
                      <div className="section summary-section">
                        <h3>
                          Post-Visit Summary
                        </h3>

                        {typeof appointment.postVisitSummary ===
                        "string" ? (
                          <p>
                            {
                              appointment.postVisitSummary
                            }
                          </p>
                        ) : (
                          <pre>
                            {JSON.stringify(
                              appointment.postVisitSummary,
                              null,
                              2
                            )}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* ==========================
                        PRESCRIPTIONS
                    =========================== */}

                    {appointment
                      .prescriptions &&
                      appointment.prescriptions
                        .length > 0 && (
                        <div className="section">
                          <h3>
                            Prescription
                          </h3>

                          {appointment.prescriptions.map(
                            (
                              prescription
                            ) => (
                              <div
                                className="prescription"
                                key={
                                  prescription.id
                                }
                              >
                                <p>
                                  <strong>
                                    Medicine:
                                  </strong>{" "}
                                  {prescription.medicineName ||
                                    prescription.name ||
                                    "N/A"}
                                </p>

                                <p>
                                  <strong>
                                    Dosage:
                                  </strong>{" "}
                                  {prescription.dosage ||
                                    "N/A"}
                                </p>

                                <p>
                                  <strong>
                                    Frequency:
                                  </strong>{" "}
                                  {prescription.frequency ||
                                    "N/A"}
                                </p>

                                {prescription.durationDays && (
                                  <p>
                                    <strong>
                                      Duration:
                                    </strong>{" "}
                                    {
                                      prescription.durationDays
                                    }{" "}
                                    days
                                  </p>
                                )}

                                {prescription.instructions && (
                                  <p>
                                    <strong>
                                      Instructions:
                                    </strong>{" "}
                                    {
                                      prescription.instructions
                                    }
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {/* ==========================
                        ACTIONS
                    =========================== */}

                    {!isCancelled &&
                      !isCompleted && (
                        <div className="appointment-actions">
                          <button
                            className="danger-btn"
                            disabled={
                              cancelling ===
                              appointment.id
                            }
                            onClick={() =>
                              cancelAppointment(
                                appointment.id
                              )
                            }
                          >
                            {cancelling ===
                            appointment.id
                              ? "Cancelling..."
                              : "Cancel Appointment"}
                          </button>
                        </div>
                      )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </main>
    </>
  );
}