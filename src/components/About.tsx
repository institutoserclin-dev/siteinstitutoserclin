import { motion } from "framer-motion";
import trainingImg from "@/assets/training.jpg";
import workshopImg from "@/assets/workshop.jpg";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function About() {
  return (
    <section id="sobre" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Mission/Vision/Values */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center p-8 bg-muted/30 rounded-2xl hover:bg-primary hover:text-white transition-colors duration-500 group"
          >
            <h3 className="font-serif text-2xl font-bold mb-4 text-primary group-hover:text-secondary">Nossa Missão</h3>
            <p className="text-muted-foreground group-hover:text-white/90 leading-relaxed">
              Promover saúde mental e desenvolvimento humano integral através de excelência clínica e educativa, acolhendo cada indivíduo em sua singularidade.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center p-8 bg-muted/30 rounded-2xl hover:bg-primary hover:text-white transition-colors duration-500 group"
          >
            <h3 className="font-serif text-2xl font-bold mb-4 text-primary group-hover:text-secondary">Nossa Visão</h3>
            <p className="text-muted-foreground group-hover:text-white/90 leading-relaxed">
              Ser referência no Acre e região em serviços clínicos integrados e capacitação profissional de alta performance para educadores e gestores.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center p-8 bg-muted/30 rounded-2xl hover:bg-primary hover:text-white transition-colors duration-500 group"
          >
            <h3 className="font-serif text-2xl font-bold mb-4 text-primary group-hover:text-secondary">Nossos Valores</h3>
            <p className="text-muted-foreground group-hover:text-white/90 leading-relaxed">
              Humanização, Ética Profissional, Inovação Científica, Responsabilidade Social, Acolhimento e Compromisso com o Bem-estar.
            </p>
          </motion.div>
        </div>

        {/* Highlight Section: Workshops & Training */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -top-4 -left-4 w-2/3 h-full bg-secondary/20 rounded-3xl -z-10" />
            <img src={workshopImg} alt="Oficina das Emoções" className="rounded-3xl shadow-xl w-full object-cover aspect-[4/3]" />
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg border-l-4 border-secondary">
              <h4 className="font-serif text-xl font-bold text-primary mb-1">Oficina das Emoções</h4>
              <p className="text-sm text-muted-foreground">Grupos terapêuticos para desenvolvimento da inteligência emocional.</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-secondary font-sans font-bold tracking-widest uppercase mb-2 text-sm">Desenvolvimento Humano</h2>
            <h3 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-6">Oficinas e Grupos Terapêuticos</h3>
            <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
              A Oficina das Emoções é um espaço seguro e acolhedor onde trabalhamos o reconhecimento e manejo das emoções, habilidades sociais e autoestima.
            </p>
            <ul className="space-y-3 mb-8">
              {["Para crianças e adolescentes", "Dinâmicas interativas", "Desenvolvimento socioemocional", "Acompanhamento profissional"].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-foreground font-medium">
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full" /> {item}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="group" asChild>
              <a href="https://wa.me/5568992161717" target="_blank">
                Saiba mais <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </motion.div>
        </div>

        {/* Highlight Section: Capacitação (Inverted) */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <h2 className="text-secondary font-sans font-bold tracking-widest uppercase mb-2 text-sm">Educação Corporativa</h2>
            <h3 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-6">Capacitação Profissional</h3>
            <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
              Desenvolvemos programas de treinamento personalizados para docentes, gestores escolares e profissionais de saúde, focando em liderança, saúde mental no trabalho e práticas pedagógicas inovadoras.
            </p>
            <Button className="bg-primary text-white hover:bg-primary/90" asChild>
              <a href="https://wa.me/5568992161717" target="_blank">Solicitar Proposta</a>
            </Button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2 relative"
          >
            <div className="absolute -bottom-4 -right-4 w-2/3 h-full bg-primary/10 rounded-3xl -z-10" />
            <img src={trainingImg} alt="Capacitação de Docentes" className="rounded-3xl shadow-xl w-full object-cover aspect-[4/3]" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
