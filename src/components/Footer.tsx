import { Facebook, Instagram, Linkedin, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer id="contato" className="bg-primary text-white pt-16 pb-8 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Coluna 1: Sobre */}
          <div>
            <h3 className="font-serif text-2xl font-bold mb-6">Instituto SerClin</h3>
            <p className="text-white/80 mb-6 leading-relaxed">
              Dedicados ao desenvolvimento humano através de uma abordagem multidisciplinar e acolhedora.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Coluna 2: Links Rápidos (CORRIGIDO AQUI) */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-secondary">Links Rápidos</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-white/80 hover:text-secondary transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Início
                </a>
              </li>
              <li>
                <a href="#sobre" className="text-white/80 hover:text-secondary transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#servicos" className="text-white/80 hover:text-secondary transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Serviços
                </a>
              </li>
              <li>
                <a href="#planos" className="text-white/80 hover:text-secondary transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Planos
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Contato */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-secondary">Contato</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary shrink-0 mt-1" />
                <span className="text-white/80">
                  Rua Valério Magalhães, 169<br />
                  Bosque, Rio Branco - AC
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-secondary shrink-0" />
                <span className="text-white/80">(68) 99216-1717</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-secondary shrink-0" />
                <span className="text-white/80">contato@institutoserclin.com.br</span>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Horário */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-secondary">Horário de Atendimento</h4>
            <ul className="space-y-2 text-white/80">
              <li className="flex justify-between">
                <span>Segunda - Sexta</span>
                <span className="font-bold text-white">08:00 - 18:00</span>
              </li>
              <li className="flex justify-between">
                <span>Sábado</span>
                <span className="font-bold text-white">08:00 - 12:00</span>
              </li>
              <li className="flex justify-between">
                <span>Domingo</span>
                <span className="text-white/50">Fechado</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-white/50 text-sm">
          <p>&copy; {new Date().getFullYear()} Instituto SerClin. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
