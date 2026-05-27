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
 * Use Lovable AI (Gemini) to recommend a specialization based on symptoms.
 * Returns specialization + short, friendly reasoning.
 */
export const recommendSpecialization = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        specialization: "General Practitioner",
        reason: "AI is not configured yet. A General Practitioner is a safe first stop for any concern.",
      };
    }

    const system = `You are Amity, a kind, careful triage assistant. You are NOT a doctor and never give a diagnosis. Given a patient's described symptoms, choose ONE specialization from this list that is most appropriate to consult first: ${SPECIALIZATIONS.join(", ")}. Reply ONLY with strict JSON: {"specialization": "<one of the list>", "reason": "<one short friendly sentence under 30 words, plain language>"}. If symptoms suggest a real emergency (chest pain with shortness of breath, stroke signs, severe bleeding, suicidal thoughts), still pick the closest specialization but begin reason with "Please call emergency services. ".`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: system },
            { role: "user", content: data.symptoms },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("AI gateway error", res.status, text);
        if (res.status === 429) throw new Error("Too many requests right now. Please try again in a minute.");
        if (res.status === 402) throw new Error("AI usage limit reached. Please add credits in workspace settings.");
        throw new Error("AI service unavailable.");
      }

      const json = await res.json();
      const content: string = json?.choices?.[0]?.message?.content ?? "{}";
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
