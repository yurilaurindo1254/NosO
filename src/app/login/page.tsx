"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Heart, Mail, Lock, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// Schemas de Validação
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Forms
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  // Handlers
  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      alert("Erro ao entrar: " + error.message);
    } else {
      router.push("/");
    }
    setLoading(false);
  };

  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
      },
    });

    if (error) {
      alert("Erro ao cadastrar: " + error.message);
    } else {
      if (data.user) {
        // Perfil é criado automaticamente via Trigger no banco
        console.log("Usuário criado:", data.user.id);
      }
      alert("Cadastro realizado! Verifique seu email ou entre.");
      router.push("/");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background px-4">
      {/* Background Decorativo */}
      <div className="absolute inset-0 bg-[#e0e7ff] dark:bg-[#0f172a] -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-200 via-background to-background dark:from-indigo-950 dark:via-background dark:to-background"></div>

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 rotate-12 transition-transform hover:rotate-6 duration-500">
            <Heart className="h-10 w-10 fill-current animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-primary">NósOS</h1>
            <p className="text-muted-foreground font-medium">O sistema operacional do seu amor.</p>
          </div>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-2xl bg-muted/50 p-1 mb-8 backdrop-blur-sm border border-white/20 dark:border-white/5">
            <TabsTrigger value="login" className="rounded-xl font-semibold data-[state=active]:bg-background data-[state=active]:shadow-lg">Entrar</TabsTrigger>
            <TabsTrigger value="register" className="rounded-xl font-semibold data-[state=active]:bg-background data-[state=active]:shadow-lg">Cadastrar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-0">
            <Card className="border-white/20 dark:border-white/10 shadow-2xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Bem-vindo de volta</CardTitle>
                <CardDescription>Acesse sua conta compartilhada.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="email@exemplo.com" className="pl-10 h-10 rounded-xl bg-background/50" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input type="password" placeholder="••••••••" className="pl-10 h-10 rounded-xl bg-background/50" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar agora"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register" className="mt-0">
            <Card className="border-white/20 dark:border-white/10 shadow-2xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Criar nova conta</CardTitle>
                <CardDescription>Comece sua jornada compartilhada hoje.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Seu nome" className="pl-10 h-10 rounded-xl bg-background/50" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="email@exemplo.com" className="pl-10 h-10 rounded-xl bg-background/50" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input type="password" placeholder="Crie uma senha forte" className="pl-10 h-10 rounded-xl bg-background/50" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
