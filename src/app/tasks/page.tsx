"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, MoreHorizontal, Calendar, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// Definindo o tipo baseado no seu SQL
type Task = {
  id: string;
  title: string;
  category: string;
  assigned_to: string | null;
  status: "pending" | "done";
  recurring: boolean;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Estados do formulário
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("");

  // 1. Buscar tarefas
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setUserId(user.id);
      // Aqui estamos buscando tarefas onde o assigned_to é o usuário OU o casal (simplificado)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data && !error) setTasks(data as unknown as Task[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 2. Marcar como feito/pendente
  const toggleTask = async (id: string, currentStatus: string) => {
    // Atualização otimista (muda na tela antes do banco)
    setTasks(tasks.map(t => t.id === id ? { ...t, status: currentStatus === 'done' ? 'pending' : 'done' } : t));

    await supabase
      .from('tasks')
      .update({ status: currentStatus === 'done' ? 'pending' : 'done' })
      .eq('id', id);
  };

  // 3. Adicionar Tarefa
  const handleAddTask = async () => {
    if (!newTaskTitle || !userId) return;

    const { error } = await supabase.from('tasks').insert({
        title: newTaskTitle,
        category: newTaskCategory || "Geral",
        assigned_to: userId, // Assume que é para quem criou por enquanto
        couple_id: userId, // TODO: Ajustar para ID do casal
        status: 'pending'
    });

    if (!error) {
        setIsAddDialogOpen(false);
        setNewTaskTitle("");
        setNewTaskCategory("");
        fetchTasks(); // Recarrega a lista
    } else {
        alert("Erro ao criar: " + error.message);
    }
  };

  const renderTaskList = (filter: "me" | "partner" | "all") => {
    // Filtro simples no front
    const filteredTasks = tasks.filter(t => {
       if (filter === 'all') return true;
       if (filter === 'me') return t.assigned_to === userId;
       if (filter === 'partner') return t.assigned_to !== userId; // Simplificado
       return true;
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
      <div className="flex flex-col gap-3 mt-4">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            <Info className="h-8 w-8 mb-2 opacity-20" />
            <p>Nenhuma tarefa encontrada.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className={cn("transition-all duration-300", task.status === "done" && "opacity-60")}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox 
                    checked={task.status === "done"} 
                    onCheckedChange={() => toggleTask(task.id, task.status)}
                    className="h-5 w-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-sm font-medium transition-all",
                      task.status === "done" && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-bold text-primary/70">{task.category}</span>
                      {task.recurring && <Calendar className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => {
                    if(confirm("Deletar tarefa?")) {
                        await supabase.from('tasks').delete().eq('id', task.id);
                        fetchTasks();
                    }
                }}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-muted-foreground">O que temos para hoje?</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full h-12 w-12 md:h-10 md:w-auto md:px-4 shadow-lg md:shadow-none">
              <Plus className="h-6 w-6 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">Nova Tarefa</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input 
                    placeholder="Ex: Lavar a louça" 
                    value={newTaskTitle} 
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Input 
                    placeholder="Ex: Cozinha" 
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleAddTask}>Salvar Tarefa</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-12 rounded-xl">
          <TabsTrigger value="me" className="rounded-lg">Minhas</TabsTrigger>
          <TabsTrigger value="partner" className="rounded-lg">Parceiro</TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg">Todas</TabsTrigger>
        </TabsList>
        <TabsContent value="me">{renderTaskList("me")}</TabsContent>
        <TabsContent value="partner">{renderTaskList("partner")}</TabsContent>
        <TabsContent value="all">{renderTaskList("all")}</TabsContent>
      </Tabs>
    </div>
  );
}
