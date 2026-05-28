import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Amity" }] }),
  component: Login,
});

function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    // Redirect based on role
    const role = data.user?.user_metadata?.role;
    if (role === "doctor") {
      router.navigate({ to: "/app/doctor/appointments" });
    } else {
      router.navigate({ to: "/app" });
    }
  };
  return (
    <div className="grid min-h-dvh place-items-center bg-hero-gradient px-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-soft">
        <Link to="/" className="mb-6 inline-flex items-center gap-2"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-gradient text-primary-foreground font-display font-bold">A</div><span className="font-display text-xl font-semibold">Amity</span></Link>
        <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-muted-foreground">Sign in to your Amity account.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block"><span className="mb-1 block text-base font-medium">Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base" /></label>
          <label className="block"><span className="mb-1 block text-base font-medium">Password</span><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base" /></label>
          <button disabled={loading} className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="mt-6 text-center text-base">New here? <Link to="/signup" className="font-semibold text-primary underline">Create an account</Link></p>
      </div>
    </div>
  );
}
