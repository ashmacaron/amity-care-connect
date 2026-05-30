import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useRequireAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/doctor/patient/$patientId")({
  head: () => ({ meta: [{ title: "Patient Profile — Amity" }] }),
  component: PatientProfile,
});

function PatientProfile() {
  const auth = useRequireAuth();
  const { patientId } = useParams({ from: "/app/doctor/patient/$patientId" });

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ["patient-profile", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profiles/${patientId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: prescriptions = [], isLoading: loadingRx } = useQuery({
    queryKey: ["patient-prescriptions", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions/patient/${patientId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (auth.loading || loadingPatient) return null;
  if (!patient) return (
    <AppShell role="doctor">
      <p className="rounded-2xl bg-muted p-6 text-muted-foreground">Patient profile not found.</p>
    </AppShell>
  );

  const age = patient.birthday
    ? Math.floor((Date.now() - new Date(patient.birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  const bmi = patient.weight_kg && patient.height_cm
    ? (patient.weight_kg / Math.pow(patient.height_cm / 100, 2)).toFixed(1)
    : null;

  return (
    <AppShell role="doctor">
      <PageHeader title={patient.full_name ?? "Patient"} subtitle="Patient profile" icon={User} />

      <div className="max-w-2xl space-y-6">

        {/* Avatar + basic */}
        <section className="flex items-center gap-5 rounded-3xl bg-card p-6 shadow-card">
          {patient.avatar_url ? (
            <img
              src={patient.avatar_url}
              alt={patient.full_name}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-primary-soft"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-primary-soft flex items-center justify-center ring-4 ring-primary-soft">
              <User className="h-10 w-10 text-primary" />
            </div>
          )}
          <div>
            <p className="font-display text-2xl font-semibold">{patient.full_name}</p>
            <p className="text-sm text-muted-foreground">{patient.email}</p>
            {patient.phone && <p className="text-sm text-muted-foreground">{patient.phone}</p>}
            {patient.address && <p className="text-sm text-muted-foreground">{patient.address}</p>}
          </div>
        </section>

        {/* Vitals */}
        <section className="rounded-3xl bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-xl font-semibold">Vitals</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Birthday", value: patient.birthday ? new Date(patient.birthday).toLocaleDateString(undefined, { dateStyle: "long" }) : null },
              { label: "Age", value: age ? `${age} yrs` : null },
              { label: "Weight", value: patient.weight_kg ? `${patient.weight_kg} kg` : null },
              { label: "Height", value: patient.height_cm ? `${patient.height_cm} cm` : null },
              { label: "BMI", value: bmi ?? null },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-primary-soft p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-primary">{label}</p>
                <p className="mt-1 font-bold">{value ?? <span className="text-sm font-normal text-muted-foreground">N/A</span>}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Medical history */}
        <section className="rounded-3xl bg-card p-6 shadow-card">
          <h2 className="mb-3 font-display text-xl font-semibold">Medical History</h2>
          {patient.medical_history ? (
            <p className="whitespace-pre-wrap text-base">{patient.medical_history}</p>
          ) : (
            <p className="text-muted-foreground">No medical history provided.</p>
          )}
        </section>

        {/* Prescription images uploaded by patient */}
        {patient.prescription_images?.length > 0 && (
          <section className="rounded-3xl bg-card p-6 shadow-card">
            <h2 className="mb-3 font-display text-xl font-semibold">Uploaded Prescription Images</h2>
            <div className="grid grid-cols-3 gap-3">
              {patient.prescription_images.map((url: string) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt="Prescription"
                    className="h-28 w-full rounded-xl object-cover hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Consultation records from this doctor */}
        <section className="rounded-3xl bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-xl font-semibold">Consultation Records</h2>
          {loadingRx ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : prescriptions.length === 0 ? (
            <p className="text-muted-foreground">No consultation records yet.</p>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx: any) => (
                <div key={rx.id} className="rounded-2xl border border-border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold">Dr. {rx.doctor_name}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rx.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  </div>
                  {rx.specialization && (
                    <p className="mb-2 text-xs text-primary">{rx.specialization}</p>
                  )}
                  {rx.notes && (
                    <div className="mb-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                      <p className="mt-1 text-sm">{rx.notes}</p>
                    </div>
                  )}
                  {rx.prescription && (
                    <div className="rounded-xl bg-primary-soft p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-primary">Prescription</p>
                      <p className="mt-1 text-sm">{rx.prescription}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </AppShell>
  );
}
