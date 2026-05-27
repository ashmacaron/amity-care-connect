import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { doctorsRouter } from "./routes/doctors";
import { appointmentsRouter } from "./routes/appointments";
import { prescriptionsRouter } from "./routes/prescriptions";
import { profilesRouter } from "./routes/profiles";

dotenv.config();
const app = express();

app.use(cors({
  origin: [
    "https://amity-care-connect.ashacipriano.workers.dev",
    "http://localhost:5173"
  ]
}));
app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use("/api/doctors", doctorsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/prescriptions", prescriptionsRouter);
app.use("/api/profiles", profilesRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Amity API running on port ${PORT}`));
