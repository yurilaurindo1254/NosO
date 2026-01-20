"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Heart, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "Usuário");
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-20">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua conta e preferências.</p>
      </header>

      <div className="grid gap-6">
        {/* Profile Card */}
        <Card className="border-none bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src="" />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                <User />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <CardTitle className="text-xl">Sua Conta</CardTitle>
              <CardDescription>{userEmail || "Carregando..."}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4">
             <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500">
                      <Heart className="h-5 w-5 fill-current" />
                   </div>
                   <div>
                      <p className="font-medium">Plano Couple OS Pro</p>
                      <p className="text-xs text-muted-foreground">Assinatura vitalícia do amor.</p>
                   </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-full">Gerenciar</Button>
             </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
           <CardHeader>
              <CardTitle>Preferências do App</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span>Notificações</span>
                 </div>
                 <Button variant="outline" size="sm" disabled>Em breve</Button>
              </div>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <span>Segurança e Privacidade</span>
                 </div>
                 <Button variant="outline" size="sm" disabled>Em breve</Button>
              </div>
           </CardContent>
        </Card>

        {/* Logout Zone */}
        <Card className="border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Zona de Perigo</CardTitle>
            <CardDescription>Ações que encerram sua sessão atual.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              variant="destructive" 
              className="w-full sm:w-auto gap-2 rounded-xl" 
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className="h-4 w-4" />
              {loading ? "Saindo..." : "Sair da Conta"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
