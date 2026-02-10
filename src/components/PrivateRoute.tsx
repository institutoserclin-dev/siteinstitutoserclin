import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase"; // ⚠️ CONFIRA SE O CAMINHO DO SEU SUPABASE ESTÁ CORRETO AQUI

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verifica se tem sessão ativa ao carregar a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Fica ouvindo mudanças (ex: se o token expirar ou usuário clicar em sair)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    // Enquanto verifica, mostra uma tela branca ou um "Carregando..."
    return <div className="flex h-screen w-full items-center justify-center">Carregando sistema...</div>;
  }

  // Se NÃO tem sessão, chuta para o login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Se tem sessão, deixa entrar
  return <>{children}</>;
}