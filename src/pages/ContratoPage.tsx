import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import { 
  ArrowLeft, Download, Search, User, ShieldAlert, Send, CheckCircle2, Clock, Phone, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import logoSer2 from '@/assets/ser2.png';

export const MAPA_CRP_PROFISSIONAIS: Record<string, string> = {
  'helenara': 'CRP - 24/02216',
  'helenara chaves': 'CRP - 24/02216',
  'helenara maria da silva mendes chaves': 'CRP - 24/02216',
  'dra helenara chaves': 'CRP - 24/02216',
};

export const obterCrpProfissional = (nome: string, crpBanco?: string): string => {
  if (crpBanco && crpBanco.trim() !== '') return crpBanco;
  if (!nome) return 'CRP 24/_____';
  
  const nomeLimpo = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  for (const chave in MAPA_CRP_PROFISSIONAIS) {
    const chaveLimpa = chave
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
      
    if (nomeLimpo.includes(chaveLimpa) || chaveLimpa.includes(nomeLimpo)) {
      return MAPA_CRP_PROFISSIONAIS[chave];
    }
  }

  return 'CRP 24/_____';
};

export function ContratoPage() {
  const navigate = useNavigate();

  const [buscaPaciente, setBuscaPaciente] = useState("");
  const [pacientesSugeridos, setPacientesSugeridos] = useState<any[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);

  const [equipe, setEquipe] = useState<any[]>([]);
  const [profissionalNome, setProfissionalNome] = useState("");
  const [profissionalCrp, setProfissionalCrp] = useState("CRP - 24/02216");

  const [cpfPaciente, setCpfPaciente] = useState("");
  const [telefonePaciente, setTelefonePaciente] = useState("");
  const [valorContrato, setValorContrato] = useState("1.300,00");

  const [contratoCriado, setContratoCriado] = useState<any>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const carregarProfissionais = async () => {
      const { data } = await supabase.from('perfis').select('*').order('nome');
      if (data) {
        const filtrados = data.filter((p: any) => {
          const n = (p.nome || "").toLowerCase();
          const r = (p.role || "").toLowerCase();
          const proibidos = ['instituto', 'recepcao', 'recepção'];
          return !proibidos.some(termo => n.includes(termo)) && r !== 'secretaria';
        });
        setEquipe(filtrados);

        const helenaraPadrao = filtrados.find((p: any) => 
          (p.nome || "").toLowerCase().includes("helenara")
        );
        if (helenaraPadrao) {
          setProfissionalNome(helenaraPadrao.nome);
          setProfissionalCrp(obterCrpProfissional(helenaraPadrao.nome, helenaraPadrao.crp || helenaraPadrao.conselho));
        } else if (filtrados.length > 0) {
          setProfissionalNome(filtrados[0].nome);
          setProfissionalCrp(obterCrpProfissional(filtrados[0].nome, filtrados[0].crp || filtrados[0].conselho));
        }
      }
    };
    carregarProfissionais();
  }, []);

  useEffect(() => {
    const pesquisar = async () => {
      if (buscaPaciente.length < 2) {
        setPacientesSugeridos([]);
        return;
      }
      const { data } = await supabase
        .from('pacientes')
        .select('id, nome, cpf, telefone')
        .ilike('nome', `%${buscaPaciente}%`)
        .limit(5);

      setPacientesSugeridos(data || []);
    };
    pesquisar();
  }, [buscaPaciente]);

  const aplicarMascaraTelefone = (val: string) => {
    if (!val) return '';
    const nums = val.replace(/\D/g, '');
    return nums
      .replace(/(\d{2})(\d)/, '($1) $2')       .replace(/(\d{5})(\d{4})$/, '$1-$2')
      .slice(0, 15);
  };

  const selecionarPaciente = async (pac: any) => {
    setPacienteSelecionado(pac);
    setBuscaPaciente(pac.nome);
    setCpfPaciente(pac.cpf || "");
    setTelefonePaciente(aplicarMascaraTelefone(pac.telefone || ""));
    setPacientesSugeridos([]);

    const { data: existente } = await supabase
      .from('contratos')
      .select('*')
      .eq('paciente_nome', pac.nome)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existente) {
      setContratoCriado(existente);
    } else {
      setContratoCriado(null);
    }
  };

  const aplicarMascaraMoeda = (value: string) => {
    const apenasNumeros = value.replace(/\D/g, "");
    const valorFloat = parseFloat(apenasNumeros) / 100;
    if (isNaN(valorFloat)) return "0,00";
    return valorFloat.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const enviarParaAssinaturaWhatsapp = async () => {
    if (!buscaPaciente) return toast.error("Informe o nome do paciente.");
    if (!profissionalNome) return toast.error("Selecione o profissional responsável.");
    
    const foneLimpo = telefonePaciente.replace(/\D/g, '');
    if (foneLimpo.length < 10) {
      return toast.error("Informe um WhatsApp válido com DDD (ex: 68999999999).");
    }

    setEnviando(true);
    try {
      const valorNumerico = parseFloat(valorContrato.replace(/\./g, '').replace(',', '.')) || 1300.00;
      const cpfLimpo = cpfPaciente ? cpfPaciente.replace(/\D/g, '') : null;

      const payloadContrato = {
        paciente_nome: buscaPaciente.trim().toUpperCase(),
        paciente_cpf: cpfLimpo && cpfLimpo.length === 11 ? cpfLimpo : (cpfPaciente || null),
        paciente_telefone: foneLimpo,
        profissional_nome: profissionalNome,
        profissional_crp: profissionalCrp,
        valor: valorNumerico,
        status: 'Pendente'
      };

      const { data: novo, error } = await supabase
        .from('contratos')
        .insert([payloadContrato])
        .select('*')
        .single();

      if (error) {
        console.error("Erro detalhado do Supabase (Contratos):", error);
        throw new Error(error.message || "Erro ao registrar contrato no banco.");
      }

      if (!novo) {
        throw new Error("Nenhum dado retornado após a inserção do contrato.");
      }

      setContratoCriado(novo);

      const linkAssinatura = `${window.location.origin}/assinar/${novo.id}`;

      await navigator.clipboard.writeText(linkAssinatura);

      const nomeFormatado = buscaPaciente.trim().toUpperCase();
      const mensagem = `Olá, *${nomeFormatado}*! Segue o link para conferência e assinatura eletrônica do seu Contrato Terapêutico no Instituto SerClin:\n${linkAssinatura}\n\nAo acessar, você receberá um código de confirmação.`;
      
      window.open(`https://wa.me/55${foneLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');

      toast.success("Contrato gerado! WhatsApp aberto e link copiado.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gerar contrato.");
    } finally {
      setEnviando(false);
    }
  };

  const verificarStatusContrato = async () => {
    if (!contratoCriado?.id) return;
    const { data } = await supabase.from('contratos').select('*').eq('id', contratoCriado.id).single();
    if (data) {
      setContratoCriado(data);
      if (data.paciente_assinado) {
        toast.success("O paciente já assinou este contrato!");
      } else {
        toast.info("Aguardando assinatura do paciente.");
      }
    }
  };

  const gerarContratoPDF = () => {
    if (!buscaPaciente) return toast.error("Informe o nome do paciente.");
    if (!profissionalNome) return toast.error("Selecione o profissional responsável.");

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margemEsquerda = 20;
      const larguraUtil = 170;
      let y = 10;

      try {
        doc.addImage(logoSer2, "PNG", margemEsquerda, y, 26, 17);
      } catch (e) {
        console.warn("Logo não carregada:", e);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text("INSTITUTO SERCLIN", margemEsquerda + 30, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("Clínica de Psicologia & Neuropsicologia Integrada", margemEsquerda + 30, y + 9.5);
      doc.text("Rio Branco - Acre | Atendimento Especializado", margemEsquerda + 30, y + 13.5);

      y += 19;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(margemEsquerda, y, margemEsquerda + larguraUtil, y);

      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(30, 58, 138);
      doc.text("CONTRATO TERAPÊUTICO / TERMO DE CIÊNCIA", 105, y, { align: "center" });

      y += 5;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margemEsquerda, y, larguraUtil, 12, 2, 2, "F");

      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text("PACIENTE:", margemEsquerda + 4, y + 4.5);
      doc.setFont("helvetica", "normal");
      doc.text(buscaPaciente.toUpperCase(), margemEsquerda + 24, y + 4.5);

      doc.setFont("helvetica", "bold");
      doc.text("CPF:", margemEsquerda + 4, y + 9);
      doc.setFont("helvetica", "normal");
      doc.text(cpfPaciente || "Não informado", margemEsquerda + 14, y + 9);

      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text("Declaro estar ciente e de acordo com as condições recíprocas para realização da Avaliação Neuropsicológica no Instituto SerClin:", margemEsquerda, y, { maxWidth: larguraUtil, align: "justify" });

      y += 6;
      const clausulas = [
        {
          titulo: "• Valor e Pagamento:",
          texto: `R$ ${valorContrato} à vista ou via Pix. No cartão de crédito, acrescido da taxa da máquina em até 12x.`
        },
        {
          titulo: "• Duração e Entrega:",
          texto: "Aproximadamente 6 a 8 sessões de ~40 min (1ª anamnese, sessões seguintes testes e última devolutiva). Laudo entregue no prazo de 20 a 30 dias úteis após o término dos testes."
        },
        {
          titulo: "• Pontualidade e Compensação de Atrasos (Bilateral):",
          texto: "Os atendimentos ocorrem por hora marcada. O atraso por parte do paciente não será compensado ao final. Em caso de atraso decorrente do profissional/clínica, o tempo excedente será integralmente compensado ao final da mesma sessão ou reposto posteriormente."
        },
        {
          titulo: "• Remarcações e Manutenção da Agenda:",
          texto: "O paciente manterá o mesmo horário fixo até a conclusão. Em caso de remarcação pela clínica por imprevistos, o paciente tem prioridade e garantia de cumprimento de todas as sessões."
        },
        {
          titulo: "• Cláusula de Cancelamento e Rescisão:",
          texto: "O PACIENTE poderá rescindir este contrato a qualquer momento, mediante aviso prévio por escrito.\n" +
                 "Parágrafo Primeiro: Em desistência anterior à 1ª sessão, retenção de 10% do valor total para taxas administrativas e reserva de agenda.\n" +
                 "Parágrafo Segundo: Em desistência após o início, o PACIENTE pagará o valor proporcional exato das sessões realizadas (Valor Total ÷ Nº Total de Sessões).\n" +
                 "Parágrafo Terceiro: Sobre o saldo das sessões não realizadas, incidirá multa rescisória de 15%, sendo o restante reembolsado em até 15 dias úteis via Pix."
        }
      ];

      clausulas.forEach(c => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 58, 138);
        doc.text(c.titulo, margemEsquerda, y);
        y += 3.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.8);
        doc.setTextColor(51, 65, 85);
        const linhas = doc.splitTextToSize(c.texto, larguraUtil);
        doc.text(linhas, margemEsquerda + 2, y);
        y += (linhas.length * 2.8) + 1.8;
      });

      y += 1;
      const hoje = format(new Date(), "'Rio Branco - AC,' dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(hoje, 105, y, { align: "center" });

      y += 4;
      const largBox = 80;
      const posX1 = margemEsquerda + 2;
      const posX2 = margemEsquerda + larguraUtil - largBox - 2;

      if (contratoCriado?.paciente_assinado) {
        doc.setDrawColor(202, 138, 4);
        doc.setFillColor(254, 252, 232);
        doc.roundedRect(posX1, y, largBox, 26, 2, 2, "FD");

        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(133, 77, 14);
        doc.text("ASSINATURA DO(A) PACIENTE/RESPONSÁVEL", posX1 + (largBox / 2), y + 4.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(74, 54, 20);
        doc.text(buscaPaciente.toUpperCase(), posX1 + (largBox / 2), y + 8.5, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 83, 9);
        doc.text("ASSINADO ELETRONICAMENTE", posX1 + (largBox / 2), y + 13, { align: "center" });
        doc.text("(AUTENTICAÇÃO VIA TOKEN OTP)", posX1 + (largBox / 2), y + 16.5, { align: "center" });

        doc.setFontSize(5.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(113, 63, 18);
        const dataAssinatura = contratoCriado.paciente_assinado_em 
          ? format(new Date(contratoCriado.paciente_assinado_em), 'dd/MM/yyyy HH:mm') 
          : format(new Date(), 'dd/MM/yyyy HH:mm');
        doc.text(`Data: ${dataAssinatura} | IP: ${contratoCriado.paciente_ip || 'Auditado'}`, posX1 + (largBox / 2), y + 21, { align: "center" });

        doc.setDrawColor(30, 58, 138);
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(posX2, y, largBox, 26, 2, 2, "FD");

        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("PROFISSIONAL RESPONSÁVEL", posX2 + (largBox / 2), y + 4.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(224, 231, 255);
        doc.text(profissionalNome.toUpperCase(), posX2 + (largBox / 2), y + 9.5, { align: "center" });
        doc.text(profissionalCrp, posX2 + (largBox / 2), y + 13.5, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.5);
        doc.setTextColor(191, 219, 254);
        doc.text("EMISSÃO ELETRÔNICA OFICIAL • INSTITUTO SERCLIN", posX2 + (largBox / 2), y + 20, { align: "center" });

      } else {
        const largLinha = 72;
        const pX1 = margemEsquerda + 4;
        const pX2 = margemEsquerda + larguraUtil - largLinha - 4;

        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.35);
        doc.line(pX1, y + 9, pX1 + largLinha, y + 9);

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("ASSINATURA DO(A) PACIENTE/RESPONSÁVEL", pX1 + (largLinha / 2), y + 12.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text(buscaPaciente.toUpperCase(), pX1 + (largLinha / 2), y + 16, { align: "center" });

        doc.line(pX2, y + 9, pX2 + largLinha, y + 9);

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("PROFISSIONAL RESPONSÁVEL", pX2 + (largLinha / 2), y + 12.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text(profissionalNome.toUpperCase(), pX2 + (largLinha / 2), y + 16, { align: "center" });
        doc.text(profissionalCrp, pX2 + (largLinha / 2), y + 19.5, { align: "center" });
      }

      doc.save(`Contrato_${buscaPaciente.trim().replace(/\s+/g, '_')}.pdf`);
      toast.success("Contrato Terapêutico emitido com sucesso!");

    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao emitir arquivo PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b px-4 md:px-8 shadow-sm sticky top-0 z-40">
        <div className="flex justify-between items-center h-[80px] max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
              <ArrowLeft size={22} className="text-[#1e3a8a]" />
            </Button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/sistema')}>
              <img src={logoSer2} className="w-10 h-10 object-contain" alt="SerClin" />
              <div>
                <h1 className="text-base font-black text-[#1e3a8a] uppercase leading-none">Emissão de Contrato</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Gestão de Documentação e Assinaturas</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={gerarContratoPDF} 
              variant="outline"
              className="border-blue-200 text-[#1e3a8a] hover:bg-blue-50 font-black rounded-xl h-11 px-4 shadow-sm flex items-center gap-2 uppercase text-xs"
            >
              <Download size={16} /> Baixar PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        <div className="lg:col-span-5 space-y-5">
          <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6 space-y-4">
            <h2 className="text-sm font-black text-[#1e3a8a] uppercase tracking-wider flex items-center gap-2">
              <User size={18} className="text-blue-600" /> Dados do Contrato
            </h2>

            <div className="space-y-1 relative">
              <label className="text-[11px] font-bold text-gray-500 uppercase">Paciente</label>
              <div className="relative">
                <Input 
                  placeholder="Digite para buscar paciente..." 
                  value={buscaPaciente} 
                  onChange={(e) => setBuscaPaciente(e.target.value)}
                  className="bg-gray-50 border-none h-11 uppercase font-bold text-sm"
                />
                <Search size={18} className="absolute right-3 top-3 text-gray-400" />
              </div>
              {pacientesSugeridos.length > 0 && (
                <div className="absolute z-50 w-full bg-white border shadow-xl rounded-2xl mt-1 overflow-hidden">
                  {pacientesSugeridos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selecionarPaciente(p)}
                      className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-none flex justify-between items-center"
                    >
                      <span className="font-bold text-xs uppercase text-gray-800">{p.nome}</span>
                      <span className="text-[10px] text-gray-400">{p.cpf || 'Sem CPF'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">CPF</label>
                <Input 
                  placeholder="000.000.000-00" 
                  value={cpfPaciente} 
                  onChange={(e) => setCpfPaciente(e.target.value)}
                  className="bg-gray-50 border-none h-11 font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  <Phone size={12} className="text-emerald-600" /> WhatsApp
                </label>
                <Input 
                  placeholder="(68) 99999-9999" 
                  value={telefonePaciente} 
                  onChange={(e) => setTelefonePaciente(aplicarMascaraTelefone(e.target.value))}
                  className="bg-gray-50 border-none h-11 font-bold text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase">Profissional Responsável</label>
              <Select value={profissionalNome} onValueChange={(val) => {
                setProfissionalNome(val);
                const prof = equipe.find(p => p.nome === val);
                setProfissionalCrp(obterCrpProfissional(val, prof?.crp || prof?.conselho));
              }}>
                <SelectTrigger className="bg-gray-50 border-none h-11 font-bold text-sm">
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {equipe.map((p) => (
                    <SelectItem key={p.id} value={p.nome} className="font-bold text-xs uppercase">
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Registro / CRP</label>
                <Input 
                  value={profissionalCrp} 
                  onChange={(e) => setProfissionalCrp(e.target.value)}
                  className="bg-gray-50 border-none h-11 font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Valor Total (R$)</label>
                <Input 
                  value={valorContrato} 
                  onChange={(e) => setValorContrato(aplicarMascaraMoeda(e.target.value))}
                  className="bg-gray-50 border-none h-11 font-bold text-sm"
                />
              </div>
            </div>

            {contratoCriado && (
              <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between transition-all ${contratoCriado.paciente_assinado ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <div className="flex items-center gap-2">
                  {contratoCriado.paciente_assinado ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  <span className="font-bold uppercase tracking-wider">
                    {contratoCriado.paciente_assinado ? 'Assinado Digitalmente' : 'Pendente de Assinatura'}
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={verificarStatusContrato}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded" 
                  title="Atualizar Status"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Button 
                onClick={enviarParaAssinaturaWhatsapp} 
                disabled={enviando}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-12 uppercase text-xs tracking-wider shadow-lg flex items-center justify-center gap-2"
              >
                {enviando ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                Enviar Assinatura via WhatsApp
              </Button>

              <Button 
                onClick={gerarContratoPDF} 
                variant="outline"
                className="w-full border-blue-200 text-[#1e3a8a] hover:bg-blue-50 font-black rounded-xl h-11 uppercase text-xs tracking-wider shadow-sm flex items-center justify-center gap-2"
              >
                <Download size={16} /> Baixar PDF {contratoCriado?.paciente_assinado ? 'Assinado' : 'para Assinatura Física'}
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-6 md:p-8 space-y-4">
            <div className="text-center space-y-1 border-b pb-3">
              <h2 className="text-lg font-black text-[#1e3a8a] uppercase tracking-wide">
                Contrato Terapêutico / Termo de Ciência
              </h2>
              <p className="text-xs text-gray-400 font-bold uppercase">Instituto SerClin • Rio Branco - AC</p>
            </div>

            <div className="bg-blue-50/60 p-4 rounded-2xl space-y-1 text-xs">
              <p className="text-gray-700"><strong>Paciente:</strong> {buscaPaciente ? buscaPaciente.toUpperCase() : "_____________________"}</p>
              <p className="text-gray-700"><strong>CPF:</strong> {cpfPaciente || "___.___.___-__"}</p>
              <p className="text-gray-700"><strong>Profissional:</strong> {profissionalNome || "_____________________"} ({profissionalCrp})</p>
              <p className="text-gray-700"><strong>Valor Global:</strong> R$ {valorContrato}</p>
            </div>

            <div className="space-y-2.5 text-xs leading-relaxed text-gray-600 max-h-[46vh] overflow-y-auto pr-2 custom-scrollbar">
              <p className="font-bold text-gray-800">Condições Gerais de Atendimento (Recíprocas):</p>
              <p>• <strong>Duração do Processo:</strong> Aproximadamente 6 a 8 sessões (1ª anamnese, sessões seguintes testes e última entrega do laudo).</p>
              <p>• <strong>Duração das Sessões:</strong> Cerca de 40 minutos cada, conforme o ritmo do paciente.</p>
              <p>• <strong>Entrega do Laudo:</strong> De 20 a 30 dias úteis após a finalização dos testes.</p>
              <p>• <strong>Agendamento:</strong> Atendimentos por hora marcada mantendo o mesmo horário fixo até a conclusão.</p>
              <p>• <strong>Atrasos e Compensação:</strong> O atraso do paciente não será compensado ao fim da sessão. Em caso de atraso da clínica/profissional, o tempo é integralmente compensado na mesma sessão ou reposto posteriormente.</p>
              <p>• <strong>Remarcações pela Clínica:</strong> Em caso de imprevistos pela clínica, o paciente não perde a sessão e é devidamente reagendado com prioridade.</p>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-[11px] text-amber-950 mt-3">
                <p className="font-black text-[#854d0e] uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-amber-600" /> Cláusula de Cancelamento e Rescisão
                </p>
                <p>O PACIENTE poderá rescindir este contrato a qualquer momento, mediante aviso prévio por escrito.</p>
                <p><strong>Parágrafo Primeiro:</strong> Em desistência anterior à 1ª sessão, retenção de 10% do valor total para taxas administrativas e reserva de agenda.</p>
                <p><strong>Parágrafo Segundo:</strong> Em desistência após o início, o PACIENTE pagará o valor proporcional exato das sessões realizadas (Valor Total ÷ Nº Total de Sessões).</p>
                <p><strong>Parágrafo Terceiro:</strong> Sobre o saldo das sessões não realizadas, incidirá multa rescisória de 15%, sendo o restante reembolsado em até 15 dias úteis via Pix.</p>
              </div>
            </div>

            <div className="border-t pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-center">
              <div className="w-full sm:w-1/2 border-t border-gray-300 pt-2">
                <span className="block text-[11px] font-bold text-gray-800 uppercase">{buscaPaciente || "Paciente / Responsável"}</span>
                <span className="text-[9px] text-gray-400 uppercase">
                  {contratoCriado?.paciente_assinado ? '✓ Assinado Digitalmente (OTP)' : 'Assinatura do Paciente'}
                </span>
              </div>
              <div className="w-full sm:w-1/2 border-t border-gray-300 pt-2">
                <span className="block text-[11px] font-bold text-gray-800 uppercase">{profissionalNome || "Profissional Responsável"}</span>
                <span className="text-[9px] text-gray-400 uppercase">{profissionalCrp}</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}