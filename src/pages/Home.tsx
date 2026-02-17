import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { About } from "@/components/About";
import { Plans } from "@/components/Plans";
import { Covenants } from "@/components/Covenants";
import { Footer } from "@/components/Footer";
import { Contact } from "@/components/Contact"; // 1. ADICIONADO: Importação do componente de formulário

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.replace('#', '');
      const element = document.getElementById(elementId);
      
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground selection:bg-secondary selection:text-primary">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Covenants />
        <Plans />
        <Contact /> {/* 2. ADICIONADO: Seção de contato antes do rodapé */}
      </main>
      <Footer />
    </div>
  );
}