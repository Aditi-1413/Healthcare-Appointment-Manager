const callLLM = async (prompt) => {
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    console.warn("LLM_API_KEY is not configured.");
    return null;
  }

  try {
    const response = await fetch(process.env.LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an assistant for a healthcare appointment management system. Do not diagnose patients. Provide concise administrative/clinical summarization only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `LLM request failed: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    return (
      data?.choices?.[0]?.message?.content ||
      data?.output?.[0]?.content?.[0]?.text ||
      null
    );
  } catch (error) {
    console.error("LLM error:", error.message);

    // IMPORTANT:
    // LLM failure must never break the appointment system.
    return null;
  }
};


/*
====================================================
PRE-VISIT SUMMARY
====================================================
*/

const generatePreVisitSummary = async (symptoms) => {
  if (!symptoms || !symptoms.trim()) {
    return null;
  }

  const prompt = `
Analyse these patient symptoms.

Do NOT diagnose the patient.

Return the response in exactly this format:

Urgency: Low / Medium / High
Chief Complaint: <short description>
Suggested Questions:
1. <question>
2. <question>
3. <question>

Symptoms:
${symptoms.trim()}
`;

  return callLLM(prompt);
};

/*
====================================================
POST-VISIT SUMMARY
====================================================
*/

const generatePostVisitSummary = async (clinicalNotes) => {
  if (!clinicalNotes || !clinicalNotes.trim()) {
    return null;
  }

  const prompt = `
Convert these clinical notes into a patient-friendly summary.

Include:
1. What was discussed
2. Medication schedule
3. Follow-up steps

Do not add information that is not present in the notes.

Clinical notes:
${clinicalNotes}
`;

  return callLLM(prompt);
};


module.exports = {
  callLLM,
  generatePreVisitSummary,
  generatePostVisitSummary,
};