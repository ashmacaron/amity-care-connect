import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useRequireAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export const Route = createFileRoute("/app/doctor/schedule")({
  head: () => ({ meta: [{ title: "My schedule — Amity" }] }),
  component: Schedule,
});

function Schedule() {
  const auth = useRequireAuth();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<number, { start: string; end: string; enabled: boolean }>>(() =>
    Object.fromEntries(DAYS.map((_, i) => [i, { start: "09:00", end: "17:00", enabled: i >= 1 && i <= 5 }])),
  );

  useEffect(() => {
    if (!auth.userId) return;
    supabase.from("doctors").select("id").eq("user_id", auth.userId).maybeSingle().then(async ({ data }) => {
      if (!data) return;
      setDoctorId(data.id);
      const { data: a } = await supabase.from("doctor_availability").select("*").eq("doctor_id", data.id);
      if (a) {
        const next = { ...slots };
        DAYS.forEach((_, i) => (next[i] = { ...next[i], enabled: false }));
        a.forEach((s) => { next[s.day_of_week] = { start: s.start_time.slice(0,5), end: s.end_time.slice(0,5), enabled: true }; });
        setSlots(next);
      }
    });
    // eslint-disable-next-line
  }, [auth.userId]);

  const save = async () => {
    if (!doctorId) return toast.error("Set up your doctor profile first.");
    await supabase.from("doctor_availability").delete().eq("doctor_id", doctorId);
    const rows = Object.entries(slots).filter(([, v]) => v.enabled).map(([d, v]) => ({
      doctor_id: doctorId, day_of_week: Number(d), start_time: v.start, end_time: v.end,
    }));
    if (rows.length) {
      const { error } = await supabase.from("doctor_availability").insert(rows);
      if (error) return toast.error(error.message);
    }
    toast.success("Schedule saved.");
  };

  if (auth.loading) return null;
  return (
    <AppShell role="doctor">
      <PageHeader title="My schedule" subtitle="Pick the days and hours you're available." icon={Clock} />
      <div className="max-w-2xl space-y-2 rounded-3xl bg-card p-6 shadow-card">
        {DAYS.map((d, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <label className="flex w-28 items-center gap-2"><input type="checkbox" checked={slots[i].enabled} onChange={(e) => setSlots({ ...slots, [i]: { ...slots[i], enabled: e.target.checked } })} /><span className="font-medium">{d}</span></label>
            <input type="time" value={slots[i].start} disabled={!slots[i].enabled} onChange={(e) => setSlots({ ...slots, [i]: { ...slots[i], start: e.target.value } })} className="rounded-lg border border-input bg-background px-3 py-2" />
            <span>–</span>
            <input type="time" value={slots[i].end} disabled={!slots[i].enabled} onChange={(e) => setSlots({ ...slots, [i]: { ...slots[i], end: e.target.value } })} className="rounded-lg border border-input bg-background px-3 py-2" />
          </div>
        ))}
        <button onClick={save} className="mt-4 w-full rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground hover:opacity-90">Save schedule</button>
      </div>
    </AppShell>
  );
}
