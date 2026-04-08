import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { About } from "@/components/About";
import { Plans } from "@/components/Plans";
import { Covenants } from "@/components/Covenants";
import { Footer } from "@/components/Footer";
import { Award, ShieldCheck } from "lucide-react";

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-white font-sans antialiased text-slate-900 selection:bg-secondary">
      <Navbar />

      <main className="relative">
        <Hero />
        
        <div className="relative z-10 -mt-24 px-4 md:px-0">
          <About />
        </div>

        <section id="servicos" className="py-40 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-24 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-secondary">Especialidades</span>
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.8] text-primary">
                Nossa <span className="font-light text-slate-500 not-italic font-sans lowercase">Entrega</span>
              </h2>
            </div>
            <Services />
          </div>
        </section>

        <section id="convenios" className="py-40 bg-primary text-white">
          <div className="container mx-auto px-4">
            <Covenants />
          </div>
        </section>

        <section id="planos" className="py-40 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-24 space-y-4">
               <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.8] text-primary font-serif">
                Seu <span className="font-light text-slate-500 not-italic font-sans lowercase">Investimento</span>
              </h2>
            </div>
            <Plans />
          </div>
        </section>

        {/* --- FORMULÁRIO SALESFORCE COM TODAS AS FUNÇÕES RESTAURADAS --- */}
        <section id="contato" className="py-40 bg-white border-t border-slate-100">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto bg-white rounded-[4rem] shadow-2xl overflow-hidden grid md:grid-cols-2 border border-slate-100">
              
              <div className="bg-primary p-20 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10 space-y-8">
                  <h2 className="text-6xl font-black uppercase tracking-tighter italic leading-[0.8] font-serif">
                    Inicie sua<br/><span className="text-secondary not-italic font-sans">Jornada</span>
                  </h2>
                  <div className="h-1 w-20 bg-secondary"></div>
                  <p className="text-white/60 text-xl font-light leading-relaxed">
                    Um ambiente seguro para o seu desenvolvimento. Agende seu atendimento exclusivo.
                  </p>
                </div>
                <div className="relative z-10 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/30">
                  <ShieldCheck size={20} className="text-secondary" /> Protocolo de Sigilo Ético
                </div>
                <div className="absolute -bottom-20 -right-10 text-[20rem] font-black text-white/5 italic select-none pointer-events-none uppercase tracking-tighter">SC</div>
              </div>

              <div className="p-16 md:p-24 bg-white">
                <form action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8" method="POST" className="space-y-6">
                  
                  {/* FUNÇÕES SISTÊMICAS RESTAURADAS */}
                  <input type="hidden" name="oid" value="00DgL00000L3Dav" />
                  <input type="hidden" name="retURL" value="https://institutoserclin.vercel.app/obrigado" />
                  <input type="hidden" name="company" value="Instituto SerClin - Site" />
                  <input type="hidden" name="lead_source" value="Web" />
                  <input type="hidden" name="lead_status" value="Aberto - Não contatado" />

                  <div className="space-y-6 text-left">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary/40">Identificação</label>
                      <input 
                        name="last_name" 
                        type="text" 
                        required 
                        className="w-full p-4 border-b-2 border-slate-100 focus:border-secondary outline-none text-primary font-bold text-lg transition-all" 
                        placeholder="Nome Completo" 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary/40">WhatsApp (Celular)</label>
                      <input 
                        name="phone" 
                        type="tel" 
                        required 
                        className="w-full p-4 border-b-2 border-slate-100 focus:border-secondary outline-none text-primary font-bold text-lg transition-all" 
                        placeholder="(68) 99999-9999"
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "");
                          if (v.length > 11) v = v.slice(0, 11);
                          if (v.length > 10) v = v.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
                          else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
                          else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
                          e.target.value = v;
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary/40">Área de Interesse</label>
                      <select 
                        name="00NgL00003Dnk2H" 
                        className="w-full p-4 border-b-2 border-slate-100 focus:border-secondary outline-none text-primary font-bold text-lg bg-transparent"
                      >
                        <option value="">-- Selecione --</option>
                        <option value="Neuropsicologia">Neuropsicologia</option>
                        <option value="Psicopedagogia">Psicopedagogia</option>
                        <option value="Psicoterapia">Psicoterapia</option>
                      </select>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-secondary text-white hover:text-primary font-black py-8 rounded-2xl uppercase text-[11px] tracking-[0.4em] shadow-xl transition-all active:scale-95"
                    >
                      Solicitar Atendimento
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        
        {/* --- PORTAL UNIMETA --- */}
        {/* AJUSTE: Adicionado id="unimeta" para o scroll da Navbar */}
        <section id="unimeta" className="py-48 bg-white text-center relative">
          <div className="container mx-auto px-4 space-y-20 relative z-10">
            <div className="flex flex-col items-center gap-8">
              <div className="bg-slate-50 border border-slate-100 px-8 py-3 rounded-full shadow-sm flex items-center gap-4">
                <Award size={18} className="text-secondary" />
                <span className="text-[14px] font-black uppercase tracking-[0.5em] text-primary">Portal Acadêmico Unimeta</span>
              </div>
              <h3 className="text-7xl md:text-[10rem] lg:text-[13rem] font-black uppercase tracking-[-0.08em] leading-[0.8] text-primary">
                Estácio <br/><span className="font-serif italic font-light text-slate-500 lowercase">Unimeta</span>
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              {/* Ajustado para a rota privada /sistema/encaminhamentos do seu App.tsx */}
              <button 
                onClick={() => navigate('/sistema/encaminhamentos')} 
                className="bg-primary text-white font-black px-16 py-7 rounded-[2rem] uppercase text-[11px] tracking-[0.3em] hover:bg-secondary hover:text-primary transition-all shadow-xl shadow-primary/20"
              >
                Entrar no Portal
              </button>
              
              {/* Ajustado para a rota /cadastro do seu App.tsx */}
              <button 
                onClick={() => navigate('/cadastro')} 
                className="bg-white border-2 border-slate-100 text-slate-500 font-black px-16 py-7 rounded-[2rem] uppercase text-[11px] tracking-[0.3em] hover:border-primary hover:text-primary transition-all"
              >
                Criar Senha
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}