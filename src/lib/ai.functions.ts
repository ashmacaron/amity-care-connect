import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  symptoms: z.string().min(3).max(2000),
});

const SPECIALIZATIONS = [
  "General Practitioner",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "Psychiatrist",
  "Orthopedic",
];

/**
 * Use Google Gemini API directly to recommend a specialization based on symptoms.
 * Returns specialization + short, friendly reasoning.
 */
export const recommendSpecialization = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    // 1. Update the environment variable key
    //  Change this block at the top of your .handler(async ({ data }) => { ... })
    const apiKey = process.env.GEMINI_API_KEY || (globalThis as any).MINIFLARE_DATA?.env?.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("API Key missing, falling back to General Practitioner");
      return {
        specialization: "General Practitioner",
        reason: "AI is not configured yet. A General Practitioner is a safe first stop for any concern.",
      };
    }

    const systemInstruction = `You are Amity, a kind, careful triage assistant. You are NOT a doctor and never give a diagnosis. Given a patient's described symptoms, choose ONE specialization from this list that is most appropriate to consult first: ${SPECIALIZATIONS.join(", ")}. Reply ONLY with strict JSON: {"specialization": "<one of the list>", "reason": "<one short friendly sentence under 30 words, plain language>"}. If symptoms suggest a real emergency (chest pain with shortness of breath, stroke signs, severe bleeding, suicidal thoughts), still pick the closest specialization but begin reason with "Please call emergency services. ".`;

    try {
      // 2. Direct Google Gemini endpoint (using gemini-2.5-flash as the standard stable model)
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Move system prompt into systemInstruction array per Gemini's API spec
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: data.symptoms }],
            },
          ],
          generationConfig: {
            // Enforce structured JSON output
            responseMimeType: "application/json",
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Gemini API error", res.status, text);
        if (res.status === 429) throw new Error("Too many requests right now. Please try again in a minute.");
        throw new Error("AI service unavailable.");
      }

      const json = await res.json();
      
      // 3. Update data extraction mapping to handle Gemini's response schema
      const content = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      const parsed = JSON.parse(content);
      
      const specialization = SPECIALIZATIONS.includes(parsed.specialization)
        ? parsed.specialization
        : "General Practitioner";
        
      return {
        specialization,
        reason: typeof parsed.reason === "string" ? parsed.reason : "A good first step for what you described.",
      };
    } catch (err) {
      console.error("AI recommend failed", err);
      return {
        specialization: "General Practitioner",
        reason: "We couldn't reach the AI just now. A General Practitioner can guide you to the right specialist.",
      };
    }
  });
