import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Stethoscope } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useRequireAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/doctors")({
  head: () => ({ meta: [{ title: "Find a doctor — Amity" }] }),
  component: Doctors,
});

function Doctors() {
  const auth = useRequireAuth();
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState<string>("");

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctors`
      );
      return res.json();
    },
  });

  const specs = Array.from(new Set(doctors.map((d: any) => d.specialization)));
  const filtered = doctors.filter((d: any) =>
    (!spec || d.specialization === spec) &&
    (!q || d.full_name.toLowerCase().includes(q.toLowerCase()) || d.specialization.toLowerCase().includes(q.toLowerCase()))
  );

  if (auth.loading) return null;
  return (
    <AppShell role={auth.role ?? "patient"}>
      <PageHeader title="Find a doctor" subtitle="Search or filter by specialty." icon={Stethoscope} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or specialty" className="flex-1 rounded-xl border border-input bg-card px-4 py-3 text-base" />
        <select value={spec} onChange={(e) => setSpec(e.target.value)} className="rounded-xl border border-input bg-card px-4 py-3 text-base">
          <option value="">All specialties</option>
          {specs.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((d: any) => (
          <div key={d.id} className="rounded-2xl bg-card p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-xl font-semibold text-primary">
                {d.full_name.split(" ").map((p: string) => p[0]).slice(0,2).join("")}
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-semibold">{d.full_name}</h3>
                <p className="text-primary">{d.specialization}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><Star className="h-4 w-4 fill-current text-amber-500" /> {d.rating} · {d.years_experience} yrs</p>
              </div>
            </div>
            {d.bio && <p className="mt-3 text-sm text-muted-foreground">{d.bio}</p>}
            <Link to="/app/book/$doctorId" params={{ doctorId: d.id }} className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary py-3 text-base font-semibold text-primary-foreground hover:opacity-90">
              Book a visit
            </Link>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground">No doctors match your search.</p>}
      </div>
    </AppShell>
  );
}
