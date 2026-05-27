import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useRequireAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "My profile — Amity" }] }),
  component: Profile,
});

function Profile() {
  const auth = useRequireAuth();
  const [p, setP] = useState<any>({ full_name: "", birthday: "", weight_kg: "", height_cm: "", phone: "", address: "", medical_history: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.userId) return;
    supabase.from("profiles").select("*").eq("id", auth.userId).maybeSingle().then(({ data }) => {
      if (data) setP({ ...p, ...data, birthday: data.birthday ?? "" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.userId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!auth.userId) return; setSaving(true);
    const payload = { ...p, id: auth.userId, birthday: p.birthday || null, weight_kg: p.weight_kg || null, height_cm: p.height_cm || null };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved.");
  };

  if (auth.loading) return null;
  return (
    <AppShell role={auth.role ?? "patient"}>
      <PageHeader title="My profile" subtitle="Keep this up to date so doctors can help you better." icon={User} />
      <form onSubmit={save} className="max-w-2xl space-y-4 rounded-3xl bg-card p-6 shadow-card">
        {[
          { k: "full_name", label: "Full name", type: "text" },
          { k: "birthday", label: "Birthday", type: "date" },
          { k: "weight_kg", label: "Weight (kg)", type: "number" },
          { k: "height_cm", label: "Height (cm)", type: "number" },
          { k: "phone", label: "Phone", type: "tel" },
          { k: "address", label: "Address", type: "text" },
        ].map((f) => (
          <label key={f.k} className="block"><span className="mb-1 block font-medium">{f.label}</span>
            <input type={f.type} value={p[f.k] ?? ""} onChange={(e) => setP({ ...p, [f.k]: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base" />
          </label>
        ))}
        <label className="block"><span className="mb-1 block font-medium">Basic medical history</span>
          <textarea rows={4} value={p.medical_history ?? ""} onChange={(e) => setP({ ...p, medical_history: e.target.value })} placeholder="Allergies, conditions, medications…" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base" />
        </label>
        <button disabled={saving} className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
      </form>
    </AppShell>
  );
}
