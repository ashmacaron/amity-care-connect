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
  const [slots, setSlots] = useState<Record<number, { start: string; end: string; enabled: boolean }>>(
    () => Object.fromEntries(DAYS.map((_, i) => [i, { start: "09:00", end: "17:00", enabled: i >= 1 && i <= 5 }]))
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.userId) return;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/schedule`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.length) {
        const next = Object.fromEntries(DAYS.map((_, i) => [i, { start: "09:00", end: "17:00", enabled: false }]));
        data.forEach((s: any) => {
          next[s.day_of_week] = {
            start: s.start_time.slice(0, 5),
            end: s.end_time.slice(0, 5),
            enabled: true
          };
        });
        setSlots(next);
      }
    };
    load();
  }, [auth.userId]);

  const save = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const rows = Object.entries(slots)
      .filter(([, v]) => v.enabled)
      .map(([d, v]) => ({
        day_of_week: Number(d),
        start_time: v.start,
        end_time: v.end,
      }));

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/schedule`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ slots: rows })
      }
    );
    setSaving(false);
    if (!res.ok) return toast.error("Failed to save schedule");
    toast.success("Schedule saved.");
  };

  if (auth.loading) return null;
  return (
    <AppShell role="doctor">
      <PageHeader title="My schedule" subtitle="Pick the days and hours you're available." icon={Clock} />
      <div className="max-w-2xl space-y-2 rounded-3xl bg-card p-6 shadow-card">
        {DAYS.map((d, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <label className="flex w-28 items-center gap-2">
              <input type="checkbox" checked={slots[i].enabled}
                onChange={(e) => setSlots({ ...slots, [i]: { ...slots[i], enabled: e.target.checked } })} />
              <span className="font-medium">{d}</span>
            </label>
            <input type="time" value={slots[i].start} disabled={!slots[i].enabled}
              onChange={(e) => setSlots({ ...slots, [i]: { ...slots[i], start: e.target.value } })}
              className="rounded-lg border border-input bg-background px-3 py-2" />
            <span>–</span>
            <input type="time" value={slots[i].end} disabled={!slots[i].enabled}
              onChange={(e) => setSlots({ ...slots, [i]: { ...slots[i], end: e.target.value } })}
              className="rounded-lg border border-input bg-background px-3 py-2" />
          </div>
        ))}
        <button onClick={save} disabled={saving}
          className="mt-4 w-full rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {saving ? "Saving…" : "Save schedule"}
        </button>
      </div>
    </AppShell>
  );
}
