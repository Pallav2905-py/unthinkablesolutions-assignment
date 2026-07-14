import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

/**
 * Generate pre-visit AI summary from patient symptoms
 * @param {string} symptoms - Patient's symptom description
 * @returns {Promise<{urgencyLevel: string, chiefComplaint: string, suggestedQuestions: string[], raw: string} | null>}
 */
export async function generatePreVisitSummary(symptoms) {
  try {
    const prompt = `Analyse these symptoms and return a JSON object with exactly these fields:
- urgencyLevel: one of "Low", "Medium", or "High"  
- chiefComplaint: a brief (max 20 words) statement of the primary complaint
- suggestedQuestions: an array of exactly 3 questions the doctor should ask

Return ONLY valid JSON, no markdown, no explanation.

Symptoms: ${symptoms}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      temperature: 0.7,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
      reasoning_effort: 'medium',
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) return null;

    // Strip markdown code fences if present
    const cleaned = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      urgencyLevel: parsed.urgencyLevel || 'Medium',
      chiefComplaint: parsed.chiefComplaint || 'General consultation',
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
        ? parsed.suggestedQuestions.slice(0, 3)
        : [],
      raw: content,
    };
  } catch (error) {
    console.error('[Groq] Pre-visit summary failed:', error.message);
    return null; // Graceful degradation — never throw
  }
}

/**
 * Generate patient-friendly post-visit summary from clinical notes
 * @param {string} clinicalNotes - Doctor's clinical notes
 * @param {Array} prescription - Array of prescription items
 * @returns {Promise<string | null>}
 */
export async function generatePostVisitSummary(clinicalNotes, prescription = []) {
  try {
    const prescriptionText = prescription.length
      ? prescription
          .map((p) => `${p.medication} ${p.dosage} — ${p.frequency} for ${p.duration}`)
          .join(', ')
      : 'No medications prescribed';

    const prompt = `Convert these clinical notes into a patient-friendly summary. 
Use simple, clear language a patient can understand. Include:
1. What was diagnosed / found
2. Medication schedule (from prescription: ${prescriptionText})
3. Follow-up steps and lifestyle advice
4. When to seek emergency care (if applicable)

Keep it warm, reassuring, and under 300 words.

Clinical Notes: ${clinicalNotes}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      temperature: 0.8,
      max_completion_tokens: 2048,
      top_p: 1,
      stream: false,
      reasoning_effort: 'medium',
    });

    return completion.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('[Groq] Post-visit summary failed:', error.message);
    return null;
  }
}
