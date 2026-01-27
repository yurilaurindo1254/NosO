"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Heart, Bell, Link as LinkIcon, Loader2, CalendarHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner"; // Fixed: Added missing import

interface PartnerProfile {
  id?: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
}

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  partner_id: string | null;
  relationship_start_date: string | null;
  relationship_status: string | null;
  incoming_connection_request_from?: string | null; // Fixed type
  partner?: PartnerProfile;
  requester?: PartnerProfile; // Added for pending requests
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados de convite
  const [inviteEmail, setInviteEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PartnerProfile | null>(null);

  // Estados para atualização de relacionamento
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState("Namorando");
  const [savingRel, setSavingRel] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && mounted) {
             const { data: myProfile, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
             if (error) {
                 toast.error("Erro ao carregar perfil: " + (error.message || "Desconhecido"));
                 return;
             }
             if (myProfile && mounted) {
                setUser({ ...myProfile, email: myProfile.email || authUser.email });
                if(myProfile.relationship_start_date) setStartDate(myProfile.relationship_start_date);
                if(myProfile.relationship_status) setStatus(myProfile.relationship_status);

                if (myProfile.partner_id) {
                    const { data: partnerProfile } = await supabase.from('profiles').select('*').eq('id', myProfile.partner_id).single();
                    if (partnerProfile && mounted) setPartner(partnerProfile);
                } else {
                    if(mounted) setPartner(null);
                }

                if (myProfile.incoming_connection_request_from) {
                    const { data: requesterProfile } = await supabase.from('profiles').select('*').eq('id', myProfile.incoming_connection_request_from).single();
                    if (requesterProfile && mounted) setPendingRequest(requesterProfile);
                } else {
                    if(mounted) setPendingRequest(null);
                }
             }
        }
    };
    loadProfile();
    return () => { mounted = false; };
  }, []);

  const handleSendInvite = async () => {
    if (!inviteEmail) return;
    setLinking(true);

    const { data, error } = await supabase.rpc('send_connection_request', { partner_email: inviteEmail });
    
    if (error) {
       toast.error("Erro: " + error.message);
    } else {
      const result = data as { success: boolean; message: string };

      const msg = result.message || (result as { text?: string }).text;
      if (result.success) {
        toast.success(msg);
        setInviteEmail("");
      } else {
        toast.error(msg);
      }
    }
    setLinking(false);
  };

  const handleAcceptRequest = async () => {
    setLinking(true);

    const { error } = await supabase.rpc('accept_connection_request');
    if (error) toast.error("Erro: " + error.message);
    else {
        toast.success("Convite aceito! ❤️");
        // Update profile
        const { data: { user: authUser } } = await supabase.auth.getUser();
         if (authUser) {
           const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
           if(myProfile) {
              setUser({ ...myProfile, email: myProfile.email || authUser.email });
              // Re-fetch partner
              if (myProfile.partner_id) {
                 const { data: partnerProfile } = await supabase.from('profiles').select('*').eq('id', myProfile.partner_id).single();
                 if (partnerProfile) setPartner(partnerProfile);
              }
              setPendingRequest(null);
           }
         }
    }
    setLinking(false);
  };

  const handleRejectRequest = async () => {
    setLinking(true);

    const { error } = await supabase.rpc('reject_connection_request');
    if (!error) {
        toast.success("Convite recusado.");
        setPendingRequest(null);
        // Refresh page to ensure consistency or just clear state
    }
    setLinking(false);
  };

  const handleSaveRelationship = async () => {
    if (!user) {
        toast.error("Erro: Perfil não carregado. Tente recarregar a página.");
        return;
    }
    if (!startDate) {
        toast.error("Por favor, selecione uma data de início!");
        return;
    }

    setSavingRel(true);
    const { error } = await supabase
        .from('profiles')
        .update({ 
            relationship_start_date: startDate,
            relationship_status: status 
        })
        .eq('id', user.id);
    
    if(error) {
        console.error(error);
        toast.error("Erro ao salvar: " + error.message);
    } else {
        toast.success("Dados do amor atualizados! ❤️");
        // Update local state to reflect persistence
        setUser(prev => prev ? ({ ...prev, relationship_start_date: startDate, relationship_status: status }) : null);
    }
    setSavingRel(false);
  };

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
        <p className="text-muted-foreground">Gerencie sua conta e a conexão do casal.</p>
      </header>

      <div className="grid gap-6">
        {/* Profile Card */}
        <Card className="border-none bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.full_name}`} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary"><User /></AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <CardTitle className="text-xl">{user?.full_name || "Usuário"}</CardTitle>
              <CardDescription>{user?.email || "Carregando..."}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4">
             {partner ? (
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Heart className="h-5 w-5 fill-current" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Conectado com {partner.full_name}</p>
                            <p className="text-xs text-muted-foreground">{partner.email}</p>
                        </div>
                    </div>
                </div>
             ) : pendingRequest ? (
                <div className="space-y-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 border-dashed">
                    <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-yellow-500 animate-bounce" />
                        <div>
                            <p className="font-bold text-sm text-yellow-600 dark:text-yellow-400">Solicitação de Conexão!</p>
                            <p className="text-xs text-muted-foreground">
                                <span className="font-semibold">{pendingRequest.full_name}</span> quer conectar a conta del(a) com a sua.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={handleRejectRequest} disabled={linking}>Recusar</Button>
                        <Button size="sm" onClick={handleAcceptRequest} disabled={linking}>
                            {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aceitar Convite"}
                        </Button>
                    </div>
                </div>
             ) : (
                <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-dashed">
                    <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Vincular Parceiro(a)</span>
                    </div>
                    <div className="flex gap-2">
                        <Input placeholder="Digite o email del@..." value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="bg-background" />
                        <Button onClick={handleSendInvite} disabled={linking}>
                            {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Convite"}
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        * A outra pessoa receberá um aviso aqui no painel para aceitar a conexão.
                    </p>
                </div>
             )}
          </CardContent>
        </Card>

        {/* Relationship Settings Card */}
        <Card className="border-none bg-rose-50/50 dark:bg-rose-950/10 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarHeart className="h-5 w-5 text-rose-500" /> Detalhes do Casal</CardTitle>
                <CardDescription>Para calcularmos quanto tempo vocês estão juntos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Desde quando?</Label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-background" />
                    </div>
                    <div className="space-y-2">
                        <Label>Status Atual</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Namorando">Namorando</SelectItem>
                                <SelectItem value="Noivos">Noivos</SelectItem>
                                <SelectItem value="Casados">Casados</SelectItem>
                                <SelectItem value="Morando Juntos">Morando Juntos</SelectItem>
                                <SelectItem value="Enrolados">Enrolados</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={handleSaveRelationship} disabled={savingRel} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
                    {savingRel ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Heart className="h-4 w-4 mr-2 fill-current" />}
                    Salvar Detalhes
                </Button>
            </CardContent>
        </Card>

        {/* Logout */}
        <Card className="border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Zona de Perigo</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button variant="destructive" className="w-full sm:w-auto gap-2 rounded-xl" onClick={handleLogout} disabled={loading}>
              <LogOut className="h-4 w-4" /> {loading ? "Saindo..." : "Sair da Conta"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
