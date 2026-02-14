import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Componentes de Proteção
import { PrivateRoute } from "@/components/PrivateRoute";

// Páginas
import Home from "@/pages/Home";
import { Login } from "@/pages/Login";
import { RedefinirSenha } from "@/pages/RedefinirSenha";
import { Validar } from "@/pages/Validar";
import { Dashboard } from "@/pages/Dashboard";
import { CadastroUsuario } from "@/pages/CadastroUsuario"; 
import { Pacientes } from "@/pages/Pacientes"; 
import { Prontuario } from "@/pages/Prontuario";
import { Acessos } from "@/pages/Acessos"; 
import { Horarios } from "@/pages/Horarios";
import { Lembretes } from "@/pages/Lembretes";
import { Planos } from "@/pages/Planos";
import { Despesas } from "@/pages/Despesas"; // NOVA
import { Repasses } from "@/pages/Repasses"; // NOVA

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/validar/:id" element={<Validar />} />

          {/* Rotas Privadas (Sistema) */}
          <Route path="/sistema" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          
          <Route path="/sistema/lembretes" element={<PrivateRoute><Lembretes /></PrivateRoute>} />
          <Route path="/sistema/horarios" element={<PrivateRoute><Horarios /></PrivateRoute>} />
          <Route path="/sistema/acessos" element={<PrivateRoute><Acessos /></PrivateRoute>} />
          <Route path="/sistema/cadastro" element={<PrivateRoute><CadastroUsuario /></PrivateRoute>} />
          
          {/* Financeiro */}
          <Route path="/sistema/planos" element={<PrivateRoute><Planos /></PrivateRoute>} />
          <Route path="/sistema/despesas" element={<PrivateRoute><Despesas /></PrivateRoute>} />
          <Route path="/sistema/repasses" element={<PrivateRoute><Repasses /></PrivateRoute>} />

          {/* Pacientes e Prontuários */}
          <Route path="/sistema/pacientes" element={<PrivateRoute><Pacientes /></PrivateRoute>} />
          <Route path="/sistema/pacientes/:id" element={<PrivateRoute><Prontuario /></PrivateRoute>} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;