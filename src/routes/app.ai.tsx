import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useRequireAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ai")({
  head: () => ({ meta: [{ title: "Ask Amity AI — Amity" }] }),
  component: AI,
});

function AI() {
  const auth = useRequireAuth();
  const navigate = useNavigate();
  const recommend = useServerFn(recommendSpecialization);
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ specialization: string; reason: string } | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);

  const ask = async () => {
    if (symptoms.trim().length < 3) return;
    setLoading(true); setResult(null); setDoctors([]);
    try {
      const r = await recommend({ data: { symptoms } });
      setResult(r);
      const { data } = await supabase.from("doctors").select("*").eq("specialization", r.specialization);
      setDoctors(data ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not get a suggestion.");
    } finally { setLoading(false); }
  };

  if (auth.loading) return null;
  return (
    <AppShell role={auth.role ?? "patient"}>
      <PageHeader title="Ask Amity AI" subtitle="Describe what's bothering you. We'll suggest the kind of doctor to see." icon={Sparkles} />
      <div className="rounded-3xl bg-card p-6 shadow-card">
        <label className="block">
          <span className="mb-2 block text-base font-medium">How are you feeling?</span>
          <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={4} placeholder="Example: I've had a rash on my arm for 3 days, it itches…" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base" />
        </label>
        <button onClick={ask} disabled={loading} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {loading ? "Thinking…" : "Get suggestion"}
        </button>
        <p className="mt-2 text-sm text-muted-foreground">Amity AI gives a suggestion, not a diagnosis. In emergencies, call your local emergency number.</p>
      </div>

      {result && (
        <section className="mt-8">
          <div className="rounded-3xl bg-primary-soft p-6">
            <p className="text-sm uppercase tracking-wide text-primary">Suggested specialty</p>
            <h2 className="font-display text-3xl font-semibold">{result.specialization}</h2>
            <p className="mt-2 text-foreground">{result.reason}</p>
          </div>
          <h3 className="mt-8 mb-3 font-display text-2xl font-semibold">Available {result.specialization}s</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {doctors.map((d) => (
              <div key={d.id} className="rounded-2xl bg-card p-5 shadow-card">
                <h4 className="font-semibold">{d.full_name}</h4>
                <p className="text-sm text-muted-foreground">{d.years_experience} yrs · ⭐ {d.rating}</p>
                <Link to="/app/book/$doctorId" params={{ doctorId: d.id }} className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Book</Link>
              </div>
            ))}
            {doctors.length === 0 && <Link to="/app/doctors" className="text-primary underline">Browse all doctors</Link>}
          </div>
        </section>
      )}
    </AppShell>
  );
}
