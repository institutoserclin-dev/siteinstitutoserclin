import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Cuidado Essencial",
    price: "79,00",
    features: [
      "01 Sessão individual a cada 2 meses",
      "Acesso a conteúdos exclusivos",
      "Prioridade no agendamento",
      "Desconto em workshops"
    ],
    highlight: false
  },
  {
    name: "Cuidado Profissional",
    price: "99,00",
    features: [
      "01 Sessão individual mensal",
      "Sessão extra a cada 2 meses (Bônus)",
      "Cuidado contínuo",
      "Suporte via WhatsApp"
    ],
    highlight: true,
    tag: "Mais Popular"
  },
  {
    name: "Cuidado Premium",
    price: "Consultar",
    features: [
      "02 Sessões individuais mensais",
      "01 Sessão extra a cada 2 meses (Bônus)",
      "Atendimento VIP",
      "Acesso total às Oficinas"
    ],
    highlight: false
  }
];

export function Plans() {
  return (
    <section id="planos" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-secondary/5 skew-x-12 translate-x-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-secondary font-sans font-bold tracking-widest uppercase mb-2 text-sm">Assinaturas</h2>
          <h3 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">Planos de Cuidado Continuado</h3>
          <p className="text-muted-foreground">
            Escolha o plano ideal para manter sua saúde mental e desenvolvimento em dia com economia e benefícios exclusivos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={plan.highlight ? "md:-mt-8 md:-mb-8 z-10" : ""}
            >
              <Card className={`h-full border relative transition-all duration-300 hover:shadow-xl ${plan.highlight ? 'border-secondary shadow-lg scale-105 bg-primary text-white' : 'border-border bg-white'}`}>
                {plan.tag && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-secondary text-primary hover:bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-wider">
                      {plan.tag}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pt-10 pb-2">
                  <CardTitle className={`font-serif text-2xl mb-2 ${plan.highlight ? 'text-white' : 'text-primary'}`}>
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-sm font-medium ${plan.highlight ? 'text-white/70' : 'text-muted-foreground'}`}>R$</span>
                    <span className={`text-4xl font-bold ${plan.highlight ? 'text-secondary' : 'text-primary'}`}>{plan.price}</span>
                    <span className={`text-sm font-medium ${plan.highlight ? 'text-white/70' : 'text-muted-foreground'}`}>/mês</span>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <ul className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className={`mt-1 rounded-full p-0.5 ${plan.highlight ? 'bg-secondary/20 text-secondary' : 'bg-primary/10 text-primary'}`}>
                          <Check className="w-3 h-3" />
                        </div>
                        <span className={`text-sm ${plan.highlight ? 'text-white/90' : 'text-muted-foreground'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="pb-8 pt-4">
                  <Button 
                    className={`w-full font-bold py-6 rounded-full transition-all ${plan.highlight ? 'bg-secondary text-primary hover:bg-white' : 'bg-primary text-white hover:bg-primary/90'}`}
                    asChild
                  >
                    <a href="https://wa.me/5568992161717?text=Olá, gostaria de saber mais sobre os planos de assinatura." target="_blank">
                      Assinar Agora
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
