"use client";

import { useEffect, useState, useCallback } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ChefHat, CalendarDays, ShoppingCart, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// Tipos
type Recipe = {
  id: string;
  title: string;
  category: string;
  ingredients: string;
};

type MealPlan = {
  id: string;
  date: string;
  meal_type: 'almoco' | 'jantar';
  recipe_id: string | null;
  custom_text: string | null;
  recipes?: Recipe; // Join
};

export default function MealsPage() {
  const [activeTab, setActiveTab] = useState("planner");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Estados de Formulário
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  
  // Novo Planejamento
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedType, setSelectedType] = useState<'almoco' | 'jantar'>('almoco');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("custom");
  const [customMealText, setCustomMealText] = useState("");

  // Nova Receita
  const [newRecipeTitle, setNewRecipeTitle] = useState("");
  const [newRecipeIng, setNewRecipeIng] = useState("");

  // Datas da semana atual
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Começa na segunda
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      
      // Buscar Receitas
      const { data: recipesData } = await supabase.from('recipes').select('*').order('title');
      if (recipesData) setRecipes(recipesData);

      // Buscar Planejamento (Desta semana)
      // Nota: Em produção, filtrar por range de data seria melhor
      const { data: plansData } = await supabase
        .from('meal_plans')
        .select('*, recipes(*)')
        .order('date');
      if (plansData) setMealPlans(plansData as unknown as MealPlan[]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchData(); 
  }, []);

  // Ações
  const handleSaveRecipe = async () => {
    if (!userId || !newRecipeTitle) return;
    const { error } = await supabase.from('recipes').insert({
        title: newRecipeTitle,
        ingredients: newRecipeIng,
        couple_id: userId, // Simplificado, idealmente busca do profile
    });
    if (!error) {
        setIsRecipeOpen(false);
        setNewRecipeTitle(""); setNewRecipeIng("");
        fetchData();
    }
  };

  const handleOpenPlan = (date: Date, type: 'almoco' | 'jantar') => {
      setSelectedDate(date);
      setSelectedType(type);
      
      // Verificar se já existe plano
      const existing = mealPlans.find(p => isSameDay(new Date(p.date), date) && p.meal_type === type);
      if (existing) {
          if (existing.recipe_id) setSelectedRecipeId(existing.recipe_id);
          else {
              setSelectedRecipeId("custom");
              setCustomMealText(existing.custom_text || "");
          }
      } else {
          setSelectedRecipeId("custom");
          setCustomMealText("");
      }
      setIsPlanOpen(true);
  };

  const handleSavePlan = async () => {
      if (!selectedDate || !userId) return;
      
      const payload = {
          date: format(selectedDate, 'yyyy-MM-dd'),
          meal_type: selectedType,
          recipe_id: selectedRecipeId === 'custom' ? null : selectedRecipeId,
          custom_text: selectedRecipeId === 'custom' ? customMealText : null,
          couple_id: userId
      };

      // Verificar se já existe para atualizar ou inserir
      const existing = mealPlans.find(p => isSameDay(new Date(p.date), selectedDate) && p.meal_type === selectedType);

      if (existing) {
          await supabase.from('meal_plans').update(payload).eq('id', existing.id);
      } else {
          await supabase.from('meal_plans').insert(payload);
      }
      
      setIsPlanOpen(false);
      fetchData();
  };

  const handleDeletePlan = async (id: string) => {
      await supabase.from('meal_plans').delete().eq('id', id);
      fetchData();
  };

  const generateShoppingList = () => {
    // Pega os ingredientes dos planos da semana
    const ingredients = mealPlans
        .filter(p => p.recipe_id && p.recipes?.ingredients)
        .map(p => p.recipes!.ingredients)
        .join(", ");
    
    if (!ingredients) return alert("Nenhuma receita com ingredientes planejada para esta semana.");
    
    navigator.clipboard.writeText(ingredients);
    alert("Ingredientes copiados para a área de transferência! Cole no WhatsApp ou Wishlist.");
  };

  return (
    <div className="flex flex-col gap-6 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refeições</h1>
          <p className="text-muted-foreground">O cardápio da semana.</p>
        </div>
        <Button variant="outline" size="icon" onClick={generateShoppingList} title="Gerar Lista de Compras">
            <ShoppingCart className="h-5 w-5 text-primary" />
        </Button>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
            <TabsTrigger value="planner" className="rounded-lg gap-2"><CalendarDays className="h-4 w-4"/> Semana</TabsTrigger>
            <TabsTrigger value="recipes" className="rounded-lg gap-2"><ChefHat className="h-4 w-4"/> Receitas</TabsTrigger>
        </TabsList>

        {/* ABA 1: PLANNER */}
        <TabsContent value="planner" className="mt-6 space-y-4">
            <div className="grid gap-4">
                {weekDays.map((day) => (
                    <Card key={day.toString()} className={cn("overflow-hidden border-none shadow-sm", isSameDay(day, today) ? "bg-primary/5 border border-primary/20" : "bg-card")}>
                        <CardHeader className="p-4 pb-2 bg-muted/30">
                            <CardTitle className="text-sm font-bold flex justify-between uppercase tracking-wider text-muted-foreground">
                                {format(day, "EEEE", { locale: ptBR })}
                                <span className={cn("text-xs font-normal", isSameDay(day, today) && "text-primary font-bold")}>{format(day, "d MMM", { locale: ptBR })}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 grid grid-cols-2 divide-x divide-muted">
                            {['almoco', 'jantar'].map((type) => {
                                const plan = mealPlans.find(p => isSameDay(new Date(p.date), day) && p.meal_type === type);
                                return (
                                    <button 
                                        key={type} 
                                        onClick={() => handleOpenPlan(day, type as 'almoco'|'jantar')}
                                        className="p-4 text-left hover:bg-muted/50 transition-colors min-h-[80px] flex flex-col justify-center relative group"
                                    >
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">
                                            {type === 'almoco' ? 'Almoço' : 'Jantar'}
                                        </span>
                                        {plan ? (
                                            <>
                                                <span className="font-semibold text-sm leading-tight line-clamp-2">
                                                    {plan.recipe_id ? plan.recipes?.title : plan.custom_text}
                                                </span>
                                                {/* Botão de excluir discreto */}
                                                <div 
                                                    onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground/40 text-sm italic">Planejar...</span>
                                        )}
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabsContent>

        {/* ABA 2: RECEITAS */}
        <TabsContent value="recipes" className="mt-6">
            <div className="flex justify-end mb-4">
                <Dialog open={isRecipeOpen} onOpenChange={setIsRecipeOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl"><Plus className="h-4 w-4 mr-2"/> Nova Receita</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Adicionar Prato</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input placeholder="Nome do prato (ex: Strogonoff)" value={newRecipeTitle} onChange={e => setNewRecipeTitle(e.target.value)} />
                            <textarea 
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                                placeholder="Ingredientes (opcional, para lista de compras)"
                                value={newRecipeIng}
                                onChange={e => setNewRecipeIng(e.target.value)}
                            />
                            <Button onClick={handleSaveRecipe} className="w-full">Salvar</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {recipes.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        <Utensils className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>Nenhuma receita salva ainda.</p>
                    </div>
                ) : recipes.map(recipe => (
                    <Card key={recipe.id} className="hover:bg-muted/50 cursor-pointer transition-all border-none bg-card shadow-sm">
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm font-bold line-clamp-2">{recipe.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-xs text-muted-foreground line-clamp-3">
                                {recipe.ingredients || "Sem ingredientes listados."}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabsContent>
      </Tabs>

      {/* DIALOG DE PLANEJAMENTO */}
      <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
        <DialogContent className="sm:max-w-md border-none bg-background/95 backdrop-blur-xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                    {selectedType === 'almoco' ? '☀️' : '🌙'} 
                    <span className="capitalize">{selectedType}</span> de 
                    <span className="text-primary">{selectedDate && format(selectedDate, "EEEE", { locale: ptBR })}</span>
                </DialogTitle>
                <CardDescription>Qual é o plano para matar a fome?</CardDescription>
            </DialogHeader>

            <Tabs defaultValue="cook" className="w-full mt-2" onValueChange={(val) => {
                if (val === 'cook') {
                    setCustomMealText("");
                    setSelectedRecipeId(recipes[0]?.id || "");
                } else {
                    setSelectedRecipeId("custom");
                }
            }}>
                <TabsList className="grid w-full grid-cols-2 mb-4 h-12">
                    <TabsTrigger value="cook" className="gap-2 text-md">👨‍🍳 Cozinhar</TabsTrigger>
                    <TabsTrigger value="order" className="gap-2 text-md">🛵 Pedir / Sair</TabsTrigger>
                </TabsList>

                <TabsContent value="cook" className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
                    {recipes.length > 0 ? (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground">Escolha o prato do chef:</label>
                            <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                                <SelectTrigger className="h-12 text-lg bg-muted/30 border-primary/20 focus:ring-primary"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {recipes.map(r => (
                                        <SelectItem key={r.id} value={r.id} className="cursor-pointer">
                                            <span className="font-bold">{r.title}</span>
                                            <span className="ml-2 text-xs text-muted-foreground">({r.category})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-center text-muted-foreground mt-2">
                                &quot;Cozinhar é fazer poesia para ser degustada.&quot; 🍝
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                            <Utensils className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Sem receitas salvas ainda!</p>
                            <Button variant="link" onClick={() => setIsRecipeOpen(true)} className="text-primary">Criar uma agora</Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="order" className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="space-y-3">
                         <label className="text-sm font-medium text-muted-foreground">O que vamos pedir ou onde vamos?</label>
                         <Input 
                            placeholder="Ex: Pizza Hut, Japa, Hamburguer..." 
                            value={customMealText}
                            onChange={e => {
                                setCustomMealText(e.target.value);
                                setSelectedRecipeId("custom");
                            }}
                            className="h-12 text-lg bg-muted/30 border-primary/20 focus:border-primary transition-all"
                            autoFocus
                        />
                        <div className="flex flex-wrap gap-2">
                            {['🍕 Pizza', '🍔 Burguer', '🍣 Japa', '🥗 Salada', '🥡 Ifood', '🌮 Mexicano', '🍽️ Restaurante'].map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => {
                                        setCustomMealText(tag);
                                        setSelectedRecipeId("custom");
                                    }}
                                    className="px-3 py-1 rounded-full bg-muted/50 text-xs font-medium hover:bg-primary hover:text-white transition-colors border border-transparent hover:border-primary/20"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
                
            <Button onClick={handleSavePlan} className="w-full mt-4 h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20">
                Confirmar Escolha
            </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
