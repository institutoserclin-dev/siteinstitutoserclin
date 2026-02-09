import { Instagram, MapPin, Mail, Phone, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer id="contato" className="bg-primary text-white py-8 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Coluna 1: Sobre e Redes Sociais */}
          <div>
            <h3 className="font-serif text-xl font-bold mb-4">Instituto SerClin</h3>
            <p className="text-white/80 mb-4 leading-relaxed text-sm">
              Dedicados ao desenvolvimento humano através de uma abordagem multidisciplinar e acolhedora.
            </p>
            <div className="flex gap-3">
              {/* Botão Instagram */}
              <a 
                href="https://www.instagram.com/institutoserclin/" 
                target="_blank" 
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>

              {/* Botão WhatsApp */}
              <a 
                href="https://wa.me/5568992161717" 
                target="_blank" 
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Coluna 2: Links Rápidos */}
          <div>
            <h4 className="font-bold text-base mb-4 text-secondary">Links Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-white/80 hover:text-secondary transition-colors flex items-center gap-2">
                  Início
                </a>
              </li>
              <li>
                <a href="#sobre" className="text-white/80 hover:text-secondary transition-colors flex items-center gap-2">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#servicos" className="text-white/80 hover:text-secondary transition-colors flex items-center gap-2">
                  Serviços
                </a>
              </li>
              <li>
                <a href="#planos" className="text-white/80 hover:text-secondary transition-colors flex items-center gap-2">
                  Planos
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Contato */}
          <div>
            <h4 className="font-bold text-base mb-4 text-secondary">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-secondary shrink-0 mt-1" />
                {/* AQUI ESTÁ A MUDANÇA: 
                   Transformei o endereço em um link (<a>) que abre o Google Maps.
                   O link usa o endereço completo para garantir a precisão.
                */}
                <a 
                  href="https://www.google.com/maps/dir/?api=1&destination=Rua+Sorocaba,+140+-+Doca+Furtado,+Rio+Branco+-+AC" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-secondary transition-colors text-left"
                >
                  Rua Sorocaba, 140<br />
                  Doca Furtado, Rio Branco - AC
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-secondary shrink-0" />
                <span className="text-white/80">(68) 99216-1717</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-secondary shrink-0" />
                <span className="text-white/80 break-all">institutoserclin@gmail.com</span>
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
          <p>&copy; {new Date().getFullYear()} Instituto SerClin. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
