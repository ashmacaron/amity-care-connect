import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";

export const prescriptionsRouter = Router();

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

prescriptionsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const { appointment_id, patient_id, notes, prescription } = req.body;

    // Get the doctor's id from the doctors table using the Supabase user id
    const { rows: doctorRows } = await db.query(
      "SELECT id FROM doctors WHERE user_id = $1",
      [req.user!.id]
    );
    if (!doctorRows[0]) return res.status(403).json({ error: "Doctor profile not found" });
    const doctor_id = doctorRows[0].id;

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
    console.error("POST prescription error:", err);
    res.status(500).json({ error: "Failed to save" });
  }
});

// GET /api/prescriptions/patient/:patientId — doctor views a patient's prescription history
prescriptionsRouter.get("/patient/:patientId", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, d.full_name as doctor_name, d.specialization
       FROM prescriptions p
       JOIN doctors d ON d.id = p.doctor_id
       WHERE p.patient_id = $1
       ORDER BY p.created_at DESC`,
      [req.params.patientId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patient records" });
  }
});
