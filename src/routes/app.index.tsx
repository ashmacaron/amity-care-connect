import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Search, CalendarDays, FileText, Stethoscope, Clock } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useRequireAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Home — Amity" }] }),
  component: AppHome,
});

function AppHome() {
  const auth = useRequireAuth();
  if (auth.loading || !auth.userId) return <div className="grid min-h-dvh place-items-center">Loading…</div>;
  return <AppShell role={auth.role ?? "patient"}>{auth.role === "doctor" ? <DoctorHome /> : <PatientHome />}</AppShell>;
}

function PatientHome() {
  const { data: appts } = useQuery({
    queryKey: ["upcoming"],
    queryFn: async () => {
      const { data } = await supabase.from("appointments")
        .select("id, scheduled_at, status, doctors(full_name, specialization)")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at").limit(3);
      return data ?? [];
    },
  });

  const tiles = [
    { to: "/app/doctors", icon: Search, title: "Find a doctor", text: "Browse our specialists" },
    { to: "/app/ai", icon: Sparkles, title: "Ask Amity AI", text: "Not sure who to see?" },
    { to: "/app/appointments", icon: CalendarDays, title: "My appointments", text: "See upcoming visits" },
    { to: "/app/records", icon: FileText, title: "My records", text: "Past notes & prescriptions" },
  ];

  return (
    <>
      <PageHeader title="What would you like to do today?" subtitle="Pick a big card below — they all do simple things." />
      <div className="grid gap-5 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="group rounded-3xl bg-card p-7 shadow-card transition hover:shadow-soft">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground transition"><t.icon className="h-7 w-7" /></div>
            <h3 className="mt-4 font-display text-2xl font-semibold">{t.title}</h3>
            <p className="mt-1 text-muted-foreground">{t.text}</p>
          </Link>
        ))}
      </div>
      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-semibold">Coming up</h2>
        {appts && appts.length > 0 ? (
          <div className="space-y-3">
            {appts.map((a: any) => (
              <Link key={a.id} to="/app/consult/$id" params={{ id: a.id }} className="flex items-center justify-between rounded-2xl bg-card p-5 shadow-card hover:shadow-soft">
                <div>
                  <p className="font-semibold">{a.doctors?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{a.doctors?.specialization}</p>
                </div>
                <p className="text-base">{new Date(a.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-muted p-6 text-muted-foreground">No upcoming visits. <Link to="/app/doctors" className="font-semibold text-primary underline">Book one</Link>.</p>
        )}
      </section>
    </>
  );
}

function DoctorHome() {
  const { data } = useQuery({
    queryKey: ["dr-today"],
    queryFn: async () => {
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(); end.setHours(23,59,59,999);
      const { data } = await supabase.from("appointments")
        .select("id, scheduled_at, status, reason, patient_id")
        .gte("scheduled_at", start.toISOString()).lte("scheduled_at", end.toISOString())
        .order("scheduled_at");
      return data ?? [];
    },
  });
  const tiles = [
    { to: "/app/doctor/appointments", icon: CalendarDays, title: "Appointments", text: "View all bookings" },
    { to: "/app/doctor/schedule", icon: Clock, title: "My schedule", text: "Set your available hours" },
    { to: "/app/doctor/profile", icon: Stethoscope, title: "My profile", text: "Update bio & specialization" },
  ];
  return (
    <>
      <PageHeader title="Welcome, Doctor" subtitle="Your day at a glance." />
      <div className="grid gap-5 sm:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="rounded-3xl bg-card p-7 shadow-card hover:shadow-soft">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary"><t.icon className="h-7 w-7" /></div>
            <h3 className="mt-4 font-display text-2xl font-semibold">{t.title}</h3>
            <p className="mt-1 text-muted-foreground">{t.text}</p>
          </Link>
        ))}
      </div>
      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-semibold">Today</h2>
        {data && data.length > 0 ? data.map((a: any) => (
          <Link key={a.id} to="/app/consult/$id" params={{ id: a.id }} className="mb-3 block rounded-2xl bg-card p-5 shadow-card hover:shadow-soft">
            <p className="font-semibold">{new Date(a.scheduled_at).toLocaleTimeString(undefined, { timeStyle: "short" })}</p>
            <p className="text-muted-foreground">{a.reason ?? "Consultation"}</p>
          </Link>
        )) : <p className="rounded-2xl bg-muted p-6 text-muted-foreground">Nothing scheduled today.</p>}
      </section>
    </>
  );
}
