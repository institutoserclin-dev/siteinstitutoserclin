import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

export function Hero() {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="Consultório SerClin" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent opacity-90" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-secondary font-sans font-bold tracking-widest uppercase mb-4 text-sm md:text-base">
            Saúde e Bem-estar Integral
          </h2>
          
          {/* CORREÇÃO 1: Adicionado text-white aqui */}
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white">
            INSTITUTO SERCLIN
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 font-light">
            Acolhimento humanizado, excelência clínica e desenvolvimento profissional em um só lugar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Botão 1 - Agendar (Mantido igual) */}
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-primary font-bold text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all" asChild>
              <a href="https://wa.me/5568992161717" target="_blank">Agendar Consulta</a>
            </Button>
            
            {/* CORREÇÃO 2: Botão azul escuro com texto branco */}
            <Button 
                size="lg" 
                className="bg-blue-900 text-white hover:bg-blue-800 font-medium text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all" 
                asChild
            >
              <a href="#servicos">Conhecer Serviços</a>
            </Button>
          </div>
        </motion.div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}
