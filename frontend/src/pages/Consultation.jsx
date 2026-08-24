import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import Navbar from "../../components/Navbar";

export default function Consultation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [clinicalNotes, setClinicalNotes] =
    useState("");

  const [medicineName, setMedicineName] =
    useState("");

  const [dosage, setDosage] =
    useState("");

  const [frequency, setFrequency] =
    useState("");

  const [durationDays, setDurationDays] =
    useState("");

  const [instructions, setInstructions] =
    useState("");

  const [savingConsultation, setSavingConsultation] =
    useState(false);

  const [savingPrescription, setSavingPrescription] =
    useState(false);

  const [generatingSummary, setGeneratingSummary] =
    useState(false);

  const [summary, setSummary] =
    useState(null);

  const [prescriptionId, setPrescriptionId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==================================================
  // SAVE CONSULTATION
  // ==================================================

  const saveConsultation = async () => {
    if (!clinicalNotes.trim()) {
      setError(
        "Please enter clinical notes."
      );
      return;
    }

    try {
      setError("");
      setSuccess("");
      setSavingConsultation(true);

      await api.createConsultation(
        appointmentId,
        {
          clinicalNotes:
            clinicalNotes.trim(),
        }
      );

      setSuccess(
        "Consultation notes saved successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to save consultation."
      );
    } finally {
      setSavingConsultation(false);
    }
  };

  // ==================================================
  // CREATE PRESCRIPTION
  // ==================================================

  const savePrescription = async () => {
    if (!medicineName.trim()) {
      setError(
        "Please enter the medicine name."
      );
      return;
    }

    if (!dosage.trim()) {
      setError(
        "Please enter the dosage."
      );
      return;
    }

    if (!frequency.trim()) {
      setError(
        "Please enter the frequency."
      );
      return;
    }

    try {
      setError("");
      setSuccess("");
      setSavingPrescription(true);

      const response =
        await api.createPrescription(
          appointmentId,
          {
            medicineName:
              medicineName.trim(),

            dosage:
              dosage.trim(),

            frequency:
              frequency.trim(),

            durationDays: durationDays
              ? Number(durationDays)
              : undefined,

            instructions:
              instructions.trim(),
          }
        );

      const prescription =
        response.prescription ||
        response.data ||
        response;

      setPrescriptionId(
        prescription?.id ||
          response.prescriptionId ||
          null
      );

      setSuccess(
        "Prescription saved successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to save prescription."
      );
    } finally {
      setSavingPrescription(false);
    }
  };

  // ==================================================
  // GENERATE POST-VISIT SUMMARY
  // ==================================================

  const generateSummary = async () => {
    if (!clinicalNotes.trim()) {
      setError(
        "Clinical notes are required to generate the summary."
      );
      return;
    }

    try {
      setError("");
      setSuccess("");
      setGeneratingSummary(true);

      const response =
        await api.createPostVisitSummary(
          appointmentId,
          {
            notes:
              clinicalNotes.trim(),
          }
        );

      const generated =
        response.postVisitSummary ||
        response.summary ||
        response.data?.postVisitSummary ||
        response.data?.summary ||
        response.data ||
        response;

      setSummary(generated);

      setSuccess(
        "Patient-friendly summary generated."
      );
    } catch (err) {
      console.error(err);

      /*
       * The backend should gracefully handle
       * LLM failures. Even if the LLM fails,
       * the consultation itself should remain
       * saved.
       */

      setError(
        err.message ||
          "Unable to generate post-visit summary."
      );
    } finally {
      setGeneratingSummary(false);
    }
  };

  // ==================================================
  // MEDICATION REMINDER
  // ==================================================

  const createReminder = async () => {
    if (!prescriptionId) {
      setError(
        "Save a prescription first."
      );
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.createMedicationReminder(
        prescriptionId,
        {
          reminderTime: "09:00",
        }
      );

      setSuccess(
        "Medication reminder created successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to create medication reminder."
      );
    }
  };

  // ==================================================
  // COMPLETE
  // ==================================================

  const finishConsultation = () => {
    navigate("/doctor/dashboard");
  };

  return (
    <>
      <Navbar />

      <main className="container">
        <div className="page-header">
          <div>
            <h1>
              Patient Consultation
            </h1>

            <p className="subtitle">
              Appointment #{appointmentId}
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={() =>
              navigate(
                "/doctor/dashboard"
              )
            }
          >
            Back to Dashboard
          </button>
        </div>

        {/* =========================================
            ERROR
        ========================================== */}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* =========================================
            SUCCESS
        ========================================== */}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {/* =========================================
            CLINICAL NOTES
        ========================================== */}

        <section className="booking-card">
          <h2>
            1. Clinical Notes
          </h2>

          <p className="subtitle">
            Enter your clinical observations,
            diagnosis and treatment plan.
          </p>

          <textarea
            rows="10"
            placeholder="Enter clinical notes here..."
            value={clinicalNotes}
            onChange={(e) =>
              setClinicalNotes(
                e.target.value
              )
            }
          />

          <button
            className="primary-btn"
            onClick={
              saveConsultation
            }
            disabled={
              savingConsultation
            }
          >
            {savingConsultation
              ? "Saving..."
              : "Save Consultation"}
          </button>
        </section>

        {/* =========================================
            PRESCRIPTION
        ========================================== */}

        <section className="booking-card">
          <h2>
            2. Prescription
          </h2>

          <div className="form-grid">
            <div>
              <label>
                Medicine Name
              </label>

              <input
                type="text"
                placeholder="Paracetamol"
                value={medicineName}
                onChange={(e) =>
                  setMedicineName(
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>
                Dosage
              </label>

              <input
                type="text"
                placeholder="500 mg"
                value={dosage}
                onChange={(e) =>
                  setDosage(
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>
                Frequency
              </label>

              <input
                type="text"
                placeholder="Twice daily"
                value={frequency}
                onChange={(e) =>
                  setFrequency(
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>
                Duration (days)
              </label>

              <input
                type="number"
                min="1"
                placeholder="5"
                value={durationDays}
                onChange={(e) =>
                  setDurationDays(
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          <label>
            Instructions
          </label>

          <textarea
            rows="4"
            placeholder="Take after food..."
            value={instructions}
            onChange={(e) =>
              setInstructions(
                e.target.value
              )
            }
          />

          <button
            className="primary-btn"
            onClick={
              savePrescription
            }
            disabled={
              savingPrescription
            }
          >
            {savingPrescription
              ? "Saving..."
              : "Save Prescription"}
          </button>

          {prescriptionId && (
            <button
              className="secondary-btn"
              onClick={
                createReminder
              }
            >
              Create Medication Reminder
            </button>
          )}
        </section>

        {/* =========================================
            POST VISIT SUMMARY
        ========================================== */}

        <section className="booking-card">
          <h2>
            3. Patient-Friendly Summary
          </h2>

          <p className="subtitle">
            AI converts the clinical notes
            into an easy-to-understand
            summary for the patient.
          </p>

          <button
            className="primary-btn"
            onClick={
              generateSummary
            }
            disabled={
              generatingSummary ||
              !clinicalNotes.trim()
            }
          >
            {generatingSummary
              ? "Generating..."
              : "Generate Patient Summary"}
          </button>

          {summary && (
            <div className="ai-summary">
              <h3>
                Post-Visit Summary
              </h3>

              {typeof summary ===
              "string" ? (
                <p>{summary}</p>
              ) : (
                <>
                  {summary.summary && (
                    <p>
                      {summary.summary}
                    </p>
                  )}

                  {summary.medicationSchedule && (
                    <div>
                      <h4>
                        Medication Schedule
                      </h4>

                      <p>
                        {
                          summary.medicationSchedule
                        }
                      </p>
                    </div>
                  )}

                  {summary.followUp && (
                    <div>
                      <h4>
                        Follow-up
                      </h4>

                      <p>
                        {
                          summary.followUp
                        }
                      </p>
                    </div>
                  )}

                  {!summary.summary &&
                    !summary.medicationSchedule &&
                    !summary.followUp && (
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
          )}
        </section>

        {/* =========================================
            FINISH
        ========================================== */}

        <section className="booking-card">
          <h2>
            Consultation Complete
          </h2>

          <p>
            Make sure consultation notes,
            prescription and patient summary
            have been saved.
          </p>

          <button
            className="success-btn"
            onClick={
              finishConsultation
            }
          >
            Finish & Return to Dashboard
          </button>
        </section>
      </main>
    </>
  );
}