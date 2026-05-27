import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useRequireAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SPECS = ["General Practitioner","Cardiologist","Dermatologist","Pediatrician","Psychiatrist","Orthopedic"];

export const Route = createFileRoute("/app/doctor/profile")({
  head: () => ({ meta: [{ title: "Doctor profile — Amity" }] }),
  component: DocProfile,
});

function DocProfile() {
  const auth = useRequireAuth();
  const [d, setD] = useState<any>({ full_name: "", specialization: SPECS[0], bio: "", years_experience: 0, consultation_fee: 25 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.userId) return;
    supabase.from("doctors").select("*").eq("user_id", auth.userId).maybeSingle().then(({ data }) => {
      if (data) setD(data);
    });
  }, [auth.userId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!auth.userId) return; setSaving(true);
    const payload = { ...d, user_id: auth.userId };
    const { error } = await supabase.from("doctors").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved.");
  };
  if (auth.loading) return null;
  return (
    <AppShell role="doctor">
      <PageHeader title="My profile" icon={Stethoscope} />
      <form onSubmit={save} className="max-w-2xl space-y-4 rounded-3xl bg-card p-6 shadow-card">
        <label className="block"><span className="mb-1 block font-medium">Full name</span>
          <input required value={d.full_name ?? ""} onChange={(e) => setD({ ...d, full_name: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3" />
        </label>
        <label className="block"><span className="mb-1 block font-medium">Specialization</span>
          <select value={d.specialization} onChange={(e) => setD({ ...d, specialization: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3">
            {SPECS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block"><span className="mb-1 block font-medium">Years of experience</span>
          <input type="number" min={0} value={d.years_experience ?? 0} onChange={(e) => setD({ ...d, years_experience: Number(e.target.value) })} className="w-full rounded-xl border border-input bg-background px-4 py-3" />
        </label>
        <label className="block"><span className="mb-1 block font-medium">Consultation fee ($)</span>
          <input type="number" min={0} value={d.consultation_fee ?? 0} onChange={(e) => setD({ ...d, consultation_fee: Number(e.target.value) })} className="w-full rounded-xl border border-input bg-background px-4 py-3" />
        </label>
        <label className="block"><span className="mb-1 block font-medium">Bio</span>
          <textarea rows={4} value={d.bio ?? ""} onChange={(e) => setD({ ...d, bio: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3" />
        </label>
        <button disabled={saving} className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
      </form>
    </AppShell>
  );
}
