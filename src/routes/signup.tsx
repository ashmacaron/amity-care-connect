import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Amity" }] }),
  component: Signup,
});

function Signup() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: fullName, role },
      },
    });

    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    const userId = data.user?.id;
    if (userId) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/profiles/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          full_name: fullName,
          email,
          role,
          password,
        }),
      });
    }

    setLoading(false);
    toast.success("Account created! Check your email to confirm.");
    router.navigate({ to: "/login" });
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-hero-gradient px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-soft">
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-gradient text-primary-foreground font-display font-bold">
            A
          </div>
          <span className="font-display text-xl font-semibold">Amity</span>
        </Link>
        <h1 className="font-display text-3xl font-semibold">Create your account</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["patient", "doctor"] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-xl border px-4 py-3 text-base font-medium ${
                  role === r
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-background"
                }`}
              >
                {r === "patient" ? "I'm a patient" : "I'm a doctor"}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="mb-1 block text-base font-medium">Full name</span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-base font-medium">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-base font-medium">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base"
            />
          </label>
          <button
            disabled={loading}
            className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-base">
          Already have one?{" "}
          <Link to="/login" className="font-semibold text-primary underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
