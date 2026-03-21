import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { supabase } from './lib/supabase';

// --- IMPORTAÇÃO DAS PÁGINAS ---
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Pacientes } from './pages/Pacientes';
import { Permissoes } from './pages/Permissoes';
import { Relatorios } from './pages/Relatorios';
import { Horarios } from './pages/Horarios';
import { Checkin } from './pages/Checkin';
import { Prontuario } from './pages/Prontuario';

// Importe as outras páginas aqui conforme for criando:
// import { ValidarAtestado } from './pages/ValidarAtestado';
// import { Planos } from './pages/Planos';
// import { Despesas } from './pages/Despesas';
// import { Repasses } from './pages/Repasses';
// import { Fechamento } from './pages/Fechamento';
// import { Acessos } from './pages/Acessos';

// --- COMPONENTE DE SEGURANÇA (ROTA PRIVADA) ---
// Este componente impede que pessoas não logadas acessem a URL /sistema
function PrivateRoute({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se tem alguém logado ao carregar a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Fica "escutando" se o usuário fez login ou logout
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
  
  // Se não tem sessão, chuta o invasor de volta para a tela de Login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      {/* O Toaster é o componente que faz aquelas notificações bonitas (toast.success) aparecerem */}
      <Toaster position="top-center" richColors />
      
      <Routes>
        {/* ==========================================
            ROTAS PÚBLICAS (Pacientes e Visitantes) 
            ========================================== */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        {/* A Rota do Portal do Paciente (Onde a mágica acontece pelo celular deles) */}
        <Route path="/checkin" element={<Checkin />} />
        
        {/* <Route path="/validar/:id" element={<ValidarAtestado />} /> */}


        {/* ==========================================
            ROTAS PRIVADAS (Gestão SerClin) 
            ========================================== */}
        <Route path="/sistema" element={ <PrivateRoute><Dashboard /></PrivateRoute> } />
        <Route path="/sistema/pacientes" element={ <PrivateRoute><Pacientes /></PrivateRoute> } />
        <Route path="/sistema/permissoes" element={ <PrivateRoute><Permissoes /></PrivateRoute> } />
        <Route path="/sistema/relatorios" element={ <PrivateRoute><Relatorios /></PrivateRoute> } />
        <Route path="/sistema/horarios" element={ <PrivateRoute><Horarios /></PrivateRoute> } />
        
        {/* ROTAS DE PRONTUÁRIO */}
        <Route path="/sistema/pacientes/:id" element={ <PrivateRoute><Prontuario /></PrivateRoute> } />

        {/* Rotas Futuras (Descomente quando o arquivo existir na pasta pages) */}
        {/* <Route path="/sistema/despesas" element={ <PrivateRoute><Despesas /></PrivateRoute> } /> */}
        {/* <Route path="/sistema/planos" element={ <PrivateRoute><Planos /></PrivateRoute> } /> */}
        {/* <Route path="/sistema/repasses" element={ <PrivateRoute><Repasses /></PrivateRoute> } /> */}
        {/* <Route path="/sistema/fechamento" element={ <PrivateRoute><Fechamento /></PrivateRoute> } /> */}
        {/* <Route path="/sistema/acessos" element={ <PrivateRoute><Acessos /></PrivateRoute> } /> */}
        
        {/* Rota de fallback: Se digitar URL errada, volta pro login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;