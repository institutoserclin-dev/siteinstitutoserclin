import { useEffect } from "react";
import { useLocation } from "react-router-dom"; // Importante para ler a URL
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { About } from "@/components/About";
import { Plans } from "@/components/Plans";
import { Covenants } from "@/components/Covenants";
import { Footer } from "@/components/Footer";

export default function Home() {
  const location = useLocation();

  // Efeito para rolar a página suavemente quando houver um #link
  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.replace('#', '');
      const element = document.getElementById(elementId);
      
      if (element) {
        // Pequeno delay para garantir que a página carregou antes de rolar
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      // Se não tiver # (hash), rola para o topo
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
      </main>
      <Footer />
    </div>
  );
}