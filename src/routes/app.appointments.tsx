import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Video, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useRequireAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/appointments")({
  head: () => ({ meta: [{ title: "My appointments — Amity" }] }),
  component: Appts,
});

function Appts() {
  const auth = useRequireAuth();
  const { data = [], refetch } = useQuery({
    queryKey: ["my-appts"],
    // This is what it becomes — calls YOUR backend instead
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/appointments`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      return res.json();
    },
  });

  const cancel = async (id: string) => {
    if (!confirm("Cancel this appointment?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Cancelled.");
    refetch();
  };

  if (auth.loading) return null;
  return (
    <AppShell role={auth.role ?? "patient"}>
      <PageHeader title="My appointments" icon={CalendarDays} />
      {data.length === 0 ? (
        <p className="rounded-2xl bg-muted p-6 text-muted-foreground">No appointments yet. <Link to="/app/doctors" className="font-semibold text-primary underline">Book one</Link>.</p>
      ) : (
        <div className="space-y-3">
          {data.map((a: any) => {
            const upcoming = new Date(a.scheduled_at) > new Date();
            return (
              <div key={a.id} className="rounded-2xl bg-card p-5 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-semibold">{a.doctors?.full_name}</p>
                    <p className="text-primary">{a.doctors?.specialization}</p>
                    <p className="mt-1 text-base">{new Date(a.scheduled_at).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}</p>
                    {a.reason && <p className="mt-1 text-sm text-muted-foreground">"{a.reason}"</p>}
                  </div>
                  <div className="flex gap-2">
                    {upcoming && (
                      <Link to="/app/consult/$id" params={{ id: a.id }} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90">
                        <Video className="h-5 w-5" /> Join
                      </Link>
                    )}
                    {upcoming && (
                      <button onClick={() => cancel(a.id)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 hover:bg-destructive hover:text-destructive-foreground">
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
