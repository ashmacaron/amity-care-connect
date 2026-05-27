import { Router } from "express";
import { db } from "../db";

export const doctorsRouter = Router();

// GET /api/doctors — list all doctors
doctorsRouter.get("/", async (req, res) => {
  try {
    const { search, specialization } = req.query;
    let query = "SELECT * FROM doctors";
    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(full_name ILIKE $${params.length} OR specialization ILIKE $${params.length})`);
    }
    if (specialization) {
      params.push(specialization);
      conditions.push(`specialization = $${params.length}`);
    }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY rating DESC";

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

// GET /api/doctors/:id
doctorsRouter.get("/:id", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM doctors WHERE id = $1", [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Doctor not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch doctor" });
  }
});
