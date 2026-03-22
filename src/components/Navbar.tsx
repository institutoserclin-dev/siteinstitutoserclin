import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { Menu, X, Phone, UserCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Início", href: "#" },
    { name: "Sobre", href: "#sobre" },
    { name: "Serviços", href: "#servicos" },
    { name: "Planos", href: "#planos" },
    { name: "Convênios", href: "#convenios" },
    { name: "Contato", href: "#contato" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-md py-2"
          : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group">
          <img src={logo} alt="Instituto SerClin" className="h-12 w-auto transition-transform group-hover:scale-105" />
          <span className={cn("font-serif font-bold text-xl tracking-wide", isScrolled ? "text-primary" : "text-white drop-shadow-md")}>
            Instituto SerClin
          </span>
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-secondary uppercase tracking-wider",
                isScrolled ? "text-foreground" : "text-white drop-shadow-sm"
              )}
            >
              {link.name}
            </a>
          ))}

          {/* --- INJEÇÃO DOS PORTAIS DE ACESSO (DESKTOP) --- */}
          <div className="flex items-center gap-4 border-l pl-6 ml-2" style={{ borderColor: isScrolled ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)' }}>
            <a 
              href="https://institutoserclin.vercel.app/checkin" 
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "text-[14px] font-black uppercase tracking-widest hover:text-amber-500 transition-colors flex items-center gap-1",
                isScrolled ? "text-[#1e3a8a]" : "text-white drop-shadow-sm"
              )}
            >
              <UserCircle size={24} /> Portal Do Paciente
            </a>
            <a 
              href="https://institutoserclin.vercel.app/sistema" 
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "text-[14px] font-black uppercase tracking-widest hover:text-amber-500 transition-colors flex items-center gap-1",
                isScrolled ? "text-[#1e3a8a]" : "text-white drop-shadow-sm"
              )}
            >
              <ShieldCheck size={24} /> Colaborador
            </a>
          </div>
          {/* ----------------------------------------------- */}

          <Button 
            className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold rounded-full ml-2"
            asChild
          >
            <a href="https://wa.me/5568992161717" target="_blank" rel="noopener noreferrer">
              <Phone className="w-4 h-4 mr-2" /> Agendar
            </a>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className={isScrolled ? "text-primary" : "text-white"} />
          ) : (
            <Menu className={isScrolled ? "text-primary" : "text-white"} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-border shadow-lg p-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-foreground hover:text-primary font-medium py-2 border-b border-border/50 last:border-0"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          
          {/* --- INJEÇÃO DOS PORTAIS DE ACESSO (MOBILE) --- */}
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            <a 
              href="https://institutoserclin.vercel.app/checkin" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-50 text-[#1e3a8a] text-xs font-black uppercase py-3 rounded-lg text-center flex items-center justify-center gap-2"
            >
              <UserCircle size={16} /> Portal do Paciente
            </a>
            <a 
              href="https://institutoserclin.vercel.app/sistema" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-100 text-gray-600 text-xs font-black uppercase py-3 rounded-lg text-center flex items-center justify-center gap-2"
            >
              <ShieldCheck size={16} /> Acesso Colaborador
            </a>
          </div>
          {/* ---------------------------------------------- */}

          <Button className="w-full bg-primary text-white mt-2" asChild>
            <a href="https://wa.me/5568992161717" target="_blank" rel="noopener noreferrer">
              Agendar via WhatsApp
            </a>
          </Button>
        </div>
      )}
    </nav>
  );
}