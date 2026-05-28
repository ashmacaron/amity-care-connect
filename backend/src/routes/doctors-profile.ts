import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";

export const doctorProfileRouter = Router();

doctorProfileRouter.get("/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM doctors WHERE user_id = $1",
      [req.user!.id]
    );
    res.json(rows[0] ?? null);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch doctor profile" });
  }
});

doctorProfileRouter.post("/me", requireAuth, async (req, res) => {
  try {
    const { full_name, specialization, bio, years_experience, consultation_fee } = req.body;
    const { rows } = await db.query(
      `INSERT INTO doctors (user_id, full_name, specialization, bio, years_experience, consultation_fee)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         specialization = EXCLUDED.specialization,
         bio = EXCLUDED.bio,
         years_experience = EXCLUDED.years_experience,
         consultation_fee = EXCLUDED.consultation_fee
       RETURNING *`,
      [req.user!.id, full_name, specialization, bio, years_experience, consultation_fee]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to save doctor profile" });
  }
});
