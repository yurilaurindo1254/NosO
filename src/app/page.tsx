"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { VibeCheck } from "@/components/vibe-check";
import { LoveCounter } from "@/components/love-counter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Sparkles, Wallet, Heart, CheckCircle2, ArrowUpRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function DashboardPage() {
  const [userName, setUserName] = useState("Amor");
  const [loading, setLoading] = useState(true);
  
  // Estados para os Resumos
  const [financeSummary, setFinanceSummary] = useState({ balance: 0 });
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  
  // Estado para o Relacionamento
  const [relationshipData, setRelationshipData] = useState<{ start: string | null, status: string }>({ start: null, status: 'Namorando' });

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 1. Pegar Perfil Completo
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
            setUserName(profile.full_name?.split(' ')[0] || "Amor");
            setRelationshipData({
                start: profile.relationship_start_date,
                status: profile.relationship_status || 'Namorando'
            });
        }

        // 2. Calcular Finanças (Resumo rápido do casal)
        const { data: transactions } = await supabase.from('transactions').select('amount, type');
        if (transactions) {
          const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
          const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
          setFinanceSummary({ balance: income - expense });
        }

        // 3. Contar Tarefas Pendentes
        const { count: tasksCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        setPendingTasksCount(tasksCount || 0);

        // 4. Contar Wishlist
        const { count: wishesCount } = await supabase.from('wishlist_items').select('*', { count: 'exact', head: true });
        setWishlistCount(wishesCount || 0);
      }
      setLoading(false);
    }

    loadDashboardData();
  }, []);

  const todayDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-20"
    >
      {/* Header Section */}
      <motion.header variants={item} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Bem-vindos de volta</p>
          <h1 className="text-4xl font-black tracking-tighter text-foreground md:text-6xl capitalize">
            Olá, <span className="text-primary underline decoration-primary/30 underline-offset-8">{userName}</span>!
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 backdrop-blur-md">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-muted-foreground capitalize">{todayDate}</span>
        </div>
      </motion.header>

      {/* Love Counter Section (Se tiver data configurada) */}
      {relationshipData.start && (
         <motion.div variants={item}>
            <LoveCounter startDate={relationshipData.start} status={relationshipData.status} />
         </motion.div>
      )}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:grid-rows-2">
        {/* Mood Check - Large Card */}
        <motion.div variants={item} className="md:col-span-2 md:row-span-1">
          <VibeCheck />
        </motion.div>

        {/* AI Planner Card - Premium Visual */}
        <motion.div variants={item} className="md:col-span-2 md:row-span-1">
          <Link href="/planner" className="h-full block">
            <Card className="group relative h-full overflow-hidden border-none bg-primary p-8 text-primary-foreground transition-all hover:scale-[1.02]">
                <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
                <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                    <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight mt-4">Planejador I.A.</h3>
                    <p className="text-primary-foreground/80 font-medium">Deixe a inteligência artificial planejar seu próximo encontro perfeito.</p>
                </div>
                <Button size="lg" className="mt-6 w-fit rounded-xl bg-white text-primary hover:bg-white/90 font-bold">
                    Começar agora <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
                </div>
            </Card>
          </Link>
        </motion.div>

        {/* Finance Quick View */}
        <motion.div variants={item} className="md:col-span-2">
          <Link href="/finance">
            <Card className="glass-card flex h-full flex-col justify-between p-8 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shadow-sm border border-emerald-500/20">
                    <Wallet className="h-5 w-5" />
                    </div>
                    <p className="font-bold tracking-tight">Finanças</p>
                </div>
                <Badge variant="outline" className="font-bold px-3 py-1 border-emerald-500/20 bg-emerald-500/5 text-emerald-500">
                    Disponível
                </Badge>
                </div>
                <div className="mt-8">
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Saldo Total</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tighter">
                    {financeSummary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
                </div>
            </Card>
          </Link>
        </motion.div>

        {/* Tasks Quick View */}
        <motion.div variants={item}>
          <Link href="/tasks">
            <Card className="glass-card flex h-full flex-col p-8 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shadow-sm border border-blue-500/20">
                <CheckCircle2 className="h-5 w-5" />
                </div>
                <h4 className="mt-6 font-bold tracking-tight">Tarefas</h4>
                <div className="flex-1">
                <p className="mt-2 text-3xl font-black tracking-tighter">{pendingTasksCount}</p>
                </div>
                <p className="mt-2 text-xs font-bold text-muted-foreground leading-tight">Pendências para resolver juntos.</p>
            </Card>
          </Link>
        </motion.div>

        {/* Wishlist Quick View */}
        <motion.div variants={item}>
          <Link href="/wishlist">
            <Card className="glass-card flex h-full flex-col p-8 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500 shadow-sm border border-pink-500/20">
                <Heart className="h-5 w-5" />
                </div>
                <h4 className="mt-6 font-bold tracking-tight">Desejos</h4>
                <div className="flex-1">
                <p className="mt-2 text-3xl font-black tracking-tighter">{wishlistCount}</p>
                </div>
                <p className="mt-2 text-xs font-bold text-muted-foreground leading-tight">Sonhos compartilhados.</p>
            </Card>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
