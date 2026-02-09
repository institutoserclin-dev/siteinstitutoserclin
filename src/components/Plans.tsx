import { motion } from "framer-motion";
import { Check, Star, Users, Zap, Briefcase, Brain, Crown, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  // --- NÍVEL 1: ENTRADA ---
  {
    name: "Plano Essencial",
    price: "99,90",
    description: "A porta de entrada para o seu autocuidado.",
    features: [
      "Atendimento Quinzenal",
      "Sessões de até 40 minutos",
      "Acolhimento pontual",
      "Orientação básica"
    ],
    highlight: false,
    icon: Heart
  },
  {
    name: "Plano Acolher",
    price: "149,90",
    description: "Manutenção emocional com suporte regular.",
    features: [
      "Atendimento Quinzenal",
      "Sessões de 50 minutos",
      "Suporte via WhatsApp",
      "Horários diferenciados"
    ],
    highlight: false,
    icon: Star
  },
  {
    name: "Cuidado Premium",
    price: "189,90",
    description: "Para quem busca ferramentas práticas de evolução.",
    features: [
      "Atendimento Quinzenal (50 min)",
      "Exercícios de fixação entre sessões",
      "Curadoria de materiais (livros/vídeos)",
      "Devolutiva verbal trimestral"
    ],
    highlight: true,
    popular: true,
    icon: Zap
  },

  // --- NÍVEL 2: ESPECÍFICOS E INTENSIVOS ---
  {
    name: "Mente Brilhante",
    price: "249,90",
    description: "Foco total em desempenho cognitivo e estudos.",
    features: [
      "Ideal para estudantes/concurseiros",
      "Treino de memória e foco",
      "Organização de rotina de estudos",
      "Material PDF exclusivo"
    ],
    highlight: false,
    icon: Brain
  },
  {
    name: "Jornada Contínua",
    price: "319,90",
    description: "Acelere resultados com acompanhamento semanal.",
    features: [
      "Atendimento Semanal (4 sessões/mês)",
      "Relatório de Evolução Semestral",
      "Monitoramento contínuo de metas",
      "1 Sessão Bônus a cada 6 meses"
    ],
    highlight: true,
    icon: Sparkles
  },
  {
    name: "Família Prestige",
    price: "Sob Consulta",
    description: "Cuidado integral para o seu maior patrimônio.",
    features: [
      "Cobertura para até 4 pessoas",
      "Terapias Semanais para todos",
      "Reunião mensal de alinhamento familiar",
      "Cuidado completo"
    ],
    highlight: true,
    gold: true, // Visual Dourado
    warning: "Sessões mensais não cumulativas.",
    icon: Crown
  },

  // --- NÍVEL 3: CORPORATIVO ---
  {
    name: "Empresarial",
    price: "Sob Consulta",
    description: "Saúde mental para colaboradores e instituições.",
    features: [
      "Convênios (SINPROAC e outros)",
      "Palestras e Workshops",
      "Plantão Psicológico",
      "Consultoria em RH"
    ],
    highlight: false,
    icon: Briefcase
  }
];

export function Plans() {
  return (
    <section id="planos" className="py-24 bg-primary text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-secondary font-sans font-bold tracking-widest uppercase mb-2 text-sm">Investimento</h2>
          <h3 className="font-serif text-3xl md:text-4xl font-bold mb-4">Planos de Acompanhamento</h3>
          <p className="text-white/80 text-lg">
            Escolha o nível de suporte ideal para o seu momento de vida.
          </p>
        </div>

        {/* Layout Flexbox Centralizado */}
        <div className="flex flex-wrap justify-center gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1rem)] max-w-sm flex"
            >
              <Card className={`flex flex-col w-full border-none shadow-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-2 
                ${plan.gold 
                  ? "bg-gradient-to-b from-white to-amber-50 border-2 border-amber-400 ring-4 ring-amber-400/20" 
                  : plan.popular 
                    ? "bg-white scale-105 z-10 border-2 border-secondary/50 shadow-2xl" 
                    : "bg-white/95"
                }`}
              >
                {/* Etiquetas de Destaque */}
                {plan.popular && !plan.gold && (
                  <div className="absolute top-0 right-0 bg-secondary text-primary text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MAIS PROCURADO
                  </div>
                )}
                {plan.gold && (
                  <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-xs font-bold px-3 py-1 text-center uppercase tracking-wider shadow-sm">
                    Exclusivo Família
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 
                    ${plan.gold ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"}`}>
                    <plan.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 min-h-[40px] leading-snug">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <span className="text-sm text-gray-500 font-medium align-top">R$</span>
                    <span className={`text-4xl font-bold ${plan.gold ? "text-amber-600" : "text-primary"}`}>
                      {plan.price}
                    </span>
                    {plan.price !== "Sob Consulta" && <span className="text-gray-500 font-medium">/mês</span>}
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.gold ? "text-amber-500" : "text-secondary"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Aviso de Não Cumulativo */}
                  {plan.warning && (
                    <div className="mt-4 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-600 font-bold text-center uppercase tracking-wide">
                      ⚠️ {plan.warning}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-4">
                  <Button 
                    className={`w-full font-bold text-lg h-12 rounded-full shadow-md transition-all 
                      ${plan.gold 
                        ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white" 
                        : "bg-secondary hover:bg-secondary/90 text-primary"}`} 
                    asChild
                  >
                    <a 
                      href={`https://wa.me/5568992161717?text=Olá, tenho interesse no ${plan.name}`} 
                      target="_blank"
                    >
                      {plan.price === "Sob Consulta" ? "Falar com Consultor" : "Quero este Plano"}
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
