import { Router } from "express";
import { requireAuth } from "../middleware/auth";

export const aiRouter = Router();

const SPECIALIZATIONS = [
  "General Practitioner", "Cardiologist", "Dermatologist",
  "Pediatrician", "Psychiatrist", "Orthopedic",
];

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: `You are Amity, a kind triage assistant. Given symptoms, choose ONE specialization from: ${SPECIALIZATIONS.join(", ")}. Reply ONLY with JSON: {"specialization": "<one of the list>", "reason": "<one friendly sentence under 30 words>"}` }]
          },
          contents: [{ role: "user", parts: [{ text: symptoms }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    const json = await geminiRes.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const parsed = JSON.parse(text);
    const specialization = SPECIALIZATIONS.includes(parsed.specialization)
      ? parsed.specialization : "General Practitioner";

    res.json({ specialization, reason: parsed.reason ?? "A good first step." });
  } catch (err) {
    console.error("Gemini error:", err);
    res.json({
      specialization: "General Practitioner",
      reason: "Couldn't reach AI. A General Practitioner can guide you.",
    });
  }
});
