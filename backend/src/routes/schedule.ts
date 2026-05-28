import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";

export const scheduleRouter = Router();

// GET /api/schedule — get doctor's schedule
scheduleRouter.get("/", requireAuth, async (req, res) => {
  try {
    const { rows: doctor } = await db.query(
      "SELECT id FROM doctors WHERE user_id = $1",
      [req.user!.id]
    );
    if (!doctor[0]) return res.json([]);

    const { rows } = await db.query(
      "SELECT * FROM doctor_availability WHERE doctor_id = $1 ORDER BY day_of_week",
      [doctor[0].id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

// POST /api/schedule — save doctor's schedule
scheduleRouter.post("/", requireAuth, async (req, res) => {
  try {
    const { slots } = req.body;
    const { rows: doctor } = await db.query(
      "SELECT id FROM doctors WHERE user_id = $1",
      [req.user!.id]
    );
    if (!doctor[0]) return res.status(404).json({ error: "Doctor profile not found. Save your profile first." });

    const doctorId = doctor[0].id;

    // Delete existing and reinsert
    await db.query("DELETE FROM doctor_availability WHERE doctor_id = $1", [doctorId]);

    if (slots?.length) {
      for (const slot of slots) {
        await db.query(
          `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4)`,
          [doctorId, slot.day_of_week, slot.start_time, slot.end_time]
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save schedule" });
  }
});
