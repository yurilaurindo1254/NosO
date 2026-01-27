"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PluggyConnect } from 'react-pluggy-connect';
import { toast } from 'sonner';

export function BankConnector() {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cast strictly typed component to any to bypass external library type issues if necessary,
  // or just use it. The error says type is not valid JSX.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PluggyWidget = PluggyConnect as any;

  const handleOpen = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pluggy/auth', { method: 'POST' });
      const data = await response.json();
      
      if (data.accessToken) {
        setToken(data.accessToken);
        setIsOpen(true);
      } else {
        toast.error("Erro ao iniciar conexão com o banco");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar com servidor");
    } finally {
      setLoading(false);
    }
  };

  const onSuccess = async (itemData: { item: { id: string } }) => {
    toast.success("Conexão realizada com sucesso!");
    setIsOpen(false);
    
    // Trigger initial sync
    try {
        toast.info("Sincronizando transações...");
        const response = await fetch('/api/pluggy/sync', {
            method: 'POST',
            body: JSON.stringify({ itemId: itemData.item.id }),
            headers: { 'Content-Type': 'application/json'}
        });
        
        if (response.ok) {
            toast.success("Transações sincronizadas!");
            // Here you would typically invalidate queries or reload data
            window.location.reload(); 
        } else {
            toast.error("Erro ao sincronizar transações iniciais.");
        }
    } catch (error) {
        console.error(error);
        toast.error("Erro de rede ao sincronizar.");
    }
  };

  const onError = (error: unknown) => {
    console.error("Pluggy Connect Error:", error);
    toast.error("Ocorreu um erro na conexão bancária.");
  };

  return (
    <>
      <Button onClick={handleOpen} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-900/10">
        {loading ? <span className="animate-pulse">Carregando...</span> : "Conectar Conta Bancária +"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md h-[600px] p-0 overflow-hidden bg-background border-border">
            <DialogHeader className="px-4 py-2 border-b">
                <DialogTitle>Conectar Banco</DialogTitle>
            </DialogHeader>
            {token && (
                <div className="flex-1 h-full w-full">
                    <PluggyWidget
                        connectToken={token}
                        includeSandbox={true}
                        onSuccess={onSuccess}
                        onError={onError}
                    />
                </div>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
