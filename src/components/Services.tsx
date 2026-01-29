import { motion } from "framer-motion";
import { Brain, Heart, Users, BookOpen, Stethoscope, Baby } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    icon: Brain,
    title: "Avaliação Neuropsicológica",
    description: "Diagnóstico detalhado das funções cognitivas e comportamentais para identificar potencialidades e dificuldades."
  },
  {
    icon: Heart,
    title: "Psicoterapia Individual",
    description: "Atendimento clínico especializado para crianças, adolescentes, adultos e idosos, focado no bem-estar emocional."
  },
  {
    icon: BookOpen,
    title: "Psicopedagogia",
    description: "Intervenção nos processos de aprendizagem, auxiliando na superação de dificuldades escolares e cognitivas."
  },
  {
    icon: Users,
    title: "Oficina das Emoções",
    description: "Grupos terapêuticos focados no desenvolvimento da inteligência emocional e habilidades sociais."
  },
  {
    icon: Stethoscope,
    title: "Capacitação Profissional",
    description: "Treinamentos e cursos para docentes, gestores e profissionais de saúde visando aprimoramento técnico."
  },
  {
    icon: Baby,
    title: "Intervenção Precoce",
    description: "Estimulação essencial para o desenvolvimento infantil nos primeiros anos de vida."
  }
];

export function Services() {
  return (
    <section id="servicos" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-secondary font-sans font-bold tracking-widest uppercase mb-2 text-sm">Nossas Especialidades</h2>
          <h3 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">Serviços Desenvolvidos</h3>
          <p className="text-muted-foreground">
            Oferecemos uma abordagem multidisciplinar e integrada para cuidar da sua saúde mental e desenvolvimento.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-none shadow-sm hover:shadow-lg transition-shadow duration-300 group bg-white">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-secondary transition-colors duration-300">
                    <service.icon className="w-6 h-6 text-primary group-hover:text-secondary transition-colors" />
                  </div>
                  <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
