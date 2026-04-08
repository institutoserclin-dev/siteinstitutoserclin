import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { Menu, X, UserCircle, ShieldCheck, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

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
        {/* LOGO */}
        <a href="/" className="flex items-center gap-2 group shrink-0">
          <img src={logo} alt="Instituto SerClin" className="h-12 w-auto transition-transform group-hover:scale-105" />
          <span className={cn("font-serif font-bold text-xl tracking-wide hidden lg:block", isScrolled ? "text-primary" : "text-white drop-shadow-md")}>
            Instituto SerClin
          </span>
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex flex-1 items-center justify-between ml-12">
          
          {/* BLOCO LINKS PRINCIPAIS */}
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={cn(
                  "text-sm font-black transition-colors hover:text-secondary uppercase tracking-wider",
                  isScrolled ? "text-foreground" : "text-white drop-shadow-sm"
                )}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* BLOCO DE ACESSOS */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-l pl-6" style={{ borderColor: isScrolled ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)' }}>
              
              {/* AJUSTE: Link para o ID #unimeta na Home */}
              <a 
                href="#unimeta"
                className={cn(
                  "text-[14px] font-black uppercase tracking-widest hover:text-amber-500 transition-colors flex items-center gap-1",
                  isScrolled ? "text-[#1e3a8a]" : "text-white drop-shadow-sm"
                )}
              >
                <GraduationCap size={24} /> Acadêmico Estácio
              </a>

              <button 
                onClick={() => navigate('/login')}
                className={cn(
                  "text-[14px] font-black uppercase tracking-widest hover:text-amber-500 transition-colors flex items-center gap-1",
                  isScrolled ? "text-[#1e3a8a]" : "text-white drop-shadow-sm"
                )}
              >
                <ShieldCheck size={24} /> Colaborador
              </button>
            </div>

            <Button 
              className="bg-secondary hover:bg-secondary/90 text-primary font-black rounded-full px-6 transition-all uppercase text-[10px] tracking-widest shadow-lg"
              asChild
            >
              <a href="https://institutoserclin.vercel.app/checkin" target="_blank" rel="noopener noreferrer">
                <UserCircle className="w-4 h-4 mr-2" /> Portal do Paciente
              </a>
            </Button>
          </div>
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
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-border shadow-lg p-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-primary hover:text-secondary font-black uppercase text-sm py-3 border-b border-slate-50 last:border-0"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          
          <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
            <a 
              href="#unimeta"
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-blue-50 text-[#1e3a8a] text-xs font-black uppercase py-4 rounded-xl flex items-center justify-center gap-2"
            >
              <GraduationCap size={20} /> Portal Estácio
            </a>
            <button 
              onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
              className="bg-slate-50 text-slate-500 text-xs font-black uppercase py-4 rounded-xl flex items-center justify-center gap-2"
            >
              <ShieldCheck size={20} /> Acesso Colaborador
            </button>
          </div>

          <Button className="w-full bg-secondary text-primary font-black py-7 rounded-xl" asChild>
            <a href="https://institutoserclin.vercel.app/checkin" onClick={() => setIsMobileMenuOpen(false)}>
              <UserCircle size={18} className="mr-2" /> Portal do Paciente
            </a>
          </Button>
        </div>
      )}
    </nav>
  );
}