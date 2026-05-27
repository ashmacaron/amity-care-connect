import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";

export const profilesRouter = Router();

// GET /api/profiles/me
profilesRouter.get("/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM profiles WHERE id = $1",
      [req.user!.id]
    );
    res.json(rows[0] ?? null);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// POST /api/profiles/me — upsert
profilesRouter.post("/me", requireAuth, async (req, res) => {
  try {
    const { full_name, birthday, weight_kg, height_cm, phone, address, medical_history } = req.body;
    const { rows } = await db.query(
      `INSERT INTO profiles (id, full_name, birthday, weight, height, phone, address, medical_history)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         birthday = EXCLUDED.birthday,
         weight = EXCLUDED.weight,
         height = EXCLUDED.height,
         phone = EXCLUDED.phone,
         address = EXCLUDED.address,
         medical_history = EXCLUDED.medical_history
       RETURNING *`,
      [req.user!.id, full_name, birthday || null, weight_kg || null, height_cm || null, phone, address, medical_history]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to save profile" });
  }
});
