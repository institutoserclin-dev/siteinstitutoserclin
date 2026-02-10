import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Importando as páginas
import Home from "@/pages/Home";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard"; // <--- Importamos a Agenda aqui

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          {/* Roteador Profissional */}
          <BrowserRouter>
            <Routes>
              {/* Rota 1: O Site Principal (Landing Page) */}
              <Route path="/" element={<Home />} />

              {/* Rota 2: A Tela de Login */}
              <Route path="/login" element={<Login />} />

              {/* Rota 3: O Painel do Sistema (Agora com a Agenda Real) */}
              <Route path="/sistema" element={<Dashboard />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;