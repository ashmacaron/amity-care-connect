import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useRequireAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/records")({
  head: () => ({ meta: [{ title: "My records — Amity" }] }),
  component: Records,
});

function Records() {
  const auth = useRequireAuth();
  const { data = [] } = useQuery({
    queryKey: ["records"],
    // This is what it becomes — calls YOUR backend instead
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
    
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },
  });
  if (auth.loading) return null;
  return (
    <AppShell role={auth.role ?? "patient"}>
      <PageHeader title="My records" subtitle="Notes & prescriptions from your visits." icon={FileText} />
      {data.length === 0 ? (
        <p className="rounded-2xl bg-muted p-6 text-muted-foreground">No records yet. After a doctor finishes a visit, their notes show up here.</p>
      ) : (
        <div className="space-y-4">
          {data.map((r: any) => (
            <article key={r.id} className="rounded-2xl bg-card p-6 shadow-card">
              <header className="mb-3 flex items-baseline justify-between">
                <div>
                  <p className="font-display text-xl font-semibold">{r.doctors?.full_name}</p>
                  <p className="text-sm text-primary">{r.doctors?.specialization}</p>
                </div>
                <p className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
              </header>
              {r.notes && <div className="mb-3"><p className="text-sm font-medium text-muted-foreground">Notes</p><p className="whitespace-pre-wrap">{r.notes}</p></div>}
              {r.prescription && <div><p className="text-sm font-medium text-muted-foreground">Prescription</p><p className="whitespace-pre-wrap rounded-xl bg-primary-soft p-4">{r.prescription}</p></div>}
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
