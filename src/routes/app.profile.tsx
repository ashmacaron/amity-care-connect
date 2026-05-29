import { createFileRoute, useRouter } from "@tanstack/react-router";
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
  const router = useRouter();
  const [p, setP] = useState<any>({
    full_name: "", birthday: "", weight_kg: "",
    height_cm: "", phone: "", address: "", medical_history: ""
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!auth.userId) return;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profiles/me`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      const data = await res.json();
      if (data) setP((prev: any) => ({ ...prev, ...data, birthday: data.birthday ?? "" }));
    };
    load();
  }, [auth.userId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.userId) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/profiles/me`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(p)
      }
    );
    setSaving(false);
    if (!res.ok) return toast.error("Failed to save profile");
    toast.success("Profile saved.");
  };

  const deleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    setDeleting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/profiles/me`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token}` }
      }
    );
    if (!res.ok) {
      setDeleting(false);
      return toast.error("Failed to delete account");
    }
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
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
          <label key={f.k} className="block">
            <span className="mb-1 block font-medium">{f.label}</span>
            <input type={f.type} value={p[f.k] ?? ""}
              onChange={(e) => setP({ ...p, [f.k]: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base" />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block font-medium">Basic medical history</span>
          <textarea rows={4} value={p.medical_history ?? ""}
            onChange={(e) => setP({ ...p, medical_history: e.target.value })}
            placeholder="Allergies, conditions, medications…"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base" />
        </label>
        <button disabled={saving}
          className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={deleteAccount} disabled={deleting}
          className="w-full rounded-xl border border-destructive py-4 text-lg font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-60">
          {deleting ? "Deleting…" : "Delete account"}
        </button>
      </form>
    </AppShell>
  );
}
