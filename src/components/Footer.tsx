import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <img src={logo} alt="SerClin Logo" className="h-16 w-auto mb-4 bg-white/10 p-2 rounded-lg" />
            <p className="text-sm opacity-80 leading-relaxed">
              Promovendo saúde mental e desenvolvimento humano integral através de excelência clínica e educativa.
            </p>
          </div>
          
          <div>
            <h3 className="font-serif text-lg font-bold mb-4 text-secondary">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-secondary shrink-0" />
                <span>
                  <a href="https://wa.me/5568992161717" className="hover:text-secondary transition-colors">(68) 99216-1717</a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-secondary shrink-0" />
                <a href="mailto:institutoserclin@gmail.com" className="hover:text-secondary transition-colors">institutoserclin@gmail.com</a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary shrink-0" />
                <span>Rio Branco, Acre</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-serif text-lg font-bold mb-4 text-secondary">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/sobre" className="hover:text-secondary transition-colors">Sobre Nós</a></li>
              <li><a href="/servicos" className="hover:text-secondary transition-colors">Nossos Serviços</a></li>
              <li><a href="/planos" className="hover:text-secondary transition-colors">Planos de Cuidado</a></li>
              <li><a href="/convenios" className="hover:text-secondary transition-colors">Convênios</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-serif text-lg font-bold mb-4 text-secondary">Siga-nos</h3>
            <div className="flex gap-4">
              <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-secondary hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-secondary hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 text-center text-xs opacity-60">
          <p>&copy; {new Date().getFullYear()} Instituto SerClin. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
