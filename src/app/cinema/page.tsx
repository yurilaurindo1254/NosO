"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Film, Star, Trash2, Shuffle, Check, Loader2, Ticket, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Se você tiver toaster instalado, senão use alert

// Tipos
type Movie = {
  id: string;
  title: string;
  platform: string;
  genre: string;
  status: 'watchlist' | 'watched';
  rating: number;
  image_url: string;
};

type TmdbMovie = {
  tmdb_id: number;
  title: string;
  poster_path: string;
  backdrop_path: string | null;
  genre: string;
  overview: string;
  rating: number;
  release_date: string;
};

const PLATFORMS = ["Netflix", "Prime Video", "Disney+", "HBO Max", "Cinema", "Apple TV", "Outros"];

export default function CinemaPage() {
  // Estados
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [watched, setWatched] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<TmdbMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<TmdbMovie | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [loadingDb, setLoadingDb] = useState(true);
  const [loadingTmdb, setLoadingTmdb] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Estados de UI
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  
  // Form Manual
  const [newTitle, setNewTitle] = useState("");
  const [newPlatform, setNewPlatform] = useState("Netflix");
  const [newGenre, setNewGenre] = useState("Outros");

  // 1. Carregar do Banco
  const fetchMyMovies = useCallback(async () => {
    setLoadingDb(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
      if (data) {
        setWatchlist(data.filter((m: Movie) => m.status === 'watchlist'));
        setWatched(data.filter((m: Movie) => m.status === 'watched'));
      }
    }
    setLoadingDb(false);
  }, []);

  // 2. Carregar da API (TMDB)
  const fetchNowPlaying = useCallback(async () => {
    setLoadingTmdb(true);
    setError(null);
    try {
        const res = await fetch('/api/tmdb/now-playing');
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        if (Array.isArray(data)) setNowPlaying(data);
    } catch (e: unknown) {
        console.error("Erro TMDB", e);
        if (e instanceof Error) {
            setError(e.message || "Erro ao carregar filmes.");
        } else {
            setError("Erro desconhecido ao carregar filmes.");
        }
    }
    setLoadingTmdb(false);
  }, []);

  useEffect(() => {
    fetchMyMovies();
    fetchNowPlaying();
  }, [fetchMyMovies, fetchNowPlaying]);

  // Handler: Adicionar Filme (Manual ou API)
  const handleAddMovie = async (movieData?: Partial<Movie>) => {
    // Verificação de segurança robusta
    let currentUserId = userId;
    if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            currentUserId = user.id;
            setUserId(user.id);
        } else {
            console.error("ERRO CRÍTICO: Usuário não autenticado.");
            toast.error("Você precisa fazer login novamente!", {
                 action: {
                     label: "Ir para Login",
                     onClick: () => window.location.href = '/login'
                 }
            });
            return;
        }
    }
    
    const title = movieData?.title || newTitle;
    if (!title) return;

    // Se vier da API, usa a capa da API, senão usa placeholder
    const image_url = movieData?.image_url || `https://source.unsplash.com/400x600/?cinema,movie`;
    const genre = movieData?.genre || newGenre;
    const platform = movieData?.platform || newPlatform;

    const { error } = await supabase.from('movies').insert({
        title,
        platform,
        genre,
        image_url,
        couple_id: currentUserId, // Usa o ID garantido
        status: 'watchlist'
    });

    if (!error) {
        setIsAddOpen(false);
        setSelectedMovie(null); // Fecha modal se estiver aberto
        setNewTitle("");
        fetchMyMovies();
        toast.success(`"${title}" adicionado à lista!`);
    } else {
        console.error("Erro Supabase:", error);
        toast.error(`Erro ao salvar: ${error.message}`);
    }
  };

  // Handler: Avaliar/Marcar Visto
  const handleRate = async (id: string, rating: number) => {
      // Optimistic update
      const movie = watchlist.find(m => m.id === id);
      if (movie) {
          const updated = { ...movie, rating, status: 'watched' as const };
          setWatchlist(watchlist.filter(m => m.id !== id));
          setWatched([updated, ...watched]);
          
          await supabase.from('movies').update({ rating, status: 'watched' }).eq('id', id);
      }
  };

  const handleDelete = async (id: string, list: 'watchlist'|'watched') => {
      if(!confirm("Remover filme?")) return;
      
      if (list === 'watchlist') setWatchlist(watchlist.filter(m => m.id !== id));
      else setWatched(watched.filter(m => m.id !== id));

      await supabase.from('movies').delete().eq('id', id);
  };

  // Sorteador
  const spinTheWheel = () => {
      if (watchlist.length === 0) {
          toast.warning("Sua lista está vazia! Adicione filmes primeiro.");
          return;
      }
      
      setIsSpinning(true);
      setWinnerId(null);
      
      // Simular roleta
      let i = 0;
      const interval = setInterval(() => {
           i++;
           // Apenas visual, não muda estado real
      }, 100);

      setTimeout(() => {
          clearInterval(interval);
          const randomIndex = Math.floor(Math.random() * watchlist.length);
          const winner = watchlist[randomIndex];
          setWinnerId(winner.id);
          setIsSpinning(false);
          toast.success(`O filme escolhido foi: ${winner.title}! 🍿`);
      }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cineclube</h1>
          <p className="text-muted-foreground">O que vamos assistir hoje, amor?</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            <Button 
                variant="secondary" 
                onClick={spinTheWheel} 
                disabled={isSpinning || watchlist.length === 0}
                className={cn("flex-1 md:flex-none font-bold query-btn", isSpinning && "animate-pulse")}
            >
                {isSpinning ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Shuffle className="h-4 w-4 mr-2 text-purple-500"/>}
                Sortear
            </Button>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full shadow-lg bg-primary hover:bg-primary/90">
                    <Plus className="h-5 w-5 md:mr-2" />
                    <span className="hidden md:inline">Adicionar Manual</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Adicionar Filme/Série</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <Input placeholder="Nome do Filme" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <div className="grid grid-cols-2 gap-4">
                        <Select value={newPlatform} onValueChange={setNewPlatform}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input placeholder="Gênero" value={newGenre} onChange={e => setNewGenre(e.target.value)} />
                    </div>
                    <Button onClick={() => handleAddMovie()} className="w-full">Salvar</Button>
                </div>
            </DialogContent>
            </Dialog>
        </div>
      </header>

      <Tabs defaultValue="now_playing" className="w-full" onValueChange={(val) => { if(val === 'now_playing' && nowPlaying.length === 0) fetchNowPlaying() }}>
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 mb-6 h-12 rounded-xl">
            <TabsTrigger value="now_playing" className="rounded-lg gap-2"><Ticket className="h-4 w-4"/> Em Cartaz</TabsTrigger>
            <TabsTrigger value="watchlist" className="rounded-lg gap-2"><Film className="h-4 w-4"/> Para Ver ({watchlist.length})</TabsTrigger>
            <TabsTrigger value="watched" className="rounded-lg gap-2"><Check className="h-4 w-4"/> Vistos ({watched.length})</TabsTrigger>
        </TabsList>
        
        {/* ABA 1: EM CARTAZ (TMDB) */}
        <TabsContent value="now_playing" className="min-h-[300px]">
             {error ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-red-500/5 border border-red-500/20 rounded-xl">
                    <Info className="h-10 w-10 text-red-400 mb-2" />
                    <p className="font-medium text-red-400">Ops! {error}</p>
                    <p className="text-sm mt-1">Tente reiniciar o terminal (npm run dev).</p>
                    <Button variant="outline" size="sm" onClick={fetchNowPlaying} className="mt-4 border-red-500/20 hover:bg-red-500/10 text-red-400">
                        Tentar Novamente
                    </Button>
                </div>
             ) : loadingTmdb ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[1,2,3,4,5].map(i => <div key={i} className="aspect-[2/3] bg-muted/50 rounded-xl animate-pulse" />)}
                 </div>
             ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {nowPlaying.map((movie) => (
                         <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            key={movie.tmdb_id} 
                            onClick={() => setSelectedMovie(movie)}
                            className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-900 shadow-lg cursor-pointer transform transition-all hover:scale-105 hover:z-10"
                         >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={movie.poster_path || ''} alt={movie.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                            
                            {/* Overlay Info */}
                            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <h3 className="text-white font-bold text-sm leading-tight mb-1">{movie.title}</h3>
                                <div className="flex flex-wrap gap-1 mb-3">
                                    <Badge variant="outline" className="text-[10px] text-white border-white/20 px-1 py-0 h-5">{movie.genre}</Badge>
                                    <span className="text-[10px] text-yellow-400 flex items-center gap-1 font-bold"><Star className="h-3 w-3 fill-current"/> {movie.rating.toFixed(1)}</span>
                                </div>
                                <Button size="sm" className="relative z-20 w-full bg-white text-black hover:bg-white/90 font-bold text-xs" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log("Botão clicado para:", movie.title);
                                        handleAddMovie({ 
                                            title: movie.title, 
                                            image_url: movie.poster_path, 
                                            genre: movie.genre, 
                                            platform: 'Cinema' 
                                        });
                                    }}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Quero Ver
                                </Button>
                            </div>
                         </motion.div>
                     ))}
                 </div>
             )}
        </TabsContent>

        {/* ABA 2: WATCHLIST (MINHA LISTA) */}
        <TabsContent value="watchlist">
             {loadingDb ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[1,2,3].map(i => <div key={i} className="aspect-[2/3] bg-muted/50 rounded-xl animate-pulse" />)}
                 </div>
             ) : watchlist.length === 0 ? (
                <div className="text-center py-20 opacity-50 flex flex-col items-center">
                    <Film className="h-16 w-16 mb-4 text-muted-foreground/30"/>
                    <p>Sua lista está vazia. Vá na aba &quot;Em Cartaz&quot; e adicione filmes!</p>
                </div>
             ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <AnimatePresence>
                        {watchlist.map((movie) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ 
                                    opacity: 1, scale: winnerId === movie.id ? 1.05 : 1,
                                    zIndex: winnerId === movie.id ? 10 : 1,
                                    boxShadow: winnerId === movie.id ? "0 0 0 4px #6366f1" : "none"
                                }}
                                exit={{ opacity: 0, scale: 0 }}
                                key={movie.id}
                                className="relative group aspect-[2/3] rounded-xl overflow-hidden bg-muted shadow-md"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={movie.image_url} alt={movie.title} className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
                                
                                <Badge className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 backdrop-blur-md text-[10px] border-none text-white">{movie.platform}</Badge>
                                
                                <div className="absolute bottom-0 w-full p-3">
                                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-2">{movie.title}</h3>
                                    
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                                        <Button size="icon" className="h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-600 border-none" onClick={(e) => { e.stopPropagation(); handleRate(movie.id, 5); }}>
                                            <Check className="h-4 w-4 text-white" />
                                        </Button>
                                        <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); handleDelete(movie.id, 'watchlist'); }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {winnerId === movie.id && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                                        <motion.div 
                                            initial={{ scale: 0 }} animate={{ scale: 1 }} 
                                            className="bg-primary text-white px-6 py-3 rounded-full font-black text-xl shadow-2xl animate-bounce"
                                        >
                                            🍿 ESSE AQUI!
                                        </motion.div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
             )}
        </TabsContent>
        
        {/* ABA 3: JÁ VISTOS */}
        <TabsContent value="watched">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {watched.map((movie) => (
                     <div key={movie.id} className="relative aspect-[2/3] rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all cursor-pointer group">
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         <img src={movie.image_url} alt={movie.title} className="h-full w-full object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                             <div className="flex justify-between items-end">
                                <span className="text-xs text-white font-medium line-clamp-1">{movie.title}</span>
                                <div className="flex text-yellow-400">
                                    <Star className="h-3 w-3 fill-current" />
                                    <span className="text-xs ml-0.5 font-bold">{movie.rating}</span>
                                </div>
                             </div>
                         </div>
                         <Button 
                            variant="destructive" size="icon" 
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); handleDelete(movie.id, 'watched'); }}
                         >
                            <Trash2 className="h-3 w-3" />
                         </Button>
                     </div>
                 ))}
             </div>
        </TabsContent>
      </Tabs>

      {/* MODAL MÁGICO DE DETALHES (Novo!) */}
      <Dialog open={!!selectedMovie} onOpenChange={(open) => !open && setSelectedMovie(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl shadow-2xl">
           {selectedMovie && (
               <>
                   {/* Header com Imagem de Fundo */}
                   <div className="relative h-64 w-full">
                       <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background z-10" />
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img 
                          src={selectedMovie.backdrop_path || selectedMovie.poster_path} 
                          alt={selectedMovie.title} 
                          className="h-full w-full object-cover"
                       />
                       <Button 
                          variant="secondary" size="icon" 
                          className="absolute top-4 right-4 z-20 rounded-full bg-black/50 text-white border-none hover:bg-black/70"
                          onClick={() => setSelectedMovie(null)}
                       >
                           <X className="h-4 w-4" />
                       </Button>
                   </div>
                   
                   {/* Conteúdo */}
                   <div className="px-6 pb-6 -mt-12 relative z-20">
                       <div className="flex justify-between items-start mb-4">
                           <div>
                                <DialogTitle className="text-3xl font-black tracking-tight text-white drop-shadow-lg">{selectedMovie.title}</DialogTitle>
                               <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                                   <Badge variant="secondary" className="bg-primary/20 text-primary border-none">{selectedMovie.genre}</Badge>
                                   <span className="text-sm">📅 {selectedMovie.release_date?.split('-')[0]}</span>
                                   <span className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                                       <Star className="h-3 w-3 fill-current" /> {selectedMovie.rating.toFixed(1)}
                                   </span>
                               </div>
                           </div>
                       </div>

                       <ScrollArea className="h-[120px] rounded-md border p-4 bg-muted/30 mb-6">
                           <p className="text-sm leading-relaxed text-muted-foreground">
                               {selectedMovie.overview || "Sem sinopse disponível."}
                           </p>
                       </ScrollArea>

                       <div className="flex gap-3">
                           <Button 
                                className="flex-1 h-12 text-md font-bold shadow-lg shadow-primary/25"
                                onClick={() => handleAddMovie({
                                    title: selectedMovie.title,
                                    image_url: selectedMovie.poster_path,
                                    genre: selectedMovie.genre,
                                    platform: 'Cinema'
                                })}
                           >
                               <Plus className="mr-2 h-5 w-5" /> Adicionar à Lista
                           </Button>
                           <Button variant="outline" className="h-12 border-primary/20" onClick={() => setSelectedMovie(null)}>
                               Talvez depois
                           </Button>
                       </div>
                   </div>
               </>
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
