import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Video } from "lucide-react";
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
  return (
    <AppShell role="doctor">
      <PageHeader title="Appointments" icon={CalendarDays} />
      {data.length === 0 ? (
        <p className="rounded-2xl bg-muted p-6 text-muted-foreground">No appointments yet.</p>
      ) : (
        <div className="space-y-3">
          {data.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between rounded-2xl bg-card p-5 shadow-card">
              <div>
                <p className="font-display text-lg font-semibold">
                  {a.patient_name ?? "Patient"}
                </p>
                <p className="text-sm">
                  {new Date(a.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </p>
                {a.reason && <p className="mt-1 text-sm text-muted-foreground">"{a.reason}"</p>}
                <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  a.status === "completed" ? "bg-green-100 text-green-700" :
                  a.status === "cancelled" ? "bg-red-100 text-red-700" :
                  "bg-primary-soft text-primary"
                }`}>{a.status}</span>
              </div>
              <Link to="/app/consult/$id" params={{ id: a.id }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90">
                <Video className="h-5 w-5" /> Join
              </Link>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
