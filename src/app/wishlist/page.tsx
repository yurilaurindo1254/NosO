"use client";

import { useState } from "react";
import { Plus, ExternalLink, ShoppingBag, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const INITIAL_ITEMS = [
  { 
    id: 1, 
    title: "Eco Dot (5ª Geração)", 
    price: 349.00, 
    priority: 3, 
    url: "https://amazon.com.br", 
    image: "https://m.media-amazon.com/images/I/71uGqXW6Y2L._AC_SL1500_.jpg" 
  },
  { 
    id: 2, 
    title: "Airfryer Mondial", 
    price: 450.00, 
    priority: 5, 
    url: "https://magalu.com", 
    image: "https://a-static.mlcdn.com.br/800x560/fritadeira-eletrica-sem-oleo-air-fryer-mondial-family-iv-af-30-i-37l-preta-e-inox/magazineluiza/225828400/98d2495d465355447bdf6389f929348f.jpg" 
  },
  { 
    id: 3, 
    title: "Jogo de Cama Algodão", 
    price: 180.00, 
    priority: 2, 
    url: "https://zara.com", 
    image: "https://static.zarahome.net/8/photos2/2024/V/0/1/p/1325/088/250/1325088250_1_1_3.jpg" 
  },
];

export default function WishlistPage() {
  const [items, setItems] = useState(INITIAL_ITEMS);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lista de Desejos</h1>
          <p className="text-muted-foreground">O que o casal está de olho.</p>
        </div>
        <Dialog>
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
                <label className="text-sm font-medium">Link do Produto</label>
                <Input placeholder="Cole o link da loja aqui" />
              </div>
              <p className="text-[10px] text-muted-foreground">O NósOS tentará buscar os detalhes automaticamente.</p>
              <Button className="w-full bg-rose-500 hover:bg-rose-600">Adicionar à Lista</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-card shadow-sm">
            <div className="relative aspect-square overflow-hidden bg-muted">
              {/* Image would go here, using a placeholder/colored box for now */}
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                <ShoppingBag className="h-20 w-20" />
                <img 
                    src={item.image} 
                    alt={item.title} 
                    className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
              <Badge className="absolute top-3 left-3 bg-white/90 text-slate-900 border-none backdrop-blur-sm">
                R$ {item.price.toFixed(2)}
              </Badge>
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/20 backdrop-blur-md px-2 py-1 rounded-full text-white text-[10px] font-bold">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                Prioridade {item.priority}
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-1 truncate leading-tight group-hover:text-rose-500 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Desejo Compartilhado</p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 rounded-lg" asChild>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-2" /> Comprar
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-500">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold mb-2">Sua lista está vazia</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">Comece a planejar os próximos presentes ou conquistas do casal.</p>
        </div>
      )}
    </div>
  );
}
