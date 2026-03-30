import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { supabase } from './lib/supabase';

// --- IMPORTAÇÃO DAS PÁGINAS ---
import Home from './pages/Home'; // <--- IMPORTAÇÃO CORRETA DO SEU SITE (PÁGINA INICIAL)
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Pacientes } from './pages/Pacientes';
import { Permissoes } from './pages/Permissoes';
import { Relatorios } from './pages/Relatorios';
import { Horarios } from './pages/Horarios';
import { Checkin } from './pages/Checkin';
import { Prontuario } from './pages/Prontuario';
import { Validar } from './pages/Validar'; // <--- NOVA PÁGINA IMPORTADA AQUI

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
            ROTAS PÚBLICAS (Abertas para todos) 
            ========================================== */}
        
        {/* AGORA O SITE VOLTA A SER A PÁGINA INICIAL */}
        <Route path="/" element={<Home />} /> 
        
        {/* O Login fica no /login */}
        <Route path="/login" element={<Login />} />
        
        {/* Portal do Paciente */}
        <Route path="/checkin" element={<Checkin />} />

        {/* PÁGINA DE VALIDAÇÃO DE DOCUMENTOS (PÚBLICA) */}
        <Route path="/validar/:id" element={<Validar />} />

        {/* ==========================================
            ROTAS PRIVADAS (Gestão SerClin) 
            ========================================== */}
        <Route path="/sistema" element={ <PrivateRoute><Dashboard /></PrivateRoute> } />
        <Route path="/sistema/pacientes" element={ <PrivateRoute><Pacientes /></PrivateRoute> } />
        <Route path="/sistema/permissoes" element={ <PrivateRoute><Permissoes /></PrivateRoute> } />
        <Route path="/sistema/relatorios" element={ <PrivateRoute><Relatorios /></PrivateRoute> } />
        <Route path="/sistema/horarios" element={ <PrivateRoute><Horarios /></PrivateRoute> } />
        <Route path="/sistema/pacientes/:id" element={ <PrivateRoute><Prontuario /></PrivateRoute> } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;