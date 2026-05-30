import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Stethoscope, Camera, User } from "lucide-react";
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
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [d, setD] = useState<any>({
    full_name: "", specialization: SPECS[0],
    bio: "", years_experience: 0, consultation_fee: 25,
    profile_picture: ""
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!auth.userId) return;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctor-profile/me`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      const data = await res.json();
      if (data) setD(data);
    };
    load();
  }, [auth.userId]);

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB.");

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${auth.userId}/doctor-avatar.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (error) {
      setUploading(false);
      return toast.error("Failed to upload photo.");
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    setD((prev: any) => ({ ...prev, profile_picture: publicUrl }));
    setUploading(false);
    toast.success("Photo uploaded. Click Save to keep it.");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.userId) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/doctor-profile/me`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(d)
      }
    );
    setSaving(false);
    if (!res.ok) return toast.error("Failed to save profile");
    toast.success("Profile saved.");
  };

  const deleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your doctor account? This cannot be undone.")) return;
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
    <AppShell role="doctor">
      <PageHeader title="My profile" icon={Stethoscope} />

      <div className="max-w-2xl space-y-6">

        {/* Avatar */}
        <div className="flex items-center gap-5 rounded-3xl bg-card p-6 shadow-card">
          <div className="relative">
            {d.profile_picture ? (
              <img
                src={d.profile_picture}
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
            <p className="font-display text-xl font-semibold">{d.full_name || "Your name"}</p>
            <p className="text-sm text-muted-foreground">{d.specialization}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {uploading ? "Uploading…" : "Click the camera icon to change your photo"}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadPhoto}
          />
        </div>

        {/* Profile form */}
        <form onSubmit={save} className="space-y-4 rounded-3xl bg-card p-6 shadow-card">
          <h2 className="font-display text-xl font-semibold">Professional Information</h2>
          <label className="block">
            <span className="mb-1 block font-medium">Full name</span>
            <input required value={d.full_name ?? ""}
              onChange={(e) => setD({ ...d, full_name: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-3" />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">Specialization</span>
            <select value={d.specialization}
              onChange={(e) => setD({ ...d, specialization: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-3">
              {SPECS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">Years of experience</span>
            <input type="number" min={0} value={d.years_experience ?? 0}
              onChange={(e) => setD({ ...d, years_experience: Number(e.target.value) })}
              className="w-full rounded-xl border border-input bg-background px-4 py-3" />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">Consultation fee (₱)</span>
            <input type="number" min={0} value={d.consultation_fee ?? 0}
              onChange={(e) => setD({ ...d, consultation_fee: Number(e.target.value) })}
              className="w-full rounded-xl border border-input bg-background px-4 py-3" />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">Bio</span>
            <textarea rows={4} value={d.bio ?? ""}
              onChange={(e) => setD({ ...d, bio: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-3" />
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

      </div>
    </AppShell>
  );
}
