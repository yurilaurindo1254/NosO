"use client";

import { useState } from "react";
import { Heart, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/";
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 rotate-12">
            <Heart className="h-10 w-10 fill-current" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter">NósOS</h1>
            <p className="text-muted-foreground font-medium">O sistema operacional do seu amor.</p>
          </div>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1 mb-8">
            <TabsTrigger value="login" className="rounded-lg">Entrar</TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg">Cadastrar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-0">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle>Bem-vindo de volta</CardTitle>
                <CardDescription>Acesse sua conta compartilhada.</CardDescription>
              </CardHeader>
              <form onSubmit={handleAuth}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="email@exemplo.com" className="pl-10 h-10 rounded-lg" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Sua senha" className="pl-10 h-10 rounded-lg" required />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full h-11 rounded-xl font-bold" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar agora"}
                  </Button>
                  <Button variant="link" className="text-xs text-muted-foreground">Esqueceu a senha?</Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register" className="mt-0">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle>Criar nova conta</CardTitle>
                <CardDescription>Comece sua jornada compartilhada hoje.</CardDescription>
              </CardHeader>
              <form onSubmit={handleAuth}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input placeholder="Seu nome completo" className="h-10 rounded-lg" required />
                  </div>
                  <div className="space-y-2">
                    <Input type="email" placeholder="email@exemplo.com" className="h-10 rounded-lg" required />
                  </div>
                  <div className="space-y-2">
                    <Input type="password" placeholder="Crie uma senha forte" className="h-10 rounded-lg" required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full h-11 rounded-xl font-bold" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
