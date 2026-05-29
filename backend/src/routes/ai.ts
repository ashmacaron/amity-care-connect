import { Router } from "express";
import { requireAuth } from "../middleware/auth";

export const aiRouter = Router();

const SPECIALIZATIONS = [
  "General Practitioner", "Cardiologist", "Dermatologist",
  "Pediatrician", "Psychiatrist", "Orthopedic",
];

const SYSTEM_PROMPT = `You are Amity, a kind, careful triage assistant. You are NOT a doctor and never give a diagnosis. Given a patient's described symptoms, choose ONE specialization from this list that is most appropriate to consult first: ${SPECIALIZATIONS.join(", ")}. Reply ONLY with strict JSON: {"specialization": "<one of the list>", "reason": "<one short friendly sentence under 30 words, plain language>"}. If symptoms suggest a real emergency (chest pain with shortness of breath, stroke signs, severe bleeding, suicidal thoughts), still pick the closest specialization but begin reason with "Please call emergency services. ".`;

aiRouter.post("/recommend", requireAuth, async (req, res) => {
  const { symptoms } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.json({
      specialization: "General Practitioner",
      reason: "AI is not configured. A General Practitioner is a safe first stop.",
    });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: symptoms }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error", geminiRes.status, errText);
      if (geminiRes.status === 429) {
        return res.json({
          specialization: "General Practitioner",
          reason: "Too many requests right now. A General Practitioner is a safe first step while you wait.",
        });
      }
      throw new Error("AI service unavailable.");
    }

    const json = await geminiRes.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const parsed = JSON.parse(text);

    const specialization = SPECIALIZATIONS.includes(parsed.specialization)
      ? parsed.specialization
      : "General Practitioner";

    const reason = typeof parsed.reason === "string" && parsed.reason.trim().length > 0
      ? parsed.reason
      : `Based on your symptoms, a ${specialization} would be the right doctor to consult first.`;

    res.json({ specialization, reason });
  } catch (err) {
    console.error("Gemini error:", err);
    res.json({
      specialization: "General Practitioner",
      reason: "We couldn't reach the AI just now. A General Practitioner can guide you to the right specialist.",
    });
  }
});
