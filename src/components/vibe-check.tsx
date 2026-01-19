"use client";

import { useState } from "react";
import { Smile, Frown, Meh, Heart, Coffee, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const moods = [
  { icon: Smile, label: "Happy", color: "text-yellow-500", bg: "bg-yellow-50", emoji: "😊" },
  { icon: Heart, label: "Loved", color: "text-rose-500", bg: "bg-rose-50", emoji: "❤️" },
  { icon: Coffee, label: "Relaxed", color: "text-amber-600", bg: "bg-amber-50", emoji: "☕" },
  { icon: Meh, label: "Neutral", color: "text-slate-500", bg: "bg-slate-50", emoji: "😐" },
  { icon: Frown, label: "Tired", color: "text-blue-500", bg: "bg-blue-50", emoji: "😴" },
  { icon: Moon, label: "Sleepy", color: "text-indigo-500", bg: "bg-indigo-50", emoji: "🌙" },
];

export function VibeCheck() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Card className="glass-card overflow-hidden border-none p-8 transition-all hover:shadow-primary/5">
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight text-foreground">Como vocês estão hoje?</h3>
          <p className="text-sm text-muted-foreground">O humor de vocês define o tom do dia.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {moods.map((mood) => (
            <button
              key={mood.label}
              onClick={() => setSelected(mood.label)}
              className={cn(
                "group relative flex h-20 w-20 flex-col items-center justify-center gap-2 rounded-2xl transition-all duration-300",
                selected === mood.label 
                  ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30" 
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <span className="text-3xl transition-transform duration-500 group-hover:scale-125">{mood.emoji}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{mood.label}</span>
              {selected === mood.label && (
                <div className="absolute inset-0 rounded-2xl border-2 border-primary-foreground/30 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
