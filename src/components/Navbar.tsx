import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Início", href: "/" },
    { name: "Sobre", href: "/sobre" },
    { name: "Serviços", href: "/servicos" },
    { name: "Planos", href: "/planos" },
    { name: "Convênios", href: "/convenios" },
    { name: "Contato", href: "/contato" },
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
        <Link href="/">
          <a className="flex items-center gap-2 group">
            <img src={logo} alt="Instituto SerClin" className="h-12 w-auto transition-transform group-hover:scale-105" />
            <span className={cn("font-serif font-bold text-xl tracking-wide", isScrolled ? "text-primary" : "text-white drop-shadow-md")}>
              Instituto SerClin
            </span>
          </a>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href}>
              <a
                className={cn(
                  "text-sm font-medium transition-colors hover:text-secondary uppercase tracking-wider",
                  isScrolled ? "text-foreground" : "text-white drop-shadow-sm"
                )}
              >
                {link.name}
              </a>
            </Link>
          ))}
          <Button 
            className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold rounded-full"
            asChild
          >
            <a href="https://wa.me/5568992161717" target="_blank" rel="noopener noreferrer">
              <Phone className="w-4 h-4 mr-2" /> Agendar
            </a>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-primary"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className={isScrolled ? "text-primary" : "text-white"} /> : <Menu className={isScrolled ? "text-primary" : "text-white"} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-border shadow-lg p-4 flex flex-col gap-4 animate-in slide-in-from-top-5">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href}>
              <a
                className="text-foreground hover:text-primary font-medium py-2 border-b border-border/50 last:border-0"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            </Link>
          ))}
          <Button className="w-full bg-primary text-white" asChild>
            <a href="https://wa.me/5568992161717" target="_blank" rel="noopener noreferrer">Agendar via WhatsApp</a>
          </Button>
        </div>
      )}
    </nav>
  );
}
