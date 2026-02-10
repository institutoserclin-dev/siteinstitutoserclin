import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Componentes de Proteção
import { PrivateRoute } from "@/components/PrivateRoute";

// Páginas
import Home from "@/pages/Home";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { CadastroUsuario } from "@/pages/CadastroUsuario"; // Admin
import { Pacientes } from "@/pages/Pacientes"; 
import { Prontuario } from "@/pages/Prontuario";
import { Acessos } from "@/pages/Acessos"; 
import { Horarios } from "@/pages/Horarios"; // <--- ADICIONADO AQUI

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Rotas Privadas (Sistema) */}
          <Route path="/sistema" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          
          {/* Admin e Gestão */}
          <Route path="/sistema/cadastro" element={<PrivateRoute><CadastroUsuario /></PrivateRoute>} />
          <Route path="/sistema/acessos" element={<PrivateRoute><Acessos /></PrivateRoute>} />
          
          {/* NOVA ROTA DE HORÁRIOS ADICIONADA AQUI */}
          <Route path="/sistema/horarios" element={<PrivateRoute><Horarios /></PrivateRoute>} />

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