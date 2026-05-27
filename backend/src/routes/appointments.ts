import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";

export const appointmentsRouter = Router();

// GET /api/appointments — get current user's appointments
appointmentsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { rows } = await db.query(
      `SELECT a.*, d.full_name as doctor_name, d.specialization
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       WHERE a.patient_id = $1
       ORDER BY a.scheduled_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// POST /api/appointments — book appointment
appointmentsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const { doctor_id, scheduled_at, reason } = req.body;
    const patient_id = req.user!.id;
    const jitsi_room = `amity-${crypto.randomUUID()}`;

    const { rows } = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason, status, jitsi_room)
       VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *`,
      [patient_id, doctor_id, scheduled_at, reason, jitsi_room]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to book appointment" });
  }
});

// DELETE /api/appointments/:id — cancel
appointmentsRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db.query(
      "DELETE FROM appointments WHERE id = $1 AND patient_id = $2",
      [req.params.id, req.user!.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel" });
  }
});
