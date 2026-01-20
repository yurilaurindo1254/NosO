"use client";

import { useEffect, useState } from "react";
import { intervalToDuration } from "date-fns";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoveCounterProps {
  startDate: string | null; // Formato YYYY-MM-DD
  status?: string;
}

export function LoveCounter({ startDate, status = "Juntos" }: LoveCounterProps) {
  const [duration, setDuration] = useState<IntervalToDuration>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!startDate) return;

    const start = new Date(startDate);
    
    // Atualiza a cada segundo
    const timer = setInterval(() => {
      const now = new Date();
      setDuration(intervalToDuration({ start, end: now }));
    }, 1000);

    // Primeira execução imediata
    setDuration(intervalToDuration({ start, end: new Date() }));

    return () => clearInterval(timer);
  }, [startDate]);

  if (!isMounted || !startDate) return null;

  const timeUnits = [
    { label: "Anos", value: duration.years || 0 },
    { label: "Meses", value: duration.months || 0 },
    { label: "Dias", value: duration.days || 0 },
    { label: "Horas", value: duration.hours || 0 },
    { label: "Min", value: duration.minutes || 0 },
    { label: "Seg", value: duration.seconds || 0 },
  ];

  // Define a type for the duration if not imported from date-fns
  type IntervalToDuration = {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
  };

  return (
    <Card className="glass-card overflow-hidden border-none p-6 relative">
      {/* Background Decorativo Animado */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
        >
            <Heart className="h-24 w-24 text-rose-500/10 fill-rose-500/10" />
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500 fill-rose-500 animate-pulse" />
            <span className="font-bold text-lg tracking-tight uppercase text-rose-600 dark:text-rose-400">
                {status} há...
            </span>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {timeUnits.map((unit, index) => (
                <motion.div 
                    key={unit.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-background/40 backdrop-blur-sm border border-white/5"
                >
                    <span className="text-xl md:text-2xl font-black tabular-nums text-foreground">
                        {String(unit.value).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {unit.label}
                    </span>
                </motion.div>
            ))}
        </div>
      </div>
    </Card>
  );
}
