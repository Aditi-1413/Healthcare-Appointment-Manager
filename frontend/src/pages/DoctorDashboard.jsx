import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import Navbar from "../../components/Navbar";

export default function DoctorDashboard() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.getDoctorAppointments();

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

  const getPatientName = (appointment) => {
    return (
      appointment.patient?.user?.name ||
      appointment.patient?.name ||
      appointment.patientName ||
      "Patient"
    );
  };

  const getSymptoms = (appointment) => {
    const report =
      appointment.symptomReport;

    if (!report) {
      return "No symptoms submitted.";
    }

    if (typeof report === "string") {
      return report;
    }

    return (
      report.symptoms ||
      report.description ||
      "No symptoms submitted."
    );
  };

  const getUrgency = (summary) => {
    if (!summary) return null;

    if (typeof summary === "string") {
      const match = summary.match(
        /urgency\s*[:\-]\s*(low|medium|high)/i
      );

      return match
        ? match[1]
        : null;
    }

    return (
      summary.urgency ||
      summary.urgencyLevel ||
      null
    );
  };

  const startConsultation = (appointment) => {
    navigate(
      `/doctor/appointments/${appointment.id}/consultation`
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="container">
          <h1>Doctor Dashboard</h1>
          <p>
            Loading appointments...
          </p>
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
            <h1>
              Doctor Dashboard
            </h1>

            <p className="subtitle">
              Review your upcoming
              appointments and patient
              information.
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={loadAppointments}
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* =====================================
            STATISTICS
        ====================================== */}

        <div className="stats-grid">
          <div className="stat-card">
            <h3>
              Total Appointments
            </h3>

            <p>
              {appointments.length}
            </p>
          </div>

          <div className="stat-card">
            <h3>
              Confirmed
            </h3>

            <p>
              {
                appointments.filter(
                  (a) =>
                    a.status ===
                    "CONFIRMED"
                ).length
              }
            </p>
          </div>

          <div className="stat-card">
            <h3>
              Completed
            </h3>

            <p>
              {
                appointments.filter(
                  (a) =>
                    a.status ===
                    "COMPLETED"
                ).length
              }
            </p>
          </div>
        </div>

        {/* =====================================
            APPOINTMENTS
        ====================================== */}

        <section>
          <h2>
            Patient Appointments
          </h2>

          {appointments.length ===
          0 ? (
            <div className="booking-card">
              <h3>
                No appointments
              </h3>

              <p>
                You currently have no
                appointments.
              </p>
            </div>
          ) : (
            <div className="doctor-appointments">
              {appointments.map(
                (appointment) => {
                  const summary =
                    appointment.preVisitSummary;

                  const urgency =
                    getUrgency(summary);

                  const completed =
                    appointment.status ===
                    "COMPLETED";

                  const cancelled =
                    appointment.status ===
                    "CANCELLED";

                  return (
                    <article
                      className="appointment-card"
                      key={
                        appointment.id
                      }
                    >
                      {/* HEADER */}

                      <div className="appointment-header">
                        <div>
                          <h2>
                            {getPatientName(
                              appointment
                            )}
                          </h2>

                          <p>
                            Appointment #
                            {
                              appointment.id
                            }
                          </p>
                        </div>

                        <span
                          className={`status ${
                            appointment.status?.toLowerCase() ||
                            ""
                          }`}
                        >
                          {
                            appointment.status
                          }
                        </span>
                      </div>

                      {/* DATE */}

                      <div className="appointment-info">
                        <p>
                          <strong>
                            Date & Time:
                          </strong>{" "}
                          {formatDateTime(
                            appointment.startTime ||
                              appointment.scheduledAt ||
                              appointment.date
                          )}
                        </p>
                      </div>

                      {/* =================================
                          SYMPTOMS
                      ================================== */}

                      <div className="section">
                        <h3>
                          Patient Symptoms
                        </h3>

                        <p>
                          {getSymptoms(
                            appointment
                          )}
                        </p>
                      </div>

                      {/* =================================
                          AI SUMMARY
                      ================================== */}

                      <div className="section ai-section">
                        <div className="section-title">
                          <h3>
                            AI Pre-Visit Summary
                          </h3>

                          {urgency && (
                            <span
                              className={`urgency ${urgency.toLowerCase()}`}
                            >
                              {urgency}{" "}
                              Urgency
                            </span>
                          )}
                        </div>

                        {!summary ? (
                          <p>
                            AI summary is not
                            available yet.
                          </p>
                        ) : typeof summary ===
                          "string" ? (
                          <p>
                            {summary}
                          </p>
                        ) : (
                          <div>
                            {summary.urgency && (
                              <p>
                                <strong>
                                  Urgency:
                                </strong>{" "}
                                {
                                  summary.urgency
                                }
                              </p>
                            )}

                            {summary.chiefComplaint && (
                              <p>
                                <strong>
                                  Chief Complaint:
                                </strong>{" "}
                                {
                                  summary.chiefComplaint
                                }
                              </p>
                            )}

                            {summary.chief_complaint && (
                              <p>
                                <strong>
                                  Chief Complaint:
                                </strong>{" "}
                                {
                                  summary.chief_complaint
                                }
                              </p>
                            )}

                            {summary.suggestedQuestions && (
                              <div>
                                <strong>
                                  Suggested Questions:
                                </strong>

                                <ol>
                                  {summary.suggestedQuestions.map(
                                    (
                                      question,
                                      index
                                    ) => (
                                      <li
                                        key={
                                          index
                                        }
                                      >
                                        {
                                          question
                                        }
                                      </li>
                                    )
                                  )}
                                </ol>
                              </div>
                            )}

                            {!summary.chiefComplaint &&
                              !summary.chief_complaint &&
                              !summary.suggestedQuestions && (
                                <pre>
                                  {JSON.stringify(
                                    summary,
                                    null,
                                    2
                                  )}
                                </pre>
                              )}
                          </div>
                        )}
                      </div>

                      {/* =================================
                          POST VISIT SUMMARY
                      ================================== */}

                      {appointment.postVisitSummary && (
                        <div className="section">
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

                      {/* =================================
                          ACTION
                      ================================== */}

                      {!cancelled &&
                        !completed && (
                          <div className="appointment-actions">
                            <button
                              className="primary-btn"
                              onClick={() =>
                                startConsultation(
                                  appointment
                                )
                              }
                            >
                              Start Consultation
                            </button>
                          </div>
                        )}

                      {completed && (
                        <div className="success-message">
                          Consultation completed.
                        </div>
                      )}

                      {cancelled && (
                        <div className="error">
                          This appointment was
                          cancelled.
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}