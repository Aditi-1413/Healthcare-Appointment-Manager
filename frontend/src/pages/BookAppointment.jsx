import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import Navbar from "../../components/Navbar";

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  // ==================================================
  // STATE
  // ==================================================

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);

  const [selectedSlot, setSelectedSlot] =
    useState(null);

  const [appointmentId, setAppointmentId] =
    useState(null);

  const [symptoms, setSymptoms] =
    useState("");

  const [summary, setSummary] =
    useState(null);

  const [loadingSlots, setLoadingSlots] =
    useState(false);

  const [holdingSlot, setHoldingSlot] =
    useState(false);

  const [submittingSymptoms, setSubmittingSymptoms] =
    useState(false);

  const [confirming, setConfirming] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==================================================
  // LOAD SLOTS
  // ==================================================

  const loadSlots = async () => {
    if (!date) {
      setError("Please select a date.");
      return;
    }

    setError("");
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);

    try {
      const response =
        await api.getDoctorSlots(
          doctorId,
          date
        );

      /*
       * Backend may return:
       *
       * {
       *   slots: [...]
       * }
       *
       * or directly [...]
       */

      const availableSlots =
        response.slots ||
        response.data ||
        response;

      setSlots(
        Array.isArray(availableSlots)
          ? availableSlots
          : []
      );

      if (
        !availableSlots ||
        availableSlots.length === 0
      ) {
        setError(
          "No available slots for this date."
        );
      }
    } catch (err) {
      console.error(
        "Load slots error:",
        err
      );

      setError(
        err.message ||
          "Unable to load available slots."
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  // ==================================================
  // HOLD SLOT
  // ==================================================

  const holdSlot = async (slot) => {
    if (appointmentId) {
      return;
    }

    setError("");
    setHoldingSlot(true);

    try {
      /*
       * Depending on backend response,
       * appointment may be directly returned
       * or inside appointment.
       */

      const response =
        await api.holdAppointment({
          doctorId: Number(doctorId),
          startTime: slot.startTime,
        });

      const appointment =
        response.appointment ||
        response.data ||
        response;

      const id =
        appointment.id ||
        response.appointmentId;

      if (!id) {
        throw new Error(
          "Appointment was created but no appointment ID was returned."
        );
      }

      setAppointmentId(id);
      setSelectedSlot(slot);

      alert(
        "Slot held successfully for 5 minutes. Please submit your symptoms."
      );
    } catch (err) {
      console.error(
        "Hold slot error:",
        err
      );

      setError(
        err.message ||
          "This slot is no longer available. Please select another slot."
      );
    } finally {
      setHoldingSlot(false);
    }
  };

  // ==================================================
  // SUBMIT SYMPTOMS
  // ==================================================

  const submitSymptoms = async () => {
    if (!appointmentId) {
      setError(
        "Please select and hold a slot first."
      );
      return;
    }

    if (!symptoms.trim()) {
      setError(
        "Please describe your symptoms before continuing."
      );
      return;
    }

    setError("");
    setSubmittingSymptoms(true);

    try {
      const response =
        await api.submitSymptoms(
          appointmentId,
          {
            symptoms:
              symptoms.trim(),
          }
        );

      /*
       * Expected backend response can contain:
       *
       * preVisitSummary
       *
       * or
       *
       * summary
       */

      const aiSummary =
        response.preVisitSummary ||
        response.summary ||
        response.data?.preVisitSummary ||
        response.data?.summary;

      setSummary(aiSummary);

      if (!aiSummary) {
        setSummary(
          "Symptoms submitted successfully. The AI summary is currently unavailable."
        );
      }
    } catch (err) {
      console.error(
        "Submit symptoms error:",
        err
      );

      /*
       * LLM failure should NOT break
       * the appointment system.
       *
       * The backend should handle the LLM
       * failure gracefully.
       */

      setError(
        err.message ||
          "Symptoms could not be submitted."
      );
    } finally {
      setSubmittingSymptoms(false);
    }
  };

  // ==================================================
  // CONFIRM APPOINTMENT
  // ==================================================

  const confirmAppointment = async () => {
    if (!appointmentId) {
      setError(
        "No appointment is currently held."
      );
      return;
    }

    if (!summary) {
      setError(
        "Please submit your symptoms before confirming the appointment."
      );
      return;
    }

    setError("");
    setConfirming(true);

    try {
      await api.confirmAppointment(
        appointmentId
      );

      alert(
        "Appointment confirmed successfully!"
      );

      navigate(
        "/patient/appointments"
      );
    } catch (err) {
      console.error(
        "Confirm appointment error:",
        err
      );

      setError(
        err.message ||
          "Unable to confirm appointment."
      );
    } finally {
      setConfirming(false);
    }
  };

  // ==================================================
  // FORMAT TIME
  // ==================================================

  const formatTime = (time) => {
    if (!time) return "";

    const dateObject =
      new Date(time);

    if (
      Number.isNaN(
        dateObject.getTime()
      )
    ) {
      return time;
    }

    return dateObject.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==================================================
  // MINIMUM DATE = TODAY
  // ==================================================

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  // ==================================================
  // UI
  // ==================================================

  return (
    <>
      <Navbar />

      <main className="container">
        <h1>Book Appointment</h1>

        <p className="subtitle">
          Select a date and available slot,
          then describe your symptoms before
          confirming your appointment.
        </p>

        {/* =========================================
            ERROR
        ========================================== */}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* =========================================
            DATE SELECTION
        ========================================== */}

        <div className="booking-card">
          <h2>1. Select Date</h2>

          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setError("");
              setSlots([]);
              setSelectedSlot(null);
              setAppointmentId(null);
              setSummary(null);
            }}
          />

          <button
            className="primary-btn"
            onClick={loadSlots}
            disabled={
              !date ||
              loadingSlots
            }
          >
            {loadingSlots
              ? "Loading..."
              : "Check Available Slots"}
          </button>
        </div>

        {/* =========================================
            AVAILABLE SLOTS
        ========================================== */}

        {slots.length > 0 && (
          <div className="slots">
            <h2>
              2. Select Available Slot
            </h2>

            <p className="subtitle">
              Select a slot to hold it for
              5 minutes.
            </p>

            <div>
              {slots.map(
                (slot, index) => {
                  const isSelected =
                    selectedSlot ===
                    slot;

                  const isAvailable =
                    slot.available !==
                      false &&
                    slot.status !==
                      "BOOKED";

                  return (
                    <button
                      key={
                        slot.id ||
                        index
                      }
                      className={
                        isSelected
                          ? "slot selected"
                          : "slot"
                      }
                      disabled={
                        !isAvailable ||
                        holdingSlot ||
                        !!appointmentId
                      }
                      onClick={() =>
                        holdSlot(slot)
                      }
                    >
                      {formatTime(
                        slot.startTime
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* =========================================
            HELD SLOT
        ========================================== */}

        {appointmentId && (
          <div className="booking-card">
            <h2>
              Slot Held Successfully
            </h2>

            <p>
              Appointment ID:{" "}
              <strong>
                {appointmentId}
              </strong>
            </p>

            {selectedSlot && (
              <p>
                Selected time:{" "}
                <strong>
                  {formatTime(
                    selectedSlot.startTime
                  )}
                </strong>
              </p>
            )}

            <p>
              Your slot is temporarily held.
              Please submit your symptoms
              before the hold expires.
            </p>
          </div>
        )}

        {/* =========================================
            SYMPTOMS
        ========================================== */}

        {appointmentId && (
          <div className="booking-card">
            <h2>
              3. Describe Your Symptoms
            </h2>

            <p className="subtitle">
              Tell the doctor what you are
              experiencing. This information
              will be summarized by AI for the
              doctor before your visit.
            </p>

            <textarea
              rows="7"
              placeholder="Example: I have been experiencing fever, headache and sore throat for the last two days..."
              value={symptoms}
              onChange={(e) =>
                setSymptoms(
                  e.target.value
                )
              }
              disabled={
                submittingSymptoms ||
                !!summary
              }
            />

            {!summary && (
              <button
                className="primary-btn"
                onClick={
                  submitSymptoms
                }
                disabled={
                  !symptoms.trim() ||
                  submittingSymptoms
                }
              >
                {submittingSymptoms
                  ? "Generating AI Summary..."
                  : "Submit Symptoms & Generate AI Summary"}
              </button>
            )}
          </div>
        )}

        {/* =========================================
            AI SUMMARY
        ========================================== */}

        {summary && (
          <div className="booking-card">
            <h2>
              4. AI Pre-Visit Summary
            </h2>

            <div className="ai-summary">
              <h3>
                Summary for Doctor
              </h3>

              {typeof summary ===
              "string" ? (
                <pre>
                  {summary}
                </pre>
              ) : (
                <>
                  {summary.urgency && (
                    <p>
                      <strong>
                        Urgency:
                      </strong>{" "}
                      {summary.urgency}
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

                  {!summary.urgency &&
                    !summary.chiefComplaint &&
                    !summary.suggestedQuestions && (
                      <pre>
                        {JSON.stringify(
                          summary,
                          null,
                          2
                        )}
                      </pre>
                    )}
                </>
              )}
            </div>
          </div>
        )}

        {/* =========================================
            CONFIRM
        ========================================== */}

        {appointmentId &&
          summary && (
            <div className="booking-card">
              <h2>
                5. Confirm Appointment
              </h2>

              <p>
                Your symptoms have been
                submitted and the AI
                pre-visit summary has been
                generated.
              </p>

              <button
                className="success-btn"
                onClick={
                  confirmAppointment
                }
                disabled={
                  confirming
                }
              >
                {confirming
                  ? "Confirming..."
                  : "Confirm Appointment"}
              </button>
            </div>
          )}
      </main>
    </>
  );
}