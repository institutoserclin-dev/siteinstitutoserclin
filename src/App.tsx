import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary"; // Se você não tiver esse arquivo, pode remover o componente <ErrorBoundary>
import { ThemeProvider } from "@/contexts/ThemeContext"; // Se não tiver, pode remover o <ThemeProvider>

// --- COMPONENTES DE PROTEÇÃO ---
import { PrivateRoute } from "@/components/PrivateRoute";

// --- PÁGINAS ---
import Home from "@/pages/Home";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { CadastroUsuario } from "@/pages/CadastroUsuario"; // Cadastro de Equipe (Admin)
import { Pacientes } from "@/pages/Pacientes"; // Lista de Pacientes
import { Prontuario } from "@/pages/Prontuario"; // Prontuário Individual

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* --- ROTAS PÚBLICAS --- */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

              {/* --- ROTAS PROTEGIDAS (SISTEMA) --- */}
              
              {/* 1. Painel Principal (Agenda) */}
              <Route 
                path="/sistema" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />

              {/* 2. Cadastro de Profissionais (Só Admin acessa) */}
              <Route 
                path="/sistema/cadastro" 
                element={
                  <PrivateRoute>
                    <CadastroUsuario />
                  </PrivateRoute>
                } 
              />

              {/* 3. Gestão de Pacientes (Lista) */}
              <Route 
                path="/sistema/pacientes" 
                element={
                  <PrivateRoute>
                    <Pacientes />
                  </PrivateRoute>
                } 
              />

              {/* 4. Prontuário Eletrônico (Detalhes do Paciente) */}
              {/* O ":id" permite pegar qual paciente foi clicado */}
              <Route 
                path="/sistema/pacientes/:id" 
                element={
                  <PrivateRoute>
                    <Prontuario />
                  </PrivateRoute>
                } 
              />

            </Routes>
            <Toaster />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;