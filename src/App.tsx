import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Importando componentes de proteção
import { PrivateRoute } from "@/components/PrivateRoute";

// Importando as páginas
import Home from "@/pages/Home";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { CadastroUsuario } from "@/pages/CadastroUsuario"; // <--- Importamos a nova página aqui

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          {/* Roteador Profissional */}
          <BrowserRouter>
            <Routes>
              {/* --- ROTAS PÚBLICAS --- */}
              
              {/* Site Principal (Landing Page) */}
              <Route path="/" element={<Home />} />

              {/* Tela de Login */}
              <Route path="/login" element={<Login />} />


              {/* --- ROTAS PROTEGIDAS (SISTEMA) --- */}
              
              {/* Painel Principal */}
              <Route 
                path="/sistema" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />

              {/* Cadastro de Novos Profissionais (Só acessa quem estiver logado) */}
              <Route 
                path="/sistema/cadastro" 
                element={
                  <PrivateRoute>
                    <CadastroUsuario />
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