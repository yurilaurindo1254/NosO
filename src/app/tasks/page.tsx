"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const INITIAL_TASKS = [
  { id: 1, title: "Lavar a louça", category: "Cozinha", assignedTo: "me", status: "pending", recurring: true },
  { id: 2, title: "Aspirar a sala", category: "Limpeza", assignedTo: "partner", status: "pending", recurring: false },
  { id: 3, title: "Supermercado", category: "Compras", assignedTo: "all", status: "done", recurring: false },
  { id: 4, title: "Regar as plantas", category: "Jardim", assignedTo: "me", status: "pending", recurring: true },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, status: t.status === "done" ? "pending" : "done" } : t
    ));
  };

  const renderTaskList = (filter: "me" | "partner" | "all") => {
    const filteredTasks = tasks.filter(t => filter === "all" || t.assignedTo === filter || t.assignedTo === "all");

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
                    onCheckedChange={() => toggleTask(task.id)}
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
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                <Input placeholder="Ex: Lavar a louça" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Input placeholder="Ex: Cozinha" />
              </div>
              <Button className="w-full" onClick={() => setIsAddDialogOpen(false)}>Salvar Tarefa</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-12 rounded-xl">
          <TabsTrigger value="me" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Minhas</TabsTrigger>
          <TabsTrigger value="partner" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Parceiro</TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Todas</TabsTrigger>
        </TabsList>
        <TabsContent value="me">{renderTaskList("me")}</TabsContent>
        <TabsContent value="partner">{renderTaskList("partner")}</TabsContent>
        <TabsContent value="all">{renderTaskList("all")}</TabsContent>
      </Tabs>
    </div>
  );
}
