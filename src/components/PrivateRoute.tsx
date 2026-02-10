import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Verifica a sessão atual ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });

    // Escuta mudanças na autenticação (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Enquanto verifica, mostra carregando (para evitar piscar a tela de login)
  if (session === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Se não tem sessão, manda pro login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Se tem sessão, mostra o conteúdo protegido
  return <>{children}</>;
}