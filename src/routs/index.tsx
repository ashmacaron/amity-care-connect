import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Sparkles, Video, ShieldCheck } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Amity — Telehealth made simple" },
      { name: "description", content: "See a doctor from home. Calm, easy, senior-friendly telehealth." },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-dvh bg-hero-gradient">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground font-display text-2xl font-bold shadow-glow">A</div>
          <span className="font-display text-2xl font-semibold">Amity</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/login" className="rounded-xl px-5 py-3 text-base font-medium hover:bg-primary-soft">Sign in</Link>
          <Link to="/signup" className="rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-soft hover:opacity-90">Get started</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-primary shadow-card">
            <Heart className="h-4 w-4" /> Care from your couch
          </p>
          <h1 className="font-display text-5xl font-semibold leading-tight tracking-tight lg:text-6xl">
            See a doctor <span className="text-primary">without leaving home</span>.
          </h1>
          <p className="mt-6 max-w-lg text-xl text-muted-foreground">
            Amity makes online doctor visits simple. Big buttons. Clear words. Real doctors, by video.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/signup" className="rounded-2xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-soft hover:opacity-90">
              Create my account
            </Link>
            <Link to="/login" className="rounded-2xl border border-border bg-card px-8 py-4 text-lg font-semibold hover:bg-primary-soft">
              I already have one
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl shadow-soft">
          <img src={heroImg} alt="A friendly doctor talking to an older patient over video call" width={1536} height={1152} className="h-auto w-full" />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        {[
          { icon: Sparkles, title: "AI helps you choose", text: "Tell us what hurts. We suggest the right kind of doctor." },
          { icon: Video, title: "Video visits", text: "One big button to join. No downloads needed." },
          { icon: ShieldCheck, title: "Private & safe", text: "Your records stay between you and your doctor." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl bg-card p-7 shadow-card">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><f.icon className="h-6 w-6" /></div>
            <h3 className="mt-4 font-display text-2xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
