import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { About } from "@/components/About";
import { Plans } from "@/components/Plans";
import { Covenants } from "@/components/Covenants";
import { Footer } from "@/components/Footer";

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

        {/* --- FORMULÁRIO OFICIAL SERCLIN - CONFIGURAÇÃO FINAL --- */}
        <section id="contato" className="py-24 bg-muted/30 border-t">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2">
              
              <div className="bg-primary p-12 text-white flex flex-col justify-center">
                <h2 className="font-serif text-3xl font-bold mb-6">Inicie seu Atendimento</h2>
                <p className="text-white/80 mb-8 leading-relaxed">
                  Preencha seus dados para agendar sua avaliação no Instituto SerClin. Nosso retorno será feito prioritariamente via WhatsApp.
                </p>
                <div className="space-y-4 text-sm font-medium">
                  <p className="flex items-center gap-2">📍 Rio Branco, Acre</p>
                  <p className="flex items-center gap-2">💬 Atendimento Humanizado</p>
                </div>
              </div>

              <div className="p-12">
                {/* IMPORTANTE: Removido o modo Debug para permitir o redirecionamento automático 
                   para a página de Obrigado.
                */}
                <form action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8" method="POST">
                  
                  {/* Identificação da Org SerClin */}
                  <input type="hidden" name="oid" value="00DgL00000L3Dav" />
                  
                  {/* Redirecionamento automático para a página de sucesso */}
                  <input type="hidden" name="retURL" value="https://institutoserclin.vercel.app/obrigado" />
                  
                  {/* Campos Sistêmicos para garantir a entrada no CRM */}
                  <input type="hidden" name="company" value="Instituto SerClin - Site" />
                  <input type="hidden" name="lead_source" value="Web" />

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase text-primary/60">Nome Completo</label>
                      <input 
                        name="last_name" 
                        type="text" 
                        required 
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-secondary outline-none text-black font-medium" 
                        placeholder="Seu nome" 
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-primary/60">WhatsApp (Celular)</label>
                      <input 
                        name="phone" 
                        type="tel" 
                        required 
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-secondary outline-none text-black font-medium" 
                        placeholder="(68) 99999-9999" 
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-primary/60">E-mail</label>
                      <input 
                        name="email" 
                        type="email" 
                        required 
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-secondary outline-none text-black font-medium" 
                        placeholder="seu@email.com" 
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-primary/60">Área de Interesse</label>
                      <select 
                        name="00NgL00003Dnk2H" 
                        className="w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-secondary outline-none text-black font-medium"
                      >
                        <option value="">-- Selecione --</option>
                        <option value="Neuropsicologia">Neuropsicologia</option>
                        <option value="Psicopedagogia">Psicopedagogia</option>
                        <option value="Psicoterapia">Psicoterapia</option>
                      </select>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-secondary hover:bg-secondary/90 text-primary font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
                    >
                      SOLICITAR AGENDAMENTO
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}