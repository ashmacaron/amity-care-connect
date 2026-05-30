import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { User, Camera } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [p, setP] = useState<any>({
    full_name: "", birthday: "", weight_kg: "",
    height_cm: "", phone: "", address: "",
    medical_history: "", avatar_url: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB.");

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${auth.userId}/avatar.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (error) {
      setUploading(false);
      return toast.error("Failed to upload image.");
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    setP((prev: any) => ({ ...prev, avatar_url: publicUrl }));
    setUploading(false);
    toast.success("Photo uploaded. Click Save to keep it.");
  };

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

  if (auth.loading) return null;

  return (
    <AppShell role={auth.role ?? "patient"}>
      <PageHeader
        title="My profile"
        subtitle="Keep this up to date so doctors can help you better."
        icon={User}
      />

      <div className="max-w-2xl space-y-6">

        {/* Avatar */}
        <div className="flex items-center gap-5 rounded-3xl bg-card p-6 shadow-card">
          <div className="relative">
            {p.avatar_url ? (
              <img
                src={p.avatar_url}
                alt="Profile photo"
                className="h-24 w-24 rounded-full object-cover ring-4 ring-primary-soft"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary-soft flex items-center justify-center ring-4 ring-primary-soft">
                <User className="h-10 w-10 text-primary" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-md hover:opacity-90"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <p className="font-display text-xl font-semibold">{p.full_name || "Your name"}</p>
            <p className="text-sm text-muted-foreground">{auth.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {uploading ? "Uploading…" : "Click the camera icon to change your photo"}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadAvatar}
          />
        </div>

        {/* Profile form */}
        <form onSubmit={save} className="space-y-4 rounded-3xl bg-card p-6 shadow-card">
          <h2 className="font-display text-xl font-semibold">Personal Information</h2>
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
              <input
                type={f.type}
                value={p[f.k] ?? ""}
                onChange={(e) => setP({ ...p, [f.k]: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base"
              />
            </label>
          ))}
          <label className="block">
            <span className="mb-1 block font-medium">Basic medical history</span>
            <textarea
              rows={4}
              value={p.medical_history ?? ""}
              onChange={(e) => setP({ ...p, medical_history: e.target.value })}
              placeholder="Allergies, conditions, medications…"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base"
            />
          </label>
          <button
            disabled={saving}
            className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>

      </div>
    </AppShell>
  );
}
