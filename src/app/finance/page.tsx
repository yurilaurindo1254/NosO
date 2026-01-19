"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, Legend 
} from "recharts";
import { ArrowUpRight, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DATA_PIE = [
  { name: "Moradia", value: 2500, color: "#6366f1" },
  { name: "Alimentação", value: 1200, color: "#10b981" },
  { name: "Lazer", value: 500, color: "#f59e0b" },
  { name: "Assinaturas", value: 150, color: "#ec4899" },
];

const TRANSACTIONS = [
  { id: 1, title: "Supermercado Extra", category: "Alimentação", amount: -250.50, date: "Hoje", icon: "🛒" },
  { id: 2, title: "Salário João", category: "Renda", amount: 4500.00, date: "Ontem", icon: "💰" },
  { id: 3, title: "Netflix", category: "Lazer", amount: -55.90, date: "15 Mai", icon: "🎬" },
  { id: 4, title: "Aluguel", category: "Moradia", amount: -2100.00, date: "10 Mai", icon: "🏠" },
];

export default function FinancePage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Monitorando os sonhos do casal.</p>
        </div>
        <Button className="rounded-xl px-6">
          <Plus className="h-4 w-4 mr-2" /> Nova Transação
        </Button>
      </header>

      {/* Hero Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/70">Saldo Total</CardDescription>
            <CardTitle className="text-3xl font-bold">R$ 12.450,80</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium opacity-80 flex items-center gap-1">
              <ArrowUpRight className="h-4 w-4" /> +12% este mês
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none bg-emerald-50 text-emerald-900">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-700">Entradas</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-800">R$ 8.200,00</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-semibold text-emerald-600">Recebido até agora</div>
          </CardContent>
        </Card>

        <Card className="border-none bg-rose-50 text-rose-900">
          <CardHeader className="pb-2">
            <CardDescription className="text-rose-700">Saídas</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-800">R$ 4.350,20</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-semibold text-rose-600">Gasto este mês</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DATA_PIE}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {DATA_PIE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Metas e Objetivos</CardTitle>
            <Target className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {[
              { title: "Viagem Japão 🌸", current: 8500, target: 20000, color: "bg-primary" },
              { title: "Festa de Noivado 💍", current: 4200, target: 5000, color: "bg-emerald-500" },
              { title: "Novo Sofá 🛋️", current: 1500, target: 3500, color: "bg-amber-500" },
            ].map((goal, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>{goal.title}</span>
                  <span className="text-muted-foreground">
                    R$ {goal.current} / {goal.target}
                  </span>
                </div>
                <Progress value={(goal.current/goal.target)*100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            {TRANSACTIONS.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    {tx.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{tx.title}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{tx.category} • {tx.date}</span>
                  </div>
                </div>
                <div className={cn(
                  "font-bold text-sm tabular-nums",
                  tx.amount > 0 ? "text-emerald-500" : "text-slate-900"
                )}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-4 text-primary">Ver extrato completo</Button>
        </CardContent>
      </Card>
    </div>
  );
}
