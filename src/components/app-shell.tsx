import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home, Search, Sparkles, CalendarDays, FileText, User, LogOut,
  Stethoscope, Clock, ClipboardList, Video,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Role = "patient" | "doctor";

const patientNav = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/doctors", label: "Find a doctor", icon: Search },
  { to: "/app/ai", label: "Ask Amity AI", icon: Sparkles },
  { to: "/app/appointments", label: "My appointments", icon: CalendarDays },
  { to: "/app/records", label: "My records", icon: FileText },
  { to: "/app/profile", label: "My profile", icon: User },
] as const;

const doctorNav = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/doctor/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/app/doctor/schedule", label: "My schedule", icon: Clock },
  { to: "/app/doctor/profile", label: "My profile", icon: Stethoscope },
] as const;

export function AppShell({ children, role }: { children: React.ReactNode; role: Role }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const nav = role === "doctor" ? doctorNav : patientNav;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setName(data.user?.user_metadata?.full_name || data.user?.email?.split("@")[0] || "");
    });
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  const path = router.state.location.pathname;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-0 lg:h-dvh lg:w-72 border-b lg:border-b-0 lg:border-r border-sidebar-border bg-sidebar">
          <div className="flex h-full flex-col gap-1 p-5">
            <Link to="/app" className="mb-4 flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-gradient text-primary-foreground font-display text-xl font-bold shadow-glow">A</div>
              <span className="font-display text-2xl font-semibold tracking-tight">Amity</span>
            </Link>
            <p className="mb-3 px-2 text-sm text-muted-foreground">Hi, {name || "friend"} 👋</p>
            <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = path === item.to || (item.to !== "/app" && path.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition whitespace-nowrap",
                      active
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Sign out button pushed to bottom */}
            <div className="mt-auto pt-4 border-t border-sidebar-border">
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3
                           text-base font-medium text-muted-foreground
                           hover:bg-destructive hover:text-destructive-foreground
                           transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 px-4 py-6 lg:px-10 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, icon: Icon }: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight lg:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}

export { ClipboardList, Video };
