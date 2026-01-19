"use client";

import { motion, Variants } from "framer-motion";
import { VibeCheck } from "@/components/vibe-check";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Sparkles, Wallet, Heart, CheckCircle2, ArrowUpRight } from "lucide-react";

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
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-20"
    >
      {/* Header Section */}
      <motion.header variants={item} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Bem-vindos de volta</p>
          <h1 className="text-4xl font-black tracking-tighter text-foreground md:text-6xl">
            Olá, <span className="text-primary underline decoration-primary/30 underline-offset-8">Casal</span>!
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 backdrop-blur-md">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-muted-foreground">Segunda, 19 Janeiro</span>
        </div>
      </motion.header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:grid-rows-2">
        {/* Mood Check - Large Card */}
        <motion.div variants={item} className="md:col-span-2 md:row-span-1">
          <VibeCheck />
        </motion.div>

        {/* AI Planner Card - Premium Visual */}
        <motion.div variants={item} className="md:col-span-2 md:row-span-1">
          <Card className="group relative h-full overflow-hidden border-none bg-primary p-8 text-primary-foreground">
            <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-black tracking-tight mt-4">Planejador I.A.</h3>
                <p className="text-primary-foreground/80 font-medium">Deixe a inteligência artificial planejar seu próximo encontro perfeito.</p>
              </div>
              <Link href="/planner">
                <Button size="lg" className="mt-6 w-fit rounded-xl bg-white text-primary hover:bg-white/90 font-bold transition-all hover:translate-x-2">
                  Começar agora
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Finance Quick View - Medium Card */}
        <motion.div variants={item} className="md:col-span-2">
          <Card className="glass-card flex h-full flex-col justify-between p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shadow-sm border border-emerald-500/20">
                  <Wallet className="h-5 w-5" />
                </div>
                <p className="font-bold tracking-tight">Finanças Compartilhadas</p>
              </div>
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-bold px-3 py-1">Em dia</Badge>
            </div>
            <div className="mt-8">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Saldo Total</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter">R$ 4.250,00</span>
                <span className="text-sm font-bold text-emerald-500">+12%</span>
              </div>
            </div>
            <Link href="/finance">
              <Button variant="link" className="mt-6 p-0 text-primary font-bold h-fit hover:no-underline group">
                Ver detalhes <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </Button>
            </Link>
          </Card>
        </motion.div>

        {/* Tasks Quick View - Small Card */}
        <motion.div variants={item}>
          <Card className="glass-card flex h-full flex-col p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shadow-sm border border-blue-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h4 className="mt-6 font-bold tracking-tight">Tarefas Pendentes</h4>
            <div className="flex-1">
              <p className="mt-2 text-3xl font-black tracking-tighter">05</p>
            </div>
            <div className="mt-4 flex -space-x-2 overflow-hidden">
               {[1,2].map(i => (
                 <div key={i} className="inline-block h-8 w-8 rounded-full border-2 border-card bg-muted shadow-sm" />
               ))}
            </div>
          </Card>
        </motion.div>

        {/* Wishlist Quick View - Small Card */}
        <motion.div variants={item}>
          <Card className="glass-card flex h-full flex-col p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500 shadow-sm border border-pink-500/20">
              <Heart className="h-5 w-5" />
            </div>
            <h4 className="mt-6 font-bold tracking-tight">Desejos</h4>
            <div className="flex-1">
              <p className="mt-2 text-3xl font-black tracking-tighter">12</p>
            </div>
            <p className="mt-2 text-xs font-bold text-muted-foreground leading-tight">Próximo item com desconto!</p>
          </Card>
        </motion.div>
      </div>

      {/* Quote Section - Creative Touch */}
      <motion.footer variants={item} className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-8 text-center backdrop-blur-md">
        <p className="text-lg italic font-medium text-foreground/80">
          &quot;A felicidade só é real quando compartilhada.&quot;
        </p>
        <p className="mt-2 text-sm font-bold text-muted-foreground">- NósOS Assistant</p>
      </motion.footer>
    </motion.div>
  );
}
