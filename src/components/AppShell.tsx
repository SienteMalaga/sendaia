import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Mic, BookOpen, UserCog } from "lucide-react";

const items = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/asistente", label: "Asistente", icon: Mic },
  { to: "/veterano", label: "Veterano", icon: UserCog },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-h-screen max-w-md pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
