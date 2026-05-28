import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import bcrypt from "bcryptjs";

export const profilesRouter = Router();

profilesRouter.get("/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM profiles WHERE id = $1",
      [req.user!.id]
    );
    res.json(rows[0] ?? null);
  } catch (err) {
    console.error("GET profile error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

profilesRouter.post("/me", requireAuth, async (req, res) => {
  try {
    const {
      full_name, birthday, weight_kg,
      height_cm, phone, address, medical_history
    } = req.body;

// POST /api/profiles/signup — called right after Supabase signup
profilesRouter.post("/signup", async (req, res) => {
  try {
    const { id, full_name, email, role, password } = req.body;
    const password_hash = await bcrypt.hash(password, 10);

    const { rows } = await db.query(
      `INSERT INTO profiles (id, full_name, email, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         email = EXCLUDED.email,
         role = EXCLUDED.role,
         password_hash = EXCLUDED.password_hash
       RETURNING id, full_name, email, role, created_at`,
      [id, full_name, email, role, password_hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Signup profile error:", err);
    res.status(500).json({ error: "Failed to create profile" });
  }
});

profilesRouter.delete("/me", requireAuth, async (req, res) => {
  try {
    await db.query("DELETE FROM profiles WHERE id = $1", [req.user!.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete profile" });
  }
});

    const { rows } = await db.query(
      `INSERT INTO profiles (id, full_name, birthday, weight_kg, height_cm, phone, address, medical_history)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         birthday = EXCLUDED.birthday,
         weight_kg = EXCLUDED.weight_kg,
         height_cm = EXCLUDED.height_cm,
         phone = EXCLUDED.phone,
         address = EXCLUDED.address,
         medical_history = EXCLUDED.medical_history
       RETURNING *`,
      [
        req.user!.id,
        full_name,
        birthday || null,
        weight_kg || null,
        height_cm || null,
        phone,
        address,
        medical_history
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("POST profile error:", err);
    res.status(500).json({ error: "Failed to save profile" });
  }
});
