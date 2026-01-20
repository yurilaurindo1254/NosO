"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, Legend 
} from "recharts";
import { 
  ArrowUpRight, Plus, Target, ArrowDownRight, Wallet, Loader2, 
  PiggyBank, Pencil, Calculator, Trash2, CheckCircle2, TrendingUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
};

type Goal = {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
};

type FixedExpense = {
  id: string;
  title: string;
  amount: number;
};

type BudgetConfig = {
  savings_percentage: number;
};

// --- Constants ---

const EXPENSE_CATEGORIES = [
    { icon: "🏠", label: "Moradia", color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" },
    { icon: "🍔", label: "Comida", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
    { icon: "🚗", label: "Transporte", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { icon: "🛍️", label: "Compras", color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" },
    { icon: "🎬", label: "Lazer", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
    { icon: "💊", label: "Saúde", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { icon: "🎓", label: "Educação", color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400" },
    { icon: "💡", label: "Contas", color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { icon: "✈️", label: "Viagem", color: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" },
    { icon: "💸", label: "Outros", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
];

const INCOME_CATEGORIES = [
    { icon: "💼", label: "Salário", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { icon: "⚡", label: "Freelance", color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
    { icon: "🎁", label: "Presente", color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" },
    { icon: "📈", label: "Investimento", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { icon: "💰", label: "Outros", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
];

const FUN_PLACEHOLDERS = [
  "Pizza de sexta 🍕", "Mimo merecido 💅", "Investimento no futuro 🚀",
  "Boleto chato 🙄", "Jantar romântico 🕯️", "Mercado do mês 🛒",
  "Uber da preguiça 🚗", "Presentinho pro love 🎁"
];

// Fallback Colors for Charts
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#ef4444", "#3b82f6", "#8b5cf6", "#14b8a6"];

export default function FinancePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>({ savings_percentage: 20 });
  const [chartData, setChartData] = useState<any[]>([]);

  // UI States
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddFixedOpen, setIsAddFixedOpen] = useState(false);

  // Transaction Form
  const [txDesc, setTxDesc] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("Outros");
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [randomPlaceholder, setRandomPlaceholder] = useState("");

  // Goal Form
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");

  // Budget/Fixed Form
  const [fixedTitle, setFixedTitle] = useState("");
  const [fixedAmount, setFixedAmount] = useState("");

  // --- Computed ---
  const totalBalance = transactions.reduce((acc, curr) => acc + (curr.type === 'income' ? curr.amount : -curr.amount), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  
  // Planner Calculations
  const monthlyFixedExpenses = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Sobra Estimada = Total Planned Income (Assuming 'totalIncome' is current monthly income) - Fixed Expenses
  // In a real app, 'Income' might need to be 'Planned Income' too, but using actuals for now.
  const remainingAfterFixed = Math.max(0, totalIncome - monthlyFixedExpenses);
  
  const suggestedSavings = remainingAfterFixed * (budgetConfig.savings_percentage / 100);
  const freeToSpend = remainingAfterFixed - suggestedSavings; // "Livre para gastar" (Variable Expenses budget)

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      
      // 1. Transactions
      const { data: txs } = await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(50);
      if (txs) {
        const formattedTxs = txs.map(t => ({...t, amount: Number(t.amount)})) as Transaction[];
        setTransactions(formattedTxs);
        
        // Prepare Pie Chart Data
        const catMap: Record<string, number> = {};
        formattedTxs.filter(t => t.type === 'expense').forEach(t => {
            catMap[t.category] = (catMap[t.category] || 0) + t.amount;
        });
        const newChartData = Object.keys(catMap).map((k, i) => ({
            name: k, value: catMap[k], 
            color: EXPENSE_CATEGORIES.find(c => c.label === k)?.color.split(' ')[1].replace('text-', '#') || COLORS[i % COLORS.length]
        })).map((d) => ({...d, color: d.color.startsWith('#') ? d.color : COLORS[0]})); // Safety check
        setChartData(newChartData);
      }

      // 2. Goals
      const { data: goalsData } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
      if (goalsData) setGoals(goalsData.map(g => ({...g, target_amount: Number(g.target_amount), current_amount: Number(g.current_amount)})));

      // 3. Fixed Expenses
      const { data: fixedData } = await supabase.from('fixed_expenses').select('*').order('created_at', { ascending: true });
      if (fixedData) setFixedExpenses(fixedData.map(f => ({...f, amount: Number(f.amount)})));

      // 4. Budget Config
      const { data: budgetData } = await supabase.from('budget_configs').select('savings_percentage').eq('user_id', user.id).single();
      if (budgetData) setBudgetConfig({ savings_percentage: budgetData.savings_percentage });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Effects
  useEffect(() => {
    if (isAddTxOpen) setRandomPlaceholder(FUN_PLACEHOLDERS[Math.floor(Math.random() * FUN_PLACEHOLDERS.length)]);
  }, [isAddTxOpen]);

  // Handlers
  const handleAddTransaction = async () => {
    if (!userId || !txDesc || !txAmount) { alert("Preencha tudo!"); return; }
    const { error } = await supabase.from('transactions').insert({
      description: txDesc, amount: parseFloat(txAmount), category: txCategory, type: txType, couple_id: userId, payer_id: userId
    });
    if (!error) { setIsAddTxOpen(false); setTxDesc(""); setTxAmount(""); setTxCategory("Outros"); fetchData(); } 
    else alert(error.message);
  };

  const handleAddGoal = async () => {
    if (!userId || !goalTitle || !goalTarget) { alert("Preencha título e meta!"); return; }
    const { error } = await supabase.from('goals').insert({
        title: goalTitle, target_amount: parseFloat(goalTarget), current_amount: 0, couple_id: userId
    });
    if (!error) { setIsAddGoalOpen(false); setGoalTitle(""); setGoalTarget(""); fetchData(); } 
    else alert(error.message);
  };

  const handleAddFixedExpense = async () => {
      if (!userId || !fixedTitle || !fixedAmount) { alert("Preencha título e valor!"); return; }
      const { error } = await supabase.from('fixed_expenses').insert({
          user_id: userId, title: fixedTitle, amount: parseFloat(fixedAmount)
      });
      if (!error) { setIsAddFixedOpen(false); setFixedTitle(""); setFixedAmount(""); fetchData(); }
      else alert(error.message);
  };

  const handleDeleteFixedExpense = async (id: string) => {
      if (!confirm("Remover esta despesa fixa?")) return;
      const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
      if (!error) fetchData();
  };

  const handleSavingsChange = async (val: number[]) => {
      setBudgetConfig(prev => ({ ...prev, savings_percentage: val[0] }));
      if (userId) await supabase.from('budget_configs').upsert({ user_id: userId, savings_percentage: val[0] }, { onConflict: 'user_id' });
  };

  const currentCategories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto">
      <header className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planner Financeiro</h1>
          <p className="text-muted-foreground">Planeje, economize e realize sonhos.</p>
        </div>
        <div className="flex gap-2">
            <Dialog open={isAddTxOpen} onOpenChange={setIsAddTxOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full shadow-lg font-bold">
                <Plus className="h-4 w-4 mr-2" /> Nova Transação
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle className="text-center">Nova Movimentação</DialogTitle></DialogHeader>
                <div className="space-y-6 py-2">
                <div className="flex justify-center">
                    <Tabs defaultValue="expense" value={txType} onValueChange={(v) => { setTxType(v as 'income'|'expense'); setTxCategory("Outros"); }} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
                            <TabsTrigger value="expense" className="rounded-lg font-bold data-[state=active]:text-rose-500">💸 Despesa</TabsTrigger>
                            <TabsTrigger value="income" className="rounded-lg font-bold data-[state=active]:text-emerald-500">💰 Receita</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">R$</span>
                    <Input type="number" placeholder="0,00" className="pl-12 h-14 text-2xl font-bold rounded-xl border-primary/20 bg-primary/5 focus-visible:ring-primary/30" value={txAmount} onChange={e => setTxAmount(e.target.value)} autoFocus />
                </motion.div>
                <Input placeholder={randomPlaceholder} className="h-11 rounded-xl" value={txDesc} onChange={e => setTxDesc(e.target.value)} />
                <div className="grid grid-cols-5 gap-2">
                    {currentCategories.map((cat) => (
                        <button key={cat.label} onClick={() => setTxCategory(cat.label)}
                            className={cn("flex flex-col items-center p-2 rounded-xl border-2 transition-all", txCategory === cat.label ? "border-primary bg-primary/10" : "border-transparent bg-muted/30 opacity-70 hover:opacity-100")}>
                            <span className="text-xl">{cat.icon}</span><span className="text-[9px] font-medium truncate w-full text-center">{cat.label}</span>
                        </button>
                    ))}
                </div>
                <Button className="w-full h-12 rounded-xl text-lg font-bold" onClick={handleAddTransaction}>Salvar</Button>
                </div>
            </DialogContent>
            </Dialog>
        </div>
      </header>

      {/* BENTO GRID LAYOUT - STRICT 4x3 (Desktop) | DYNAMIC 2-COL (Mobile) */}
      <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-3 gap-3 md:gap-6 lg:gap-8 md:min-h-[600px] lg:h-[calc(100vh-200px)] lg:min-h-[750px] auto-rows-[auto] w-full max-w-[1800px] mx-auto">
        
        {/* 1. CHART: Top-Left (Desktop 2x2) | Mobile (Full Wide 2x1) */}
        <Card className="col-span-2 md:col-span-2 md:row-span-2 order-3 md:order-1 border-none bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl shadow-sm flex flex-col min-h-[220px]">
            <CardHeader className="pb-0"><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-purple-500"/> Gastos por Categoria</CardTitle></CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 p-4">
                {chartData.length > 0 ? (
                    <>
                        <div className="flex-1 w-full relative min-h-[200px] md:min-h-0">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" cornerRadius={6}>
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} className="md:hidden"/>
                                </PieChart>
                             </ResponsiveContainer>
                             {/* Centered Total Label overlay could go here */}
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none md:hidden">
                                <span className="text-xs font-bold text-muted-foreground opacity-20">Total</span>
                             </div>
                        </div>
                        
                        {/* Desktop Side Panel: Category List */}
                        <div className="hidden md:flex w-[240px] flex-col gap-3 overflow-y-auto pr-2 border-l pl-4 border-dashed border-slate-200 dark:border-slate-800">
                             <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Detalhes</p>
                             {chartData.sort((a,b) => b.value - a.value).map((cat) => (
                                 <div key={cat.name} className="flex flex-col gap-1">
                                     <div className="flex justify-between items-center text-xs">
                                         <span className="flex items-center gap-2 font-medium">
                                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                             {cat.name}
                                         </span>
                                         <span className="font-bold">{cat.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                     </div>
                                     <div className="h-1 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                         <div className="h-full rounded-full opacity-80" style={{ width: `${(cat.value / totalExpense) * 100}%`, backgroundColor: cat.color }} />
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </>
                ) : <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground opacity-50"><PiggyBank className="h-12 w-12 mb-2"/>Sem dados ainda</div>}
            </CardContent>
        </Card>

        {/* 2. BALANCE: Top-Mid (Desktop 1x1) | Mobile (Full Wide 2x1) */}
        <Card className="col-span-2 md:col-span-1 md:row-span-1 order-1 md:order-2 border-none bg-gradient-to-br from-primary/90 to-blue-600 text-white shadow-xl shadow-primary/20 relative overflow-hidden group flex flex-col justify-center min-h-[140px]">
            <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full -mr-4 -mt-4 blur-xl group-hover:bg-white/20 transition-all"/>
            <CardHeader className="pb-1"><CardDescription className="text-blue-100">Saldo Atual</CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight">{totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4"><div className="text-[10px] font-semibold bg-white/20 w-fit px-2 py-0.5 rounded-full flex items-center gap-1"><Wallet className="h-3 w-3"/> Disponível</div></CardContent>
        </Card>

        {/* 3. INCOME: Top-Right (Desktop 1x1) | Mobile (Half 1x1) */}
        <Card className="col-span-1 md:col-span-1 md:row-span-1 order-2 md:order-3 border-none bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 flex flex-col justify-center min-h-[100px]">
             <CardHeader className="p-4 md:py-4"><CardDescription className="text-emerald-600/80 dark:text-emerald-300 text-[10px] uppercase font-bold">Entradas</CardDescription>
             <CardTitle className="text-lg md:text-xl">{totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardTitle></CardHeader>
        </Card>

        {/* 4. EXPENSE: Mid-Right (Desktop 1x1) | Mobile (Half 1x1) */}
        <Card className="col-span-1 md:col-span-1 md:row-span-1 order-2 md:order-6 border-none bg-rose-500/10 text-rose-900 dark:text-rose-100 flex flex-col justify-center min-h-[100px]">
            <CardHeader className="p-4 md:py-4"><CardDescription className="text-rose-600/80 dark:text-rose-300 text-[10px] uppercase font-bold">Saídas</CardDescription>
            <CardTitle className="text-lg md:text-xl">{totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardTitle></CardHeader>
        </Card>

        {/* 5. FIXED EXPENSES: Mid-Mid (Vertical 1x2) | Mobile (Half 1x1 - Tall) */}
        <Card className="col-span-1 md:col-start-3 md:row-start-2 md:row-span-2 order-4 md:order-5 border-none bg-indigo-50/50 dark:bg-indigo-950/20 backdrop-blur-xl flex flex-col">
             <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-4">
                 <CardTitle className="text-xs md:text-sm font-bold">Fixos</CardTitle>
                 <Dialog open={isAddFixedOpen} onOpenChange={setIsAddFixedOpen}>
                     <DialogTrigger asChild><Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-indigo-200/50"><Plus className="h-3 w-3"/></Button></DialogTrigger>
                     <DialogContent>
                         <DialogHeader><DialogTitle>Adicionar Conta Fixa</DialogTitle></DialogHeader>
                         <div className="space-y-4 py-4">
                             <Input placeholder="Título (ex: Aluguel)" value={fixedTitle} onChange={e => setFixedTitle(e.target.value)} />
                             <Input type="number" placeholder="Valor (ex: 1500)" value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} />
                             <Button onClick={handleAddFixedExpense} className="w-full">Adicionar</Button>
                         </div>
                     </DialogContent>
                 </Dialog>
             </CardHeader>
             <CardContent className="flex-1 overflow-y-auto space-y-2 px-2 pb-2 min-h-[140px]">
                 {fixedExpenses.length === 0 ? <div className="text-center text-[10px] text-muted-foreground py-4">Vazio</div> : 
                  fixedExpenses.map(f => (
                      <div key={f.id} className="flex flex-col p-2 bg-white/60 dark:bg-black/20 rounded-lg hover:bg-white/80 transition-colors group">
                          <div className="flex justify-between items-center">
                              <span className="font-semibold text-[10px] truncate max-w-[60px]">{f.title}</span>
                              <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-red-500 p-0" onClick={() => handleDeleteFixedExpense(f.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                          </div>
                          <span className="text-[10px] text-rose-500 font-bold">{f.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                  ))
                 }
             </CardContent>
             <CardFooter className="border-t p-2 bg-indigo-100/50 dark:bg-indigo-900/20 justify-center">
                 <div className="flex flex-col w-full text-[10px] font-bold px-1 items-center">
                     <span className="text-muted-foreground">Total</span>
                     <span className="text-indigo-600 dark:text-indigo-400">{monthlyFixedExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                 </div>
             </CardFooter>
        </Card>

        {/* 6. PLANNER: Bottom-Left (Horizontal 2x1) | Mobile (Full Wide 2x1) */}
        <Card className="col-span-2 md:col-start-1 md:row-start-3 md:col-span-2 order-6 md:order-4 border-none bg-amber-50/50 dark:bg-amber-950/20 backdrop-blur-xl flex flex-col justify-center min-h-[120px]">
             <CardContent className="p-4 flex flex-row items-center gap-4 h-full">
                 <div className="flex-1 space-y-1">
                     <p className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1"><PiggyBank className="h-3 w-3"/> Sobra</p>
                     <p className={cn("text-lg font-black", remainingAfterFixed > 0 ? "text-primary" : "text-muted-foreground")}>{remainingAfterFixed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                 </div>
                 <div className="flex-1 space-y-1 text-right">
                     <p className="text-[10px] text-muted-foreground font-bold uppercase">Meta ({budgetConfig.savings_percentage}%)</p>
                     <p className="text-lg font-black text-amber-500">{suggestedSavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                 </div>
                 <div className="w-1/3 pt-2">
                     <Slider value={[budgetConfig.savings_percentage]} onValueChange={handleSavingsChange} max={60} step={5} className="py-2" />
                 </div>
             </CardContent>
        </Card>
        
        {/* 7. GOALS: Bottom-Right (1x1) | Mobile (Half 1x1) */}
        <Card className="col-span-1 md:col-start-4 md:row-start-3 md:col-span-1 order-5 md:order-7 border-none bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl flex flex-col min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between pb-1 p-3 md:p-4">
                <CardTitle className="text-xs md:text-sm">Metas</CardTitle>
                <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
                  <DialogTrigger asChild><Button size="icon" variant="ghost" className="h-6 w-6"><Plus className="h-3 w-3"/></Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Nova Meta</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input placeholder="Título" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} />
                        <Input type="number" placeholder="Valor" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} />
                        <Button onClick={handleAddGoal} className="w-full">Criar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 px-2 pb-2 min-h-0">
                {goals.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-[10px] text-center opacity-50"><Target className="h-6 w-6 mb-1"/>Vazio</div> :
                 goals.map((goal) => (
                    <div key={goal.id} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold">
                            <span className="truncate max-w-[60px]">{goal.title}</span>
                            <span>{Math.round((goal.current_amount/goal.target_amount)*100)}%</span>
                        </div>
                        <Progress value={(goal.current_amount/goal.target_amount)*100} className="h-1.5 bg-muted/50" />
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
