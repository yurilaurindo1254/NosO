"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Sparkles, Wallet, Heart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  { icon: Sparkles, label: "Planner AI", href: "/planner" },
  { icon: Wallet, label: "Finance", href: "/finance" },
  { icon: Heart, label: "Wishlist", href: "/wishlist" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-white/5 bg-background/60 backdrop-blur-xl md:block">
      <div className="flex h-full flex-col gap-8 p-8">
        <div className="flex items-center gap-3 font-black text-3xl tracking-tighter text-foreground decoration-primary decoration-4 underline-offset-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Heart className="h-6 w-6 fill-current" />
          </div>
          <span>NósOS</span>
        </div>
        
        <nav className="flex flex-1 flex-col gap-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-4 px-4 py-7 text-base font-semibold transition-all duration-300 group rounded-2xl",
                    isActive 
                      ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(var(--primary),0.1)]" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-500 group-hover:scale-125",
                    isActive ? "text-primary glow-primary" : "text-muted-foreground"
                  )} />
                  {item.label}
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
          <Button variant="ghost" className="w-full justify-start gap-4 px-4 py-7 text-base font-medium text-muted-foreground hover:bg-white/5 rounded-2xl">
            <Settings className="h-5 w-5" />
            Configurações
          </Button>
        </div>
      </div>
    </aside>
  );
}
