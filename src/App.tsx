import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { supabase } from './lib/supabase';

// --- IMPORTAÇÃO DAS PÁGINAS ---
import Home from './pages/Home';
import { Login } from './pages/Login';
import { CadastroUnimeta } from './pages/CadastroUnimeta'; 
import { Dashboard } from './pages/Dashboard';
import { Pacientes } from './pages/Pacientes';
import { Permissoes } from './pages/Permissoes';
import { Relatorios } from './pages/Relatorios';
import { Horarios } from './pages/Horarios';
import { Checkin } from './pages/Checkin';
import { Prontuario } from './pages/Prontuario';
import { Validar } from './pages/Validar'; 
import { Encaminhamentos } from './pages/Encaminhamentos';

// --- NOVAS IMPORTAÇÕES DO FINANCEIRO (Ajuste os nomes se forem diferentes nos seus arquivos) ---
import { Planos } from './pages/Planos';
import { Despesas } from './pages/Despesas';
import { Repasses } from './pages/Repasses';
import { Fechamento } from './pages/Fechamento';
import { Acessos } from './pages/Acessos'; // Caso a página de equipe se chame Acessos.tsx

// --- COMPONENTE DE SEGURANÇA (ROTA PRIVADA) ---
function PrivateRoute({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center font-black uppercase text-gray-400 tracking-widest text-xs">
        Carregando SerClin...
      </div>
    );
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      
      <Routes>
        {/* ==========================================
            ROTAS PÚBLICAS
            ========================================== */}
        <Route path="/" element={<Home />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<CadastroUnimeta />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/validar/:id" element={<Validar />} />

        {/* ==========================================
            ROTAS PRIVADAS (Gestão SerClin) 
            ========================================== */}
        
        {/* 1. Rotas de Subnível */}
        <Route path="/sistema/pacientes/:id" element={ <PrivateRoute><Prontuario /></PrivateRoute> } />
        <Route path="/sistema/pacientes" element={ <PrivateRoute><Pacientes /></PrivateRoute> } />
        <Route path="/sistema/permissoes" element={ <PrivateRoute><Permissoes /></PrivateRoute> } />
        <Route path="/sistema/relatorios" element={ <PrivateRoute><Relatorios /></PrivateRoute> } />
        <Route path="/sistema/horarios" element={ <PrivateRoute><Horarios /></PrivateRoute> } />
        <Route path="/sistema/encaminhamentos" element={ <PrivateRoute><Encaminhamentos /></PrivateRoute> } />

        {/* 2. Rotas do Módulo Financeiro (ADICIONADAS AGORA) */}
        <Route path="/sistema/planos" element={ <PrivateRoute><Planos /></PrivateRoute> } />
        <Route path="/sistema/despesas" element={ <PrivateRoute><Despesas /></PrivateRoute> } />
        <Route path="/sistema/repasses" element={ <PrivateRoute><Repasses /></PrivateRoute> } />
        <Route path="/sistema/fechamento" element={ <PrivateRoute><Fechamento /></PrivateRoute> } />
        <Route path="/sistema/acessos" element={ <PrivateRoute><Acessos /></PrivateRoute> } />

        {/* 3. Rota Raiz do Sistema */}
        <Route path="/sistema" element={ <PrivateRoute><Dashboard /></PrivateRoute> } />

        {/* Rota Coringa */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;