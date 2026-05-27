import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useRequireAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/book/$doctorId")({
  head: () => ({ meta: [{ title: "Book a visit — Amity" }] }),
  component: Book,
});

function Book() {
  const { doctorId } = useParams({ from: "/app/book/$doctorId" });
  const auth = useRequireAuth();
  const nav = useNavigate();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: doctor } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: async () => {
      const { data } = await supabase.from("doctors").select("*").eq("id", doctorId).single();
      return data;
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.userId) return;
    setSaving(true);
    const scheduled_at = new Date(`${date}T${time}`).toISOString();
    const { error } = await supabase.from("appointments").insert({
      patient_id: auth.userId, doctor_id: doctorId, scheduled_at, reason,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Appointment booked!");
    nav({ to: "/app/appointments" });
  };

  if (auth.loading || !doctor) return null;
  const today = new Date().toISOString().split("T")[0];
  return (
    <AppShell role={auth.role ?? "patient"}>
      <PageHeader title={`Book with ${doctor.full_name}`} subtitle={`${doctor.specialization} · Mon–Fri 9:00–17:00`} icon={CalendarDays} />
      <form onSubmit={submit} className="max-w-xl space-y-5 rounded-3xl bg-card p-6 shadow-card">
        <label className="block"><span className="mb-1 block font-medium">Date</span><input type="date" required min={today} value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base" /></label>
        <label className="block"><span className="mb-1 block font-medium">Time</span><input type="time" required min="09:00" max="17:00" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base" /></label>
        <label className="block"><span className="mb-1 block font-medium">Reason for visit</span><textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe what you'd like to discuss" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base" /></label>
        <button disabled={saving} className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">{saving ? "Booking…" : "Confirm booking"}</button>
      </form>
    </AppShell>
  );
}
