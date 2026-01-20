"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ExternalLink, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

type WishlistItem = {
    id: string;
    title: string;
    product_url: string;
    price: number;
    image_url: string;
    priority_level: number;
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form States
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data } = await supabase.from('wishlist_items').select('*').order('created_at', { ascending: false });
        if (data) setItems(data as unknown as WishlistItem[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAddItem = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Erro: Você precisa estar logado para salvar.");
      return;
    }

    // Nota: Aqui entraria o SCRAPER (Backend) para pegar imagem/titulo automático.
    // Por enquanto, salvamos o que o usuário digitar manualmente.
    const { error } = await supabase.from('wishlist_items').insert({
        title: newItemTitle || "Novo Item",
        product_url: newItemUrl,
        price: parseFloat(newItemPrice) || 0,
        priority_level: 3, // Default
        created_by: user.id,
        couple_id: user.id, // TODO: Ajustar
        image_url: "https://placehold.co/400x400?text=No+Image" // Placeholder até ter scraper
    });

    if (!error) {
        setIsDialogOpen(false);
        setNewItemUrl(""); setNewItemTitle(""); setNewItemPrice("");
        fetchItems();
    } else {
        alert("Erro ao salvar: " + error.message);
    }
    // Opcional: setIsLoading(false) se tivesse um loading state local para o botão
  };

  const handleDelete = async (id: string) => {
      await supabase.from('wishlist_items').delete().eq('id', id);
      setItems(items.filter(i => i.id !== id));
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lista de Desejos</h1>
          <p className="text-muted-foreground">O que o casal está de olho.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl px-6 bg-rose-500 hover:bg-rose-600 text-white">
              <Plus className="h-4 w-4 mr-2" /> Adicionar Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Desejo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Produto</label>
                <Input placeholder="Ex: Airfryer" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço Estimado</label>
                <Input type="number" placeholder="0.00" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Link</label>
                <Input placeholder="https://..." value={newItemUrl} onChange={e => setNewItemUrl(e.target.value)} />
              </div>
              <Button className="w-full bg-rose-500 hover:bg-rose-600" onClick={handleAddItem}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Grid */}
      {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
            <Card key={item.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-card shadow-sm">
                <div className="relative aspect-square overflow-hidden bg-muted">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                    <ShoppingBag className="h-20 w-20" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-110"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                </div>
                <Badge className="absolute top-3 left-3 bg-white/90 text-slate-900 border-none backdrop-blur-sm">
                    R$ {item.price?.toFixed(2)}
                </Badge>
                </div>
                <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-1 truncate leading-tight group-hover:text-rose-500 transition-colors">
                    {item.title}
                </h3>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-lg" asChild>
                    <a href={item.product_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-2" /> Comprar
                    </a>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-500" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
                </CardFooter>
            </Card>
            ))}
        </div>
      )}
    </div>
  );
}
