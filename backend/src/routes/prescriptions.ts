import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";

export const prescriptionsRouter = Router();

// GET /api/prescriptions — patient sees their own records
prescriptionsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, d.full_name as doctor_name, d.specialization
       FROM prescriptions p
       JOIN doctors d ON d.id = p.doctor_id
       WHERE p.patient_id = $1
       ORDER BY p.created_at DESC`,
      [req.user!.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// POST /api/prescriptions — doctor saves notes after visit
prescriptionsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const { appointment_id, patient_id, notes, prescription } = req.body;
    const doctor_id = req.user!.id;

    const { rows } = await db.query(
      `INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, notes, prescription)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [appointment_id, patient_id, doctor_id, notes, prescription]
    );
    await db.query(
      "UPDATE appointments SET status = 'completed' WHERE id = $1",
      [appointment_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to save notes" });
  }
});
