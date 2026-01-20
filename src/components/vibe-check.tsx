"use client";

import { useEffect, useState } from "react";
import { Smile, Frown, Meh, Heart, Coffee, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

const moods = [
  { icon: Smile, label: "Happy", emoji: "😊" },
  { icon: Heart, label: "Loved", emoji: "❤️" },
  { icon: Coffee, label: "Relaxed", emoji: "☕" },
  { icon: Meh, label: "Neutral", emoji: "😐" },
  { icon: Frown, label: "Tired", emoji: "😴" },
  { icon: Moon, label: "Sleepy", emoji: "🌙" },
];

export function VibeCheck() {
  const [selected, setSelected] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Carregar usuário e último humor ao iniciar
  useEffect(() => {
    const fetchVibe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Pega o último vibe check deste usuário
        const { data } = await supabase
          .from('vibe_check')
          .select('mood_status')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data) setSelected(data.mood_status);
      }
    };
    fetchVibe();
  }, []);

  // 2. Salvar quando clicar
  const handleSelect = async (moodLabel: string) => {
    setSelected(moodLabel);
    if (!userId) return;

    // Simplificação: vamos usar o ID do usuário como couple_id por enquanto se não tiver parceiro
    // Idealmente você buscaria o profile.partner_id
    await supabase.from('vibe_check').insert({
        profile_id: userId,
        mood_status: moodLabel,
        couple_id: userId // TODO: Ajustar isso quando tiver a lógica de linkar casal
    });
  };

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
              onClick={() => handleSelect(mood.label)}
              className={cn(
                "group relative flex h-20 w-20 flex-col items-center justify-center gap-2 rounded-2xl transition-all duration-300",
                selected === mood.label 
                  ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30" 
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <span className="text-3xl transition-transform duration-500 group-hover:scale-125">{mood.emoji}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
