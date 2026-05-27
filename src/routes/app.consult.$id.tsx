import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Video } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useRequireAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/consult/$id")({
  head: () => ({ meta: [{ title: "Consultation — Amity" }] }),
  component: Consult,
});

function Consult() {
  const auth = useRequireAuth();
  const { id } = useParams({ from: "/app/consult/$id" });
  const { data: appt } = useQuery({
    queryKey: ["appt", id],
    // This is what it becomes — calls YOUR backend instead
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
    
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },
  });
  const [notes, setNotes] = useState("");
  const [rx, setRx] = useState("");

  const saveNotes = async () => {
    if (!appt) return;
    const { error } = await supabase.from("prescriptions").insert({
      appointment_id: appt.id, patient_id: appt.patient_id, doctor_id: appt.doctor_id, notes, prescription: rx,
    });
    if (error) return toast.error(error.message);
    await supabase.from("appointments").update({ status: "completed" }).eq("id", appt.id);
    toast.success("Notes saved & visit completed.");
    setNotes(""); setRx("");
  };

  if (auth.loading || !appt) return null;
  const isDoctor = auth.role === "doctor" && (appt as any).doctors?.user_id === auth.userId;
  const room = appt.jitsi_room;

  return (
    <AppShell role={auth.role ?? "patient"}>
      <PageHeader title={`Visit with ${(appt as any).doctors?.full_name}`} subtitle={new Date(appt.scheduled_at).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })} icon={Video} />
      <div className="overflow-hidden rounded-3xl shadow-soft" style={{ aspectRatio: "16 / 9" }}>
        <iframe
          title="Video consultation"
          src={`https://meet.jit.si/${encodeURIComponent(room)}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="h-full w-full border-0"
        />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">If video doesn't load, allow camera & microphone in your browser, then refresh.</p>

      {isDoctor && (
        <section className="mt-8 rounded-3xl bg-card p-6 shadow-card">
          <h2 className="font-display text-2xl font-semibold">Consultation notes</h2>
          <label className="mt-4 block"><span className="mb-1 block font-medium">Notes</span>
            <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base" />
          </label>
          <label className="mt-3 block"><span className="mb-1 block font-medium">Prescription</span>
            <textarea rows={4} value={rx} onChange={(e) => setRx(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base" />
          </label>
          <button onClick={saveNotes} className="mt-4 rounded-xl bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground hover:opacity-90">Save & finish visit</button>
        </section>
      )}
    </AppShell>
  );
}
