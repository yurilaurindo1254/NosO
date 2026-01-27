"use client";

import { useEffect, useState, useCallback, ChangeEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Plus,
  Search,
  Trash2,
  ChefHat,
  Loader2,
  ShoppingCart,
  Copy,
  Check,
  Coffee,
  Sun,
  Cookie,
  Moon,
  UtensilsCrossed,
  Sparkles
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
// UI Components
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Types ---

type MealType = "cafe" | "almoco" | "lanche" | "jantar";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string | null;
  category: string;
  prep_time: number | null;
  created_at: string;
  user_id: string;
  image_url?: string | null;
}

interface MealPlan {
  id: string;
  date: string;
  meal_type: MealType;
  recipe_id: string;
  user_id: string;
  recipe?: Recipe;
  notes?: string | null;
}

interface AIResult {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string;
  prep_time: number;
}

export default function MealsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [activeTab, setActiveTab] = useState("planning");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Dialog Open States
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [isPlanMealOpen, setIsPlanMealOpen] = useState(false);

  // Selection States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMealType, setSelectedMealType] = useState<MealType>("almoco");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");

  // Search/Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // New Recipe Form
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    title: "",
    description: "",
    ingredients: [],
    instructions: "",
    category: "almoco",
    prep_time: 0,
  });

  // AI Chef
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  // Shopping List
  const [shoppingItems, setShoppingItems] = useState<string[]>([]);
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // --- Fetch Data ---

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Recipes
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

      if (recipesError) throw recipesError;
      setRecipes(recipesData || []);

      // Fetch Meal Plans for the week
      const startStr = format(weekStart, "yyyy-MM-dd");
      const endStr = format(addDays(weekStart, 6), "yyyy-MM-dd");

      const { data: plansData, error: plansError } = await supabase
        .from("meal_plans")
        .select(`
          *,
          recipe:recipes(*)
        `)
        .gte("date", startStr)
        .lte("date", endStr);

      if (plansError) throw plansError;
      setMealPlans(plansData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [weekStart, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers ---

  const handleSaveRecipe = async () => {
    try {
      if (!newRecipe.title) {
        toast.error("O título da receita é obrigatório.");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("recipes")
        .insert([{
          ...newRecipe,
          user_id: user.id,
          ingredients: Array.isArray(newRecipe.ingredients) 
            ? newRecipe.ingredients 
            : (newRecipe.ingredients as unknown as string || "").split("\n").filter(Boolean),
        }]);

      if (error) throw error;

      toast.success("Receita salva com sucesso!");
      setIsRecipeDialogOpen(false);
      setNewRecipe({
        title: "",
        description: "",
        ingredients: [],
        instructions: "",
        category: "almoco",
        prep_time: 0,
      });
      fetchData();
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast.error("Erro ao salvar receita.");
    }
  };

  const handlePlanMeal = async () => {
    try {
      if (!selectedRecipeId) {
        toast.error("Selecione uma receita.");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // Check if plan exists
      const existingPlan = mealPlans.find(
        p => p.date === dateStr && p.meal_type === selectedMealType
      );

      if (existingPlan) {
        const { error } = await supabase
          .from("meal_plans")
          .update({ recipe_id: selectedRecipeId })
          .eq("id", existingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("meal_plans")
          .insert([{
            date: dateStr,
            meal_type: selectedMealType,
            recipe_id: selectedRecipeId,
            user_id: user.id
          }]);
        if (error) throw error;
      }

      toast.success("Refeição planejada!");
      setIsPlanMealOpen(false);
      fetchData();

    } catch (error) {
      console.error("Error planning meal:", error);
      toast.error("Erro ao planejar refeição.");
    }
  };

  const handleDeleteMealPlan = async (id: string) => {
    try {
      const { error } = await supabase.from("meal_plans").delete().eq("id", id);
      if (error) throw error;
      toast.success("Plano removido.");
      fetchData();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Erro ao remover plano.");
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Receita removida.");
      fetchData();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("Erro ao remover receita.");
    }
  };

  const handleGenerateRecipe = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    setAiResult(null);

    try {
      const response = await fetch("/api/ai/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!response.ok) throw new Error("Falha na geração");

      const data = await response.json();
      setAiResult(data);
    } catch (error) {
      console.error("AI Error:", error);
      toast.error("Erro ao gerar receita. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAIRecipe = async () => {
    if (!aiResult) return;
    
    setNewRecipe({
      title: aiResult.title,
      description: aiResult.description,
      ingredients: aiResult.ingredients,
      instructions: aiResult.instructions,
      category: "almoco", // Default, could be inferred
      prep_time: aiResult.prep_time
    });
    setAiResult(null);
    setIsAIDialogOpen(false);
    setIsRecipeDialogOpen(true); // Open manual save dialog to confirm/edit
  };

  const generateShoppingList = () => {
    const items: string[] = [];
    mealPlans.forEach(plan => {
      if (plan.recipe?.ingredients) {
        plan.recipe.ingredients.forEach(ing => items.push(ing));
      }
    });

    if (items.length === 0) {
      toast.info("Nenhuma refeição planejada com ingredientes para esta semana.");
      return;
    }

    // Simple deduplication logic could go here, but raw list is fine for now
    setShoppingItems(items);
    setIsShoppingListOpen(true);
  };
  
  const copyShoppingList = () => {
    const text = shoppingItems.join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Lista copiada para a área de transferência!");
  };

  // --- Render Helpers ---

  const getMealIcon = (type: MealType) => {
    switch (type) {
      case "cafe": return <Coffee className="h-4 w-4 text-orange-500" />;
      case "almoco": return <Sun className="h-4 w-4 text-yellow-500" />;
      case "lanche": return <Cookie className="h-4 w-4 text-amber-600" />;
      case "jantar": return <Moon className="h-4 w-4 text-indigo-500" />;
      default: return <UtensilsCrossed className="h-4 w-4" />;
    }
  };

  const getMealLabel = (type: MealType) => {
    switch (type) {
      case "cafe": return "Café da Manhã";
      case "almoco": return "Almoço";
      case "lanche": return "Lanche da Tarde";
      case "jantar": return "Jantar";
      default: return type;
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto p-4 space-y-8 max-w-7xl animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Planejador de Refeições
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize sua semana e descubra novas receitas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateShoppingList}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Lista de Compras
          </Button>
          <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-200">
                <Sparkles className="mr-2 h-4 w-4" />
                Chef IA
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Chef Inteligente</DialogTitle>
                <DialogDescription>
                  Diga o que você tem na geladeira ou o que está com vontade de comer.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea 
                  placeholder="Ex: Tenho frango, batatas e creme de leite. O que posso fazer?" 
                  value={aiPrompt}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAiPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
                
                {aiResult && (
                  <div className="bg-secondary/50 p-4 rounded-md space-y-2 text-sm">
                    <h4 className="font-semibold text-primary">{aiResult.title}</h4>
                    <p>{aiResult.description}</p>
                    <div className="text-xs text-muted-foreground flex gap-4">
                      <span>⏱️ {aiResult.prep_time} min</span>
                      <span>🥘 {aiResult.ingredients.length} ingr.</span>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                {aiResult ? (
                  <Button onClick={handleSaveAIRecipe} className="w-full">
                    <Check className="mr-2 h-4 w-4" />
                    Salvar Receita
                  </Button>
                ) : (
                  <Button onClick={handleGenerateRecipe} disabled={isGenerating} className="w-full">
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChefHat className="mr-2 h-4 w-4" />}
                    Gerar Sugestões
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="planning">📅 Planejamento</TabsTrigger>
          <TabsTrigger value="recipes">📖 Receitas</TabsTrigger>
        </TabsList>

        {/* --- PLANNING TAB --- */}
        <TabsContent value="planning" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold capitalize">
              {format(weekStart, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
               ← Semana anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
                Próxima semana →
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isToday = isSameDay(day, new Date());
              const dayPlans = mealPlans.filter(p => p.date === dateStr);

              return (
                <Card key={dateStr} className={cn("flex flex-col h-full", isToday && "border-primary shadow-md")}>
                  <CardHeader className="p-3 pb-2 text-center border-b bg-muted/30">
                    <CardTitle className="text-sm font-medium">
                      {format(day, "EEE", { locale: ptBR })}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {format(day, "dd/MM")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 flex-1 space-y-2">
                    {(["cafe", "almoco", "lanche", "jantar"] as MealType[]).map((type) => {
                      const plan = dayPlans.find(p => p.meal_type === type);
                      return (
                        <div key={type} className="group relative">
                          {plan ? (
                            <div className="p-2 rounded-md bg-accent/20 border border-transparent hover:border-border transition-all text-xs">
                              <div className="flex items-center gap-1.5 mb-1 font-medium text-muted-foreground">
                                {getMealIcon(type)}
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </div>
                              <div className="font-semibold truncate">{plan.recipe?.title || "Receita desconhecida"}</div>
                              <button 
                                onClick={() => handleDeleteMealPlan(plan.id)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-1 rounded"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              className="w-full h-auto py-2 px-2 justify-start text-xs text-muted-foreground border border-dashed border-transparent hover:border-primary/50"
                              onClick={() => {
                                setSelectedDate(day);
                                setSelectedMealType(type);
                                setIsPlanMealOpen(true);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1.5" />
                              {getMealLabel(type).split(" ")[0]}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* --- RECIPES TAB --- */}
        <TabsContent value="recipes" className="space-y-6 mt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar receitas..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="cafe">Café da Manhã</SelectItem>
                  <SelectItem value="almoco">Almoço</SelectItem>
                  <SelectItem value="lanche">Lanche</SelectItem>
                  <SelectItem value="jantar">Jantar</SelectItem>
                  <SelectItem value="sobremesa">Sobremesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isRecipeDialogOpen} onOpenChange={setIsRecipeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Receita
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nova Receita</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input 
                        value={newRecipe.title} 
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewRecipe({...newRecipe, title: e.target.value})}
                        placeholder="Ex: Lasanha Bolonhesa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select 
                        value={newRecipe.category} 
                        onValueChange={(v: string) => setNewRecipe({...newRecipe, category: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cafe">Café da Manhã</SelectItem>
                          <SelectItem value="almoco">Almoço</SelectItem>
                          <SelectItem value="lanche">Lanche</SelectItem>
                          <SelectItem value="jantar">Jantar</SelectItem>
                          <SelectItem value="sobremesa">Sobremesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea 
                      value={newRecipe.description || ""} 
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewRecipe({...newRecipe, description: e.target.value})}
                      placeholder="Uma breve descrição do prato..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label>Ingredientes (um por linha)</Label>
                       <Textarea 
                        className="h-[150px] font-mono text-sm"
                        value={Array.isArray(newRecipe.ingredients) ? newRecipe.ingredients.join("\n") : newRecipe.ingredients}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewRecipe({...newRecipe, ingredients: e.target.value.split("\n")})}
                        placeholder="500g de carne moída&#10;1 cebola&#10;2 dentes de alho"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label>Modo de Preparo</Label>
                       <Textarea 
                        className="h-[150px]"
                        value={newRecipe.instructions || ""} 
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewRecipe({...newRecipe, instructions: e.target.value})}
                        placeholder="Passo a passo..."
                       />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Label>Tempo de Preparo (min)</Label>
                    <Input 
                      type="number" 
                      className="w-[100px]"
                      value={newRecipe.prep_time || ""} 
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNewRecipe({...newRecipe, prep_time: parseInt(e.target.value) || 0})} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveRecipe}>Salvar Receita</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredRecipes.length > 0 ? (
               filteredRecipes.map((recipe) => (
                <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image placeholder - could be dynamic later */}
                  <div className="h-32 bg-linear-to-r from-muted to-accent/20 flex items-center justify-center">
                    <UtensilsCrossed className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{recipe.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {recipe.description || "Sem descrição"}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="capitalize">{recipe.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4 mb-2">
                       {recipe.prep_time && (
                         <span className="flex items-center gap-1">
                           ⏱️ {recipe.prep_time} min
                         </span>
                       )}
                       <span className="flex items-center gap-1">
                         🥘 {recipe.ingredients?.length || 0} ingr.
                       </span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 bg-muted/20 flex justify-end gap-2">
                     <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRecipe(recipe.id)}>
                        <Trash2 className="h-4 w-4" />
                     </Button>
                     <Button variant="secondary" size="sm">Ver Detalhes</Button>
                  </CardFooter>
                </Card>
               ))
             ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 opacity-50" />
                   </div>
                  <p>Nenhuma receita encontrada.</p>
                  <Button variant="link" onClick={() => setIsRecipeDialogOpen(true)}>
                    Criar primeira receita
                  </Button>
                </div>
             )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Plan Meal Dialog */}
      <Dialog open={isPlanMealOpen} onOpenChange={setIsPlanMealOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planejar Refeição</DialogTitle>
            <DialogDescription>
              {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} - 
              <span className="capitalize ml-1 font-medium text-primary">
                {getMealLabel(selectedMealType)}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="space-y-2">
                <Label>Escolha uma Receita</Label>
                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
             <p className="text-xs text-muted-foreground text-center">- ou -</p>
             <Button variant="outline" className="w-full" onClick={() => { setIsPlanMealOpen(false); setIsRecipeDialogOpen(true); }}>
               Criar Nova Receita
             </Button>
          </div>
          <DialogFooter>
            <Button onClick={handlePlanMeal} disabled={!selectedRecipeId}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shopping List Dialog */}
      <Dialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Lista de Compras</DialogTitle>
             <DialogDescription>
               Ingredientes baseados no planejamento da semana.
             </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-background">
             {shoppingItems.map((item, i) => (
               <div key={i} className="flex items-center gap-2 py-2 border-b last:border-0 text-sm">
                 <div className="h-4 w-4 rounded border border-primary/50" />
                 {item}
               </div>
             ))}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={copyShoppingList} className="w-full">
               <Copy className="mr-2 h-4 w-4" />
               Copiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

