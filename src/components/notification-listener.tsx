"use client";

import { useEffect } from "react";
import { toast } from "sonner"; // Using sonner for notifications
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function NotificationListener() {
  const router = useRouter();

  useEffect(() => {
    // Channel for Realtime
    const channel = supabase
      .channel('global-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          const type = payload.new.type === 'income' ? '💰 Nova Entrada!' : '💸 Nova Despesa!';
          // Format currency locally if possible, or just show generic
          const amount = Number(payload.new.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          toast(type, {
             description: `${payload.new.description} - ${amount}`,
             position: 'top-center',
             duration: 4000,
             action: {
                label: 'Ver',
                onClick: () => router.push('/finance')
             }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          toast("📝 Nova Tarefa Adicionada", {
             description: payload.new.title,
             position: 'top-center',
             action: {
                label: 'Ver',
                onClick: () => router.push('/tasks')
             }
          });
        }
      )
      .on(
         'postgres_changes',
         { event: 'UPDATE', schema: 'public', table: 'tasks', filter: 'status=eq.done' },
         (payload) => {
             // Only if it wasn't done before? Trigger logic is simple here
             toast("✅ Tarefa Concluída!", {
                 description: payload.new.title,
                 position: 'top-center',
                 className: 'bg-green-500/10 border-green-500/20 text-green-600'
             });
         }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wishlist_items' },
        (payload) => {
          toast("✨ Novo Desejo na Lista!", {
             description: payload.new.title,
             position: 'top-center',
             action: {
                label: 'Ver',
                onClick: () => router.push('/wishlist')
             }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null; // This component renders nothing
}
