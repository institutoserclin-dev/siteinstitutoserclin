import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { Menu, X, UserCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
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

  // 🌟 LIMPO E SEM DUPLICIDADE: Club e Grupo saíram daqui para ganhar caixas de destaque verticais dedicadas abaixo
  const navLinks = [
    { name: "Início", href: "#" },
    { name: "Sobre", href: "#sobre" },
    { name: "Serviços", href: "#servicos" },
    { name: "Planos", href: "#planos" },
    { name: "Contato", href: "#contato" },
    { name: "Convênios", href: "#convenios" },
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
      <div className="w-full px-6 md:px-12 flex items-center justify-between">
        
        {/* LOGO TOTALMENTE À ESQUERDA */}
        <a href="/" className="flex items-center gap-2 group shrink-0">
          <img src={logo} alt="Instituto SerClin" className="h-11 w-auto transition-transform group-hover:scale-105" />
          <span className={cn("font-serif font-bold text-xl tracking-wide hidden lg:block", isScrolled ? "text-primary" : "text-white drop-shadow-md")}>
            Instituto SerClin
          </span>
        </a>

        {/* Desktop Menu - Distribuição Coesa e Simétrica */}
        <div className="hidden xl:flex flex-1 items-center justify-between ml-12">
          
          {/* LINKS DE NAVEGAÇÃO COM OS DESTAQUES EMPILHADOS NO CENTRO */}
          <div className="flex items-center gap-7">
            {navLinks.slice(0, 3).map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={cn(
                  "text-[13px] font-black transition-colors hover:text-secondary uppercase tracking-wider whitespace-nowrap",
                  isScrolled ? "text-foreground" : "text-white drop-shadow-sm"
                )}
              >
                {link.name}
              </a>
            ))}

            {/* 🌟 DESTAQUE 1: CLUB SERCLIN (Palavras Empilhadas de Forma Elegante) */}
            <a
              href="#club"
              className={cn(
                "text-[11px] font-black uppercase tracking-widest whitespace-nowrap px-4 py-1 rounded-xl border border-secondary shadow-[0_0_15px_rgba(212,143,22,0.05)] hover:bg-secondary transition-all flex flex-col items-center justify-center leading-[1.1] text-center group min-w-[95px] h-9",
                isScrolled 
                  ? "text-primary border-secondary/70" 
                  : "text-white border-white/30 hover:text-primary"
              )}
            >
              <span className="group-hover:text-primary transition-colors">CLUB</span>
              <span className="text-[10px] opacity-90 group-hover:text-primary transition-colors">SERCLIN</span>
            </a>

            {/* 🌟 DESTAQUE 2: GRUPO TERAPÊUTICO (Palavras Empilhadas de Forma Elegante) */}
            <a
              href="#grupo-terapeutico"
              className={cn(
                "text-[11px] font-black uppercase tracking-widest whitespace-nowrap px-4 py-1 rounded-xl border transition-all flex flex-col items-center justify-center leading-[1.1] text-center group min-w-[110px] h-9",
                isScrolled 
                  ? "text-slate-700 border-slate-300 hover:bg-slate-900 hover:text-white hover:border-slate-900" 
                  : "text-white border-white/20 hover:bg-white hover:text-primary hover:border-white"
              )}
            >
              <span>PROGRAMA DE</span>
              <span className="text-[9px] opacity-80">DESENVOLVIMENTO</span>
            </a>

            {navLinks.slice(3).map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={cn(
                  "text-[13px] font-black transition-colors hover:text-secondary uppercase tracking-wider whitespace-nowrap",
                  isScrolled ? "text-foreground" : "text-white drop-shadow-sm"
                )}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* PORTAIS DE ACESSO TOTALMENTE À DIREITA */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-6 border-l pl-6" style={{ borderColor: isScrolled ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)' }}>
              <button 
                onClick={() => navigate('/login')}
                className={cn(
                  "text-[11px] font-black uppercase tracking-widest hover:text-amber-500 transition-colors flex items-center gap-1.5 whitespace-nowrap",
                  isScrolled ? "text-[#1e3a8a]" : "text-white drop-shadow-sm"
                )}
              >
                <ShieldCheck size={18} /> Colaborador
              </button>
            </div>

            <Button 
              className="bg-secondary hover:bg-primary hover:text-white text-primary font-black rounded-full h-10 px-6 transition-all uppercase text-[10px] tracking-widest shadow-lg shrink-0 border border-transparent hover:border-white/20"
              asChild
            >
              <a href="https://institutoserclin.vercel.app/checkin" target="_blank" rel="noopener noreferrer">
                <UserCircle className="w-4 h-4 mr-1.5" /> Portal do Paciente
              </a>
            </Button>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="xl:hidden p-2 rounded-xl bg-slate-100/10 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className={isScrolled ? "text-primary" : "text-white"} size={24} />
          ) : (
            <Menu className={isScrolled ? "text-primary" : "text-white"} size={24} />
          )}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="xl:hidden absolute top-full left-0 right-0 bg-white border-t border-border shadow-2xl p-6 flex flex-col gap-3 animate-in slide-in-from-top duration-200">
          {navLinks.slice(0, 3).map((link) => (
            <a key={link.name} href={link.href} className="text-primary hover:text-secondary font-black uppercase text-xs py-3 border-b border-slate-50 text-left" onClick={() => setIsMobileMenuOpen(false)}>
              {link.name}
            </a>
          ))}
          
          <a href="#club" className="bg-amber-500/10 text-secondary font-black uppercase text-xs py-3 px-4 rounded-xl flex items-center gap-2 border border-secondary/25" onClick={() => setIsMobileMenuOpen(false)}>
            <Sparkles size={14} className="animate-pulse" /> Club SerClin
          </a>

          <a href="#grupo-terapeutico" className="bg-blue-50 text-primary font-black uppercase text-xs py-3 px-4 rounded-xl flex items-center gap-2 border border-blue-100" onClick={() => setIsMobileMenuOpen(false)}>
            <Users size={14} /> Grupo Terapêutico
          </a>

          {navLinks.slice(3).map((link) => (
            <a key={link.name} href={link.href} className="text-primary hover:text-secondary font-black uppercase text-xs py-3 border-b border-slate-50 text-left" onClick={() => setIsMobileMenuOpen(false)}>
              {link.name}
            </a>
          ))}
          
          <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
            <button 
              onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
              className="bg-slate-50 text-slate-800 text-xs font-black uppercase py-4 rounded-xl flex items-center justify-center gap-2"
            >
              <ShieldCheck size={20} /> Acesso Colaborador
            </button>
          </div>

          <Button className="w-full bg-secondary text-primary font-black py-6 rounded-xl text-xs uppercase tracking-wider" asChild>
            <a href="https://institutoserclin.vercel.app/checkin" onClick={() => setIsMobileMenuOpen(false)}>
              <UserCircle size={18} className="mr-2" /> Portal do Paciente
            </a>
          </Button>
        </div>
      )}
    </nav>
  );
}