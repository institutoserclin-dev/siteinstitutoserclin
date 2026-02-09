import { Instagram, MapPin, Mail, Phone, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer id="contato" className="bg-primary text-white py-8 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Coluna 1: Sobre */}
          <div>
            <h3 className="font-serif text-xl font-bold mb-4">Instituto SerClin</h3>
            <p className="text-white/80 mb-4 leading-relaxed text-sm">
              Dedicados ao desenvolvimento humano através de uma abordagem multidisciplinar e acolhedora.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://www.instagram.com/institutoserclin/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://wa.me/5568992161717" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Coluna 2: Links */}
          <div>
            <h4 className="font-bold text-base mb-4 text-secondary">Links Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-white/80 hover:text-secondary block py-1 transition-colors">Início</a></li>
              <li><a href="#sobre" className="text-white/80 hover:text-secondary block py-1 transition-colors">Sobre Nós</a></li>
              <li><a href="#servicos" className="text-white/80 hover:text-secondary block py-1 transition-colors">Serviços</a></li>
              <li><a href="#planos" className="text-white/80 hover:text-secondary block py-1 transition-colors">Planos</a></li>
            </ul>
          </div>

          {/* Coluna 3: Contato (LINKS REFORÇADOS) */}
          <div>
            <h4 className="font-bold text-base mb-4 text-secondary">Contato</h4>
            <ul className="space-y-4 text-sm">
              
              {/* Endereço - Abre Google Maps */}
              <li>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Rua+Sorocaba+140+Doca+Furtado+Rio+Branco+AC" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-white/80 hover:text-secondary transition-colors group cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-secondary shrink-0 mt-1 group-hover:text-white transition-colors" />
                  <span>
                    Rua Sorocaba, 140<br />
                    Doca Furtado, Rio Branco - AC
                  </span>
                </a>
              </li>

              {/* Telefone - Abre Discador */}
              <li>
                <a 
                  href="tel:+5568992161717" 
                  className="flex items-center gap-3 text-white/80 hover:text-secondary transition-colors group cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-secondary shrink-0 group-hover:text-white transition-colors" />
                  <span>(68) 99216-1717</span>
                </a>
              </li>

              {/* E-mail - Abre App de Email */}
              <li>
                <a 
                  href="mailto:institutoserclin@gmail.com" 
                  className="flex items-center gap-3 text-white/80 hover:text-secondary transition-colors group cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-secondary shrink-0 group-hover:text-white transition-colors" />
                  <span className="break-all">institutoserclin@gmail.com</span>
                </a>
              </li>

            </ul>
          </div>

          {/* Coluna 4: Horário */}
          <div>
            <h4 className="font-bold text-base mb-4 text-secondary">Horário de Atendimento</h4>
            <ul className="space-y-2 text-white/80 text-sm">
              <li className="flex justify-between gap-4">
                <span>Segunda - Sexta</span>
                <span className="font-bold text-white">08:00 - 18:00</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Sábado</span>
                <span className="font-bold text-white">08:00 - 12:00</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Domingo</span>
                <span className="text-white/50">Fechado</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 text-center text-white/50 text-xs">
          <p>© {new Date().getFullYear()} Instituto SerClin. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}