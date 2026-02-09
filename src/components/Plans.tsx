import { motion } from "framer-motion";
import { Check, Star, Users, Zap, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  // --- LINHA DE CIMA (3 PLANOS) ---
  {
    name: "Plano Acolher",
    price: "149,90",
    description: "Para quem busca manutenção e suporte pontual.",
    features: [
      "Atendimento Quinzenal",
      "Suporte via WhatsApp",
      "Acesso a materiais básicos",
      "Horário flexível"
    ],
    highlight: false,
    icon: Star
  },
  {
    name: "Cuidado Premium",
    price: "189,90",
    description: "O equilíbrio ideal entre acompanhamento e autonomia.",
    features: [
      "Atendimento Quinzenal",
      "Sessões estendidas",
      "Prioridade na agenda",
      "Avaliação de progresso mensal"
    ],
    highlight: true, // Destaque padrão
    popular: true,
    icon: Zap
  },
  {
    name: "Plano Evolução",
    price: "319,90",
    description: "Acelere seus resultados com acompanhamento constante.",
    features: [
      "Atendimento Semanal (4 sessões)",
      "Monitoramento contínuo",
      "Plano de desenvolvimento individual",
      "Material de apoio exclusivo"
    ],
    highlight: false,
    icon: Check
  },

  // --- LINHA DE BAIXO (2 PLANOS) ---
  {
    name: "Família Gold",
    price: "1.200,00",
    description: "Cuidado integral para toda a família com valor exclusivo.",
    features: [
      "Até 4 pessoas inclusas",
      "Terapias Semanais para todos",
      "Valor por sessão: R$ 75,00",
      "Relatório familiar integrado"
    ],
    highlight: true,
    gold: true, // Estilo especial Dourado
    warning: "As sessões são mensais e não cumulativas.",
    icon: Users
  },
  {
    name: "Empresarial / Convênios",
    price: "Sob Consulta",
    description: "Soluções personalizadas para instituições e empresas.",
    features: [
      "Palestras e Workshops",
      "Plantão Psicológico",
      "Consultoria em Saúde Mental",
      "Parcerias com SINPROAC e outros"
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
            Escolha a modalidade que melhor se adapta ao seu momento de vida e necessidades.
          </p>
        </div>

        {/* Layout Flexbox para centralizar a última linha (Triângulo) */}
        <div className="flex flex-wrap justify-center gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={`w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1rem)] max-w-sm flex`}
            >
              <Card className={`flex flex-col w-full border-none shadow-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-2 
                ${plan.gold 
                  ? "bg-gradient-to-b from-white to-yellow-50 border-2 border-yellow-400 ring-4 ring-yellow-400/20" 
                  : plan.popular 
                    ? "bg-white scale-105 z-10 border-2 border-secondary" 
                    : "bg-white/95"
                }`}
              >
                {/* Faixa de Destaque */}
                {plan.popular && !plan.gold && (
                  <div className="absolute top-0 right-0 bg-secondary text-primary text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MAIS PROCURADO
                  </div>
                )}
                {plan.gold && (
                  <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-3 py-1 text-center uppercase tracking-wider">
                    Exclusivo Família
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 
                    ${plan.gold ? "bg-yellow-100 text-yellow-600" : "bg-primary/10 text-primary"}`}>
                    <plan.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 min-h-[40px]">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <span className="text-sm text-gray-500 font-medium align-top">R$</span>
                    <span className={`text-4xl font-bold ${plan.gold ? "text-yellow-600" : "text-primary"}`}>
                      {plan.price}
                    </span>
                    {plan.price !== "Sob Consulta" && <span className="text-gray-500 font-medium">/mês</span>}
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.gold ? "text-yellow-500" : "text-secondary"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Aviso Específico para o Plano Família */}
                  {plan.warning && (
                    <div className="mt-4 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-600 font-medium text-center">
                      ⚠️ {plan.warning}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-4">
                  <Button 
                    className={`w-full font-bold text-lg h-12 rounded-full shadow-lg transition-all 
                      ${plan.gold 
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white" 
                        : "bg-secondary hover:bg-secondary/90 text-primary"}`} 
                    asChild
                  >
                    <a 
                      href={`https://wa.me/5568992161717?text=Olá, tenho interesse no ${plan.name}`} 
                      target="_blank"
                    >
                      {plan.price === "Sob Consulta" ? "Falar com Consultor" : "Assinar Plano"}
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
