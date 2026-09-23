import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { supabase } from './lib/supabase';
import FormularioAlerta from './pages/corporativo/FormularioAlerta';

// --- IMPORTAÇÃO DAS PÁGINAS ---
import Home from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Pacientes } from './pages/Pacientes';
import { CalculadoraTaxas } from "@/components/Taxas";
import { Relatorios } from './pages/Relatorios';
import { Checkin } from './pages/Checkin';
import { Prontuario } from './pages/Prontuario';
import { Validar } from './pages/Validar'; 
import { Encaminhamentos } from './pages/Encaminhamentos';
import { ContratoPage } from './pages/ContratoPage';
import { Assinar } from './pages/Assinar';

// --- CENTRAL UNIFICADA (CHAVES, DIAS E HORÁRIOS) ---
import { Permissoes } from './pages/Permissoes';

// --- OUTRAS IMPORTAÇÕES DO FINANCEIRO ---
import { Planos } from './pages/Planos';
import { Despesas } from './pages/Despesas';
import { Repasses } from './pages/Repasses';
import { Fechamento } from './pages/Fechamento';
import { CadastroUsuario } from './pages/CadastroUsuario'; 

// ========================================================
// 🌟 MÓDULOS DE MERCADO
// ========================================================
import { DashboardEscola } from './pages/Escola/DashboardEscola';
import { AlertaProfessor } from './pages/Escola/AlertaProfessor';
import { DashboardCorporativo } from './pages/corporativo/DashboardCorporativo';

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

export function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      
      <Routes>
        {/* ==========================================
            ROTAS PÚBLICas
            ========================================== */}
        <Route path="/" element={<Home />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/validar/:id" element={<Validar />} />
        <Route path="/assinar/:id" element={<Assinar />} />

        {/* ==========================================
            ROTAS PRIVADAS (Gestão SerClin Interna) 
            ========================================== */}
        
        {/* 1. Rotas de Subnível */}
        <Route path="/sistema/pacientes/:id" element={ <PrivateRoute><Prontuario /></PrivateRoute> } />
        <Route path="/sistema/pacientes" element={ <PrivateRoute><Pacientes /></PrivateRoute> } />
        <Route path="/sistema/relatorios" element={ <PrivateRoute><Relatorios /></PrivateRoute> } />
        <Route path="/sistema/encaminhamentos" element={<PrivateRoute><Encaminhamentos /></PrivateRoute>} />
        
        {/* 📄 ROTA DO CONTRATO TERAPÊUTICO */}
        <Route path="/sistema/contrato" element={ <PrivateRoute><ContratoPage /></PrivateRoute> } />

        {/* 🌟 CENTRAL UNIFICADA */}
        <Route path="/sistema/permissoes" element={ <PrivateRoute><Permissoes /></PrivateRoute> } />
        <Route path="/sistema/gestao" element={ <PrivateRoute><Permissoes /></PrivateRoute> } />
        <Route path="/sistema/usuarios" element={ <PrivateRoute><Permissoes /></PrivateRoute> } />

        {/* 2. Rotas do Módulo Financeiro */}
        <Route path="/sistema/planos" element={ <PrivateRoute><Planos /></PrivateRoute> } />
        <Route path="/sistema/despesas" element={ <PrivateRoute><Despesas /></PrivateRoute> } />
        <Route path="/sistema/repasses" element={ <PrivateRoute><Repasses /></PrivateRoute> } />
        <Route path="/sistema/fechamento" element={ <PrivateRoute><Fechamento /></PrivateRoute> } />
        <Route path="/sistema/taxas" element={
          <div className="min-h-screen bg-slate-50 p-6 md:p-12 flex items-center justify-center">
            <CalculadoraTaxas />
          </div>
        } />

        {/* FORMULÁRIO DE NOVO CADASTRO DE PROFISSIONAL */}
        <Route path="/sistema/usuarios/novo" element={ <PrivateRoute><CadastroUsuario /></PrivateRoute> } />

        {/* 3. Rota Raiz do Sistema Interno */}
        <Route path="/sistema" element={ <PrivateRoute><Dashboard /></PrivateRoute> } />

        {/* ==========================================
            🚀 PORTAL 1: HUB NEUROEDUCACIONAL (ESCOLAS)
            ========================================== */}
        <Route path="/escola" element={ <PrivateRoute><DashboardEscola /></PrivateRoute> } />
        <Route path="/escola/alerta" element={<AlertaProfessor />} />

        {/* ==========================================
            🚀 PORTAL 2: BLINDAGEM CORPORATIVA (EMPRESAS / VAREJO)
            ========================================== */}
        <Route path="/corporativo" element={ <PrivateRoute><DashboardCorporativo /></PrivateRoute> } />
        <Route path="/corporativo/alerta" element={<FormularioAlerta />} />

        {/* Rota Coringa */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;