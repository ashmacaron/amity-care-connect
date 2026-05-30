import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Video, User } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useRequireAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/doctor/appointments")({
  head: () => ({ meta: [{ title: "Appointments — Amity" }] }),
  component: DocAppts,
});

function DocAppts() {
  const auth = useRequireAuth();
  const { data = [] } = useQuery({
    queryKey: ["doc-appts", auth.userId],
    enabled: !!auth.userId,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/appointments/doctor/mine`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      return res.json();
    },
  });

  if (auth.loading) return null;

  const upcoming = data.filter((a: any) => a.status !== "completed" && a.status !== "cancelled");
  const completed = data.filter((a: any) => a.status === "completed");

  return (
    <AppShell role="doctor">
      <PageHeader title="Appointments" icon={CalendarDays} />

      <div className="space-y-8">

        {/* Upcoming */}
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="rounded-2xl bg-muted p-6 text-muted-foreground">No upcoming appointments.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between rounded-2xl bg-card p-5 shadow-card">
                  <div className="flex items-center gap-4">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt={a.patient_name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary-soft flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-display text-lg font-semibold">{a.patient_name ?? "Patient"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(a.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      {a.reason && <p className="mt-1 text-sm text-muted-foreground">"{a.reason}"</p>}
                      <span className="mt-1 inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                        {a.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/app/doctor/patient/$patientId"
                      params={{ patientId: a.patient_id }}
                      className="inline-flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-3 font-semibold hover:bg-muted"
                    >
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <Link
                      to="/app/consult/$id"
                      params={{ id: a.id }}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <Video className="h-5 w-5" /> Join
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Completed history */}
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">History</h2>
          {completed.length === 0 ? (
            <p className="rounded-2xl bg-muted p-6 text-muted-foreground">No completed appointments yet.</p>
          ) : (
            <div className="space-y-3">
              {completed.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between rounded-2xl bg-card p-5 shadow-card opacity-80">
                  <div className="flex items-center gap-4">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt={a.patient_name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary-soft flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-display text-lg font-semibold">{a.patient_name ?? "Patient"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(a.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      {a.reason && <p className="mt-1 text-sm text-muted-foreground">"{a.reason}"</p>}
                      <span className="mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        completed
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/app/doctor/patient/$patientId"
                    params={{ patientId: a.patient_id }}
                    className="inline-flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-3 font-semibold hover:bg-muted"
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </AppShell>
  );
}
