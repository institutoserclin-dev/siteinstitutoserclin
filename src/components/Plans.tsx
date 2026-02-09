import { motion } from "framer-motion";
import { Check, Star, Users, Zap, Briefcase, Brain, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  // --- LINHA DE CIMA (3 PLANOS DE ENTRADA/INTERMEDIÁRIOS) ---
  {
    name: "Plano Acolher",
    price: "149,90",
    description: "Manutenção emocional e suporte pontual.",
    features: [
      "Atendimento Quinzenal",
      "Suporte via WhatsApp",
      "Acolhimento humanizado",
      "Horários flexíveis"
    ],
    highlight: false,
    icon: Star
  },
  {
    name: "Cuidado Premium",
    price: "189,90",
    description: "Equilíbrio ideal entre autonomia e suporte.",
    features: [
      "Atendimento Quinzenal",
      "Sessões estendidas",
      "Prioridade na agenda",
      "Monitoramento de metas"
    ],
    highlight: true,
    popular: true,
    icon: Zap
  },
  {
    name: "Mente Brilhante",
    price: "249,90",
    description: "Foco em estimulação cognitiva e aprendizagem.",
    features: [
      "Ideal para estudantes/concurseiros",
      "Técnicas de memorização",
      "Organização de rotina",
      "Material de apoio cognitivo"
    ],
    highlight: false,
    icon: Brain
  },

  // --- LINHA DE BAIXO (3 PLANOS DE ALTO VALOR/GRUPOS) ---
  {
    name: "Jornada Contínua",
    price: "319,90",
    description: "Acelere resultados com terapia semanal.",
    features: [
      "Atendimento Semanal (4 sessões)",
      "Acompanhamento intensivo",
      "Profundidade terapêutica",
      "Plano de desenvolvimento pessoal"
    ],
    highlight: true,
    icon: Check
  },
  {
    name: "Família Prestige Gold",
    price: "1.200,00",
    description: "Cuidado integral para o seu maior patrimônio.",
    features: [
      "Cobertura para até 4 pessoas",
      "Terapias Semanais para todos",
      "Economia inteligente",
      "Relatório familiar integrado"
    ],
    highlight: true,
    gold: true, // Ativa o visual dourado
    warning: "Sessões mensais não cumulativas.",
    icon: Crown
  },
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
      {/* Elementos de Fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-secondary font-sans font-bold tracking-widest uppercase mb-2 text-sm">Investimento</h2>
          <h3 className="font-serif text-3xl md:text-4xl font-bold mb-4">Planos de Acompanhamento</h3>
          <p className="text-white/80 text-lg">
            Opções flexíveis desenhadas para cada etapa da sua jornada de desenvolvimento.
          </p>
        </div>

        {/* Grid Responsivo: 1 coluna (mobile), 2 (tablet), 3 (PC) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="w-full max-w-sm flex"
            >
              <Card className={`flex flex-col w-full border-none shadow-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-2 
                ${plan.gold 
                  ? "bg-gradient-to-b from-white to-amber-50 border-2 border-amber-400 ring-4 ring-amber-400/20" 
                  : plan.highlight 
                    ? "bg-white scale-105 z-10 border-2 border-secondary/50 shadow-2xl" 
                    : "bg-white/95"
                }`}
              >
                {/* Faixas de Destaque */}
                {plan.popular && !plan.gold && (
                  <div className="absolute top-0 right-0 bg-secondary text-primary text-xs font-bold px-3 py-1 rounded-bl-lg">
                    RECOMENDADO
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

                  {/* Aviso Específico para o Plano Família */}
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
                      {plan.price === "Sob Consulta" ? "Consultar Empresa" : "Escolher Plano"}
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
