"use client"; // force update

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Sparkles, Wallet, Heart, Settings, Utensils, Film } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Sparkles, label: "IA", href: "/planner" },
  { icon: Film, label: "Cine", href: "/cinema" },
  { icon: Wallet, label: "R$", href: "/finance" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  { icon: Utensils, label: "Comer", href: "/meals" },
  { icon: Heart, label: "Desejos", href: "/wishlist" },
  { icon: Settings, label: "Ajuster", href: "/settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[90%] -translate-x-1/2 translate-y-0 md:hidden">
      <nav className="flex h-16 items-center justify-around rounded-[2rem] border border-white/10 bg-background/60 px-6 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 transition-all duration-300",
                isActive ? "text-primary scale-110" : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "glow-primary")} />
              {isActive && (
                <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
