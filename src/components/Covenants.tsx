import { motion } from "framer-motion";
import { Handshake } from "lucide-react";

export function Covenants() {
  return (
    <section id="convenios" className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Handshake className="w-12 h-12 text-secondary mx-auto mb-6" />
          <h2 className="text-secondary font-sans font-bold tracking-widest uppercase mb-2 text-sm">Parcerias</h2>
          <h3 className="font-serif text-3xl md:text-4xl font-bold mb-8">Convênios e Parceiros</h3>
          <p className="text-white/80 text-lg mb-12 leading-relaxed">
            Trabalhamos com diversos convênios e parcerias corporativas para facilitar seu acesso à saúde. 
            Temos orgulho de nossa parceria com o <strong>SINPROAC</strong> e outras instituições.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-70 mb-12">
             {/* Placeholders for logos - Text based for now as requested */}
             <div className="flex items-center justify-center p-6 border border-white/20 rounded-xl hover:bg-white/10 transition-colors">
               <span className="font-bold text-xl">SINPROAC</span>
             </div>
             <div className="flex items-center justify-center p-6 border border-white/20 rounded-xl hover:bg-white/10 transition-colors">
               <span className="font-bold text-xl">SINODONTO</span>
             </div>
             <div className="flex items-center justify-center p-6 border border-white/20 rounded-xl hover:bg-white/10 transition-colors">
               <span className="font-bold text-xl">CASSI</span>
             </div>
             <div className="flex items-center justify-center p-6 border border-white/20 rounded-xl hover:bg-white/10 transition-colors">
               <span className="font-bold text-xl">IGREJAS</span>
             </div>
          </div>

          <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm">
            {/* CORREÇÃO: Adicionado 'text-white' aqui */}
            <h4 className="font-serif text-xl font-bold mb-2 text-white">Sua empresa ou convênio não está na lista?</h4>
            <p className="text-sm mb-6 opacity-80">Entre em contato para verificar cobertura ou propor uma nova parceria.</p>
            <a 
              href="https://wa.me/5568992161717?text=Gostaria de saber sobre convênios aceitos." 
              target="_blank"
              className="inline-block bg-secondary text-primary font-bold px-8 py-3 rounded-full hover:bg-white transition-colors"
            >
              Consultar Cobertura
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}