"use client";

import { useState } from "react";
import { Sparkles, Send, MapPin, Calendar, DollarSign, Wand2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Suggestion = {
  title: string;
  description: string;
  location: string;
  cost: string;
  duration: string;
  tags: string[];
};

export default function PlannerPage() {
  const [messages, setMessages] = useState([
    { id: "1", role: "assistant", content: "Olá! Sou seu assistente de encontros. O que vocês estão afim de fazer hoje? Tente algo como 'Sugira um jantar romântico em casa' ou 'Ideia de passeio ao ar livre'." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastSuggestion, setLastSuggestion] = useState<Suggestion | null>(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Mock AI Response
    setTimeout(() => {
      setIsTyping(false);
      const aiMsg = { id: (Date.now() + 1).toString(), role: "assistant", content: "Com base no que vocês gostam, aqui está uma sugestão especial para hoje:" };
      setMessages(prev => [...prev, aiMsg]);
      setLastSuggestion({
        title: "Noite de Fondue & Cinema",
        description: "Preparem um fondue de chocolate com frutas e queijo com pães artesanais. Escolham um clássico romântico ou uma nova série para maratonar sob as cobertas.",
        location: "Em casa",
        cost: "R$ 80 - 150",
        duration: "3 - 4 horas",
        tags: ["Romântico", "Aconchegante", "Econômico"]
      });
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm border border-primary/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter">Planejador I.A.</h1>
        </div>
        <p className="text-muted-foreground font-medium text-sm ml-13">Fale com nossa inteligência artificial para criar o date perfeito.</p>
      </header>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6">
        {/* Chat Section */}
        <Card className="glass-card flex flex-1 flex-col overflow-hidden border-none shadow-2xl">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}
                >
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-5 py-3 text-sm font-medium shadow-sm transition-all",
                    m.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-secondary/50 text-foreground rounded-tl-none border border-white/5 backdrop-blur-sm"
                  )}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-secondary/50 rounded-2xl rounded-tl-none px-5 py-3 flex gap-1">
                  <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce" />
                  <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </motion.div>
            )}
          </div>

          <div className="p-4 bg-white/5 border-t border-white/5">
            <div className="relative flex items-center">
              <Input
                placeholder="Peça uma ideia de date..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="pr-12 h-12 bg-background/50 border-white/10 rounded-xl focus-visible:ring-primary focus-visible:border-primary font-medium"
              />
              <Button 
                size="icon" 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-1 h-10 w-10 rounded-lg transition-all active:scale-95"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-center mt-3 text-muted-foreground font-bold tracking-wider uppercase opacity-50">
              Dica: Experimente perguntar sobre dates baratinhos
            </p>
          </div>
        </Card>

        {/* Suggestion Card Section */}
        <AnimatePresence>
          {lastSuggestion && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full md:w-80"
            >
              <Card className="glass-card h-full overflow-hidden border-none shadow-2xl flex flex-col">
                <div className="bg-primary/20 h-32 flex items-center justify-center relative overflow-hidden">
                  <Wand2 className="h-12 w-12 text-primary relative z-10" />
                  <div className="absolute inset-0 bg-primary/10 blur-2xl" />
                </div>
                <CardHeader className="p-6">
                  <div className="flex gap-2 flex-wrap mb-3">
                    {lastSuggestion.tags.map(tag => (
                      <Badge key={tag} className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase">{tag}</Badge>
                    ))}
                  </div>
                  <CardTitle className="text-2xl font-black lg:grow">{lastSuggestion.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 flex-1 space-y-5">
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    {lastSuggestion.description}
                  </p>
                  
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 text-xs font-bold text-foreground/70">
                      <MapPin className="h-4 w-4 text-primary" />
                      {lastSuggestion.location}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-foreground/70">
                      <DollarSign className="h-4 w-4 text-primary" />
                      {lastSuggestion.cost}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-foreground/70">
                      <Calendar className="h-4 w-4 text-primary" />
                      {lastSuggestion.duration}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button className="w-full rounded-xl font-bold group">
                    Salvar na Agenda
                    <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
