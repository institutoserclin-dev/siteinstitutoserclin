<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ShieldCheck, KeyRound, Download, MessageCircle, Mail, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoSer2 from '@/assets/ser2.png';

export const MAPA_CRP_PROFISSIONAIS: Record<string, string> = {
  'helenara': 'CRP - 24/02216',
  'helenara chaves': 'CRP - 24/02216',
  'helenara maria da silva mendes chaves': 'CRP - 24/02216',
  'dra helenara chaves': 'CRP - 24/02216',
};

export const obterCrpProfissional = (nome: string, crpBanco?: string): string => {
  if (crpBanco && crpBanco.trim() !== '' && crpBanco !== 'CRP') return crpBanco;
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

  return crpBanco || 'CRP 24/_____';
};

export function Assinar() {
  const { id } = useParams<{ id: string }>();
  const [contrato, setContrato] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [telefoneDestino, setTelefoneDestino] = useState('');
  const [emailDestino, setEmailDestino] = useState('');
  
  const [tokenDigitado, setTokenDigitado] = useState('');
  const [tokenEnviado, setTokenEnviado] = useState(false);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    carregarContrato();
  }, [id]);

  const carregarContrato = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from('contratos').select('*').eq('id', id).single();
    if (error || !data) {
      toast.error('Contrato não localizado.');
    } else {
      const crpFinal = obterCrpProfissional(data.profissional_nome, data.profissional_crp);
      setContrato({ ...data, profissional_crp: crpFinal });
      
      if (data.paciente_telefone) {
        setTelefoneDestino(aplicarMascaraTelefone(data.paciente_telefone));
      }
      if (data.paciente_email) {
        setEmailDestino(data.paciente_email);
      }
    }
    setLoading(false);
  };

  const aplicarMascaraTelefone = (val: string) => {
    if (!val) return '';
    const nums = val.replace(/\D/g, '');
    return nums
      .replace(/(\d{2})(\d)/, '($1) $2')       .replace(/(\d{5})(\d{4})$/, '$1-$2')
      .slice(0, 15);
  };

  const enviarTokenWhatsApp = async () => {
    if (!contrato) return;
    const foneLimpo = telefoneDestino.replace(/\D/g, '');
    if (foneLimpo.length < 10) {
      return toast.error('Informe um WhatsApp válido com DDD.');
    }

    setProcessando(true);
    try {
      const codigoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expira = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const payloadUpdate = {
        paciente_telefone: foneLimpo,
        token_paciente: codigoOtp,
        token_paciente_expira: expira
      };

      const { error } = await supabase.from('contratos').update(payloadUpdate).eq('id', contrato.id);
      if (error) throw error;

      setContrato((prev: any) => ({ ...prev, ...payloadUpdate }));

      const nomeFormatado = (contrato.paciente_nome || '').trim().toUpperCase();
      const mensagem = `Olá, *${nomeFormatado}*! O seu código de segurança para assinar o Contrato Terapêutico do Instituto SerClin é: *${codigoOtp}*. Válido por 15 minutos.`;
      window.open(`https://wa.me/55${foneLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');

      setTokenEnviado(true);
      toast.success('Código enviado para o WhatsApp!');
    } catch (e: any) {
      toast.error('Erro ao gerar código de segurança.');
    } finally {
      setProcessando(false);
    }
  };

  const enviarTokenEmail = async () => {
    if (!contrato) return;
    if (!emailDestino || !emailDestino.includes('@')) {
      return toast.error('Informe um E-mail válido cadastrado.');
    }

    setProcessando(true);
    try {
      const codigoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expira = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const payloadUpdate = {
        paciente_email: emailDestino,
        token_paciente: codigoOtp,
        token_paciente_expira: expira
      };

      const { error } = await supabase.from('contratos').update(payloadUpdate).eq('id', contrato.id);
      if (error) throw error;

      setContrato((prev: any) => ({ ...prev, ...payloadUpdate }));

      toast.success(`Código OTP enviado para o e-mail: ${emailDestino}`);
      setTokenEnviado(true);
    } catch (e: any) {
      toast.error('Erro ao gerar código para o e-mail.');
    } finally {
      setProcessando(false);
    }
  };

  const confirmarAssinatura = async () => {
    if (tokenDigitado.length !== 6) return toast.error('Digite o código de 6 dígitos.');
    setProcessando(true);

    try {
      const { data: dadosAtuais, error: errBusca } = await supabase
        .from('contratos')
        .select('*')
        .eq('id', contrato.id)
        .single();

      if (errBusca || !dadosAtuais) {
        setProcessando(false);
        return toast.error('Erro ao verificar contrato no servidor.');
      }

      const tokenEsperado = dadosAtuais.token_paciente;
      const expiraString = dadosAtuais.token_paciente_expira;
      const expirou = expiraString ? new Date() > new Date(expiraString) : true;

      if (!tokenEsperado || tokenDigitado.trim() !== tokenEsperado.trim() || expirou) {
        setProcessando(false);
        return toast.error('Código inválido ou expirado.');
      }

      let ipOrigem = 'Auditado';
      try {
        const resIp = await fetch('https://api.ipify.org?format=json');
        const dataIp = await resIp.json();
        ipOrigem = dataIp.ip;
      } catch (err) {
        console.warn('IP não identificado:', err);
      }

      const agora = new Date().toISOString();
      const updateData = {
        paciente_assinado: true,
        paciente_assinado_em: agora,
        paciente_ip: ipOrigem,
        token_paciente: null,
        status: 'Concluído'
      };

      const { error: errUpdate } = await supabase.from('contratos').update(updateData).eq('id', contrato.id);
      if (errUpdate) throw errUpdate;

      toast.success('Contrato assinado eletronicamente com sucesso!');
      await carregarContrato();
    } catch (e: any) {
      toast.error('Falha ao confirmar assinatura.');
    } finally {
      setProcessando(false);
    }
  };

  const baixarPdfOficial = () => {
    if (!contrato) return;
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margemEsquerda = 20;
      const larguraUtil = 170;
      let y = 14;

      try {
        doc.addImage(logoSer2, "PNG", margemEsquerda, y, 32, 22);
      } catch (e) {
        console.warn("Logo não carregada:", e);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.text("INSTITUTO SERCLIN", margemEsquerda + 36, y + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Clínica de Psicologia & Neuropsicologia Integrada", margemEsquerda + 36, y + 12.5);
      doc.text("Rio Branco - Acre | Atendimento Especializado", margemEsquerda + 36, y + 17.5);

      y += 28;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.6);
      doc.line(margemEsquerda, y, margemEsquerda + larguraUtil, y);

      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 58, 138);
      doc.text("CONTRATO TERAPÊUTICO / TERMO DE CIÊNCIA", 105, y, { align: "center" });

      y += 8;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margemEsquerda, y, larguraUtil, 15, 2, 2, "F");

      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text("PACIENTE:", margemEsquerda + 4, y + 6);
      doc.setFont("helvetica", "normal");
      doc.text((contrato.paciente_nome || "").toUpperCase(), margemEsquerda + 28, y + 6);

      doc.setFont("helvetica", "bold");
      doc.text("CPF:", margemEsquerda + 4, y + 11.5);
      doc.setFont("helvetica", "normal");
      doc.text(contrato.paciente_cpf || "Não informado", margemEsquerda + 15, y + 11.5);

      y += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text("Declaro estar ciente e de acordo com as condições recíprocas para realização da Avaliação Neuropsicológica no Instituto SerClin:", margemEsquerda, y, { maxWidth: larguraUtil, align: "justify" });

      y += 8;
      const clausulas = [
        {
          titulo: "• Valor e Pagamento:",
          texto: `R$ ${(contrato.valor || 1300).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} à vista ou via Pix. No cartão de crédito, acrescido da taxa da máquina em até 12x.`
        },
        {
          titulo: "• Duração e Entrega:",
          texto: "Aproximadamente 6 a 8 sessões de ~40 minutos (1ª anamnese, sessões seguintes testes e última devolutiva). Laudo entregue no prazo de 20 a 30 dias úteis após a finalização dos testes."
        },
        {
          titulo: "• Pontualidade e Compensação de Atrasos (Bilateral):",
          texto: "Os atendimentos ocorrem por hora marcada. O atraso do paciente não será compensado ao final para não prejudicar atendimentos subsequentes. Em caso de atraso decorrente do profissional/clínica, o tempo excedente será integralmente compensado ao final da mesma sessão ou reposto posteriormente."
        },
        {
          titulo: "• Remarcações e Manutenção da Agenda:",
          texto: "O paciente manterá o mesmo horário fixo até a conclusão. Em caso de remarcação por parte da clínica por imprevistos, o paciente tem prioridade e garantia de cumprimento de todas as sessões previstas."
        },
        {
          titulo: "• Cláusula de Cancelamento e Rescisão:",
          texto: "O PACIENTE poderá rescindir este contrato a qualquer momento, mediante aviso prévio por escrito.\n" +
                 "Parágrafo Primeiro: Em desistência anterior ao início da 1ª sessão de avaliação, haverá a retenção de 10% do valor total a título de taxas administrativas e reserva de agenda.\n" +
                 "Parágrafo Segundo: Em desistência após o início das sessões, o PACIENTE pagará o valor proporcional exato das sessões já realizadas (Valor Total ÷ Nº Total de Sessões).\n" +
                 "Parágrafo Terceiro: Sobre o saldo financeiro das sessões contratadas e não realizadas, incidirá multa rescisória de 15%, sendo o valor restante integralmente reembolsado em até 15 dias úteis via Pix."
        }
      ];

      clausulas.forEach(c => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(30, 58, 138);
        doc.text(c.titulo, margemEsquerda, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        const l = doc.splitTextToSize(c.texto, larguraUtil);
        doc.text(l, margemEsquerda + 2, y);
        y += (l.length * 4.5) + 3.5;
      });

      y += 2;
      const hoje = format(new Date(), "'Rio Branco - AC,' dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(hoje, 105, y, { align: "center" });

      y += 8;
      const largBox = 80;
      const posX1 = margemEsquerda + 2;
      const posX2 = margemEsquerda + larguraUtil - largBox - 2;

      if (contrato.paciente_assinado) {
        doc.setDrawColor(202, 138, 4);
        doc.setFillColor(254, 252, 232);
        doc.roundedRect(posX1, y, largBox, 32, 2.5, 2.5, "FD");

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(133, 77, 14);
        doc.text("ASSINATURA DO(A) PACIENTE/RESPONSÁVEL", posX1 + (largBox / 2), y + 5.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(74, 54, 20);
        doc.text((contrato.paciente_nome || "").toUpperCase(), posX1 + (largBox / 2), y + 10, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(180, 83, 9);
        doc.text("ASSINADO ELETRONICAMENTE", posX1 + (largBox / 2), y + 16, { align: "center" });
        doc.text("(AUTENTICAÇÃO VIA TOKEN OTP)", posX1 + (largBox / 2), y + 20, { align: "center" });

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(113, 63, 18);
        const dataAssinatura = contrato.paciente_assinado_em 
          ? format(new Date(contrato.paciente_assinado_em), 'dd/MM/yyyy HH:mm') 
          : format(new Date(), 'dd/MM/yyyy HH:mm');
        doc.text(`Data: ${dataAssinatura}`, posX1 + (largBox / 2), y + 24.5, { align: "center" });
        doc.text(`IP: ${contrato.paciente_ip || 'Auditado'}`, posX1 + (largBox / 2), y + 28.5, { align: "center" });

        const crpExibicao = obterCrpProfissional(contrato.profissional_nome, contrato.profissional_crp);

        doc.setDrawColor(30, 58, 138);
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(posX2, y, largBox, 32, 2.5, 2.5, "FD");

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("PROFISSIONAL RESPONSÁVEL", posX2 + (largBox / 2), y + 5.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(224, 231, 255);
        doc.text((contrato.profissional_nome || "").toUpperCase(), posX2 + (largBox / 2), y + 11.5, { align: "center" });
        doc.text(crpExibicao, posX2 + (largBox / 2), y + 16, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(191, 219, 254);
        doc.text("EMISSÃO ELETRÔNICA OFICIAL", posX2 + (largBox / 2), y + 23, { align: "center" });
        doc.setFontSize(6);
        doc.text("INSTITUTO SERCLIN", posX2 + (largBox / 2), y + 27, { align: "center" });

      } else {
        const largLinha = 80;
        const pX1 = margemEsquerda + 2;
        const pX2 = margemEsquerda + larguraUtil - largLinha - 2;

        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.4);
        doc.line(pX1, y + 12, pX1 + largLinha, y + 12);

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("ASSINATURA DO(A) PACIENTE/RESPONSÁVEL", pX1 + (largLinha / 2), y + 16.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text((contrato.paciente_nome || "").toUpperCase(), pX1 + (largLinha / 2), y + 21, { align: "center" });

        doc.line(pX2, y + 12, pX2 + largLinha, y + 12);

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("PROFISSIONAL RESPONSÁVEL", pX2 + (largLinha / 2), y + 16.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text((contrato.profissional_nome || "").toUpperCase(), pX2 + (largLinha / 2), y + 21, { align: "center" });
        doc.text(contrato.profissional_crp || "CRP", pX2 + (largLinha / 2), y + 25.5, { align: "center" });
      }

      doc.save(`Contrato_${contrato.paciente_nome.replace(/\s+/g, '_')}.pdf`);
      toast.success("PDF do Contrato baixado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar documento.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xs uppercase font-bold text-gray-400">
        Carregando Contrato SerClin...
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 text-center max-w-md rounded-3xl">
          <p className="font-bold text-red-500">Contrato não encontrado ou cancelado.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-[580px] bg-white rounded-[2.5rem] shadow-xl p-6 md:p-8 space-y-5 text-left border-none">
        
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 border-b pb-4">
          <img src={logoSer2} className="w-14 h-14 object-contain" alt="SerClin" />
          <div>
            <h1 className="text-lg font-black text-[#1e3a8a] uppercase leading-tight">Assinatura do Paciente</h1>
            <p className="text-[11px] text-gray-500 font-bold uppercase">Instituto SerClin • Contrato Terapêutico</p>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
          <p className="text-gray-700"><strong>Paciente:</strong> {contrato.paciente_nome}</p>
          <p className="text-gray-700"><strong>CPF:</strong> {contrato.paciente_cpf || 'Não informado'}</p>
          <p className="text-gray-700">
            <strong>Profissional:</strong> {contrato.profissional_nome} ({obterCrpProfissional(contrato.profissional_nome, contrato.profissional_crp)})
          </p>
          <p className="text-gray-700"><strong>Valor Global:</strong> R$ {(contrato.valor || 1300).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Condições e Cláusula de Rescisão */}
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-950 max-h-[35vh] overflow-y-auto custom-scrollbar">
          <p className="font-black text-[#854d0e] uppercase tracking-wide flex items-center gap-1.5 text-sm">
            <ShieldAlert size={16} className="text-amber-600" /> Condições Gerais & Rescisão Bilateral
          </p>
          <p className="leading-relaxed">• <strong>Agendamento & Atrasos:</strong> Atendimentos com hora marcada mantendo o mesmo horário fixo. O atraso do paciente não será compensado ao fim da sessão. Em caso de atraso decorrente do profissional/clínica, o tempo excedente será integralmente compensado na mesma sessão ou reposto consensualmente em atendimento posterior.</p>
          <p className="leading-relaxed">• <strong>Remarcações pela Clínica:</strong> Em caso de imprevisto pela clínica, o paciente não perde o atendimento e é devidamente reagendado com prioridade.</p>
          <div className="pt-2 border-t border-amber-200/60 space-y-1.5">
            <p className="font-bold text-amber-900">Cláusula de Cancelamento e Rescisão:</p>
            <p className="leading-relaxed">O PACIENTE poderá rescindir este contrato a qualquer momento, mediante aviso prévio por escrito.</p>
            <p className="leading-relaxed"><strong>Parágrafo Primeiro:</strong> Em desistência anterior ao início da 1ª sessão, retenção de 10% do valor do contrato para custos administrativos e reserva de agenda.</p>
            <p className="leading-relaxed"><strong>Parágrafo Segundo:</strong> Em desistência após o início, o PACIENTE pagará o valor proporcional exato das sessões já realizadas (Valor Total ÷ Nº Total de Sessões).</p>
            <p className="leading-relaxed"><strong>Parágrafo Terceiro:</strong> Sobre o saldo financeiro das sessões não realizadas, incidirá multa rescisória de 15%, sendo o restante reembolsado em até 15 dias úteis via Pix.</p>
          </div>
        </div>

        {/* Estado da Assinatura */}
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${contrato.paciente_assinado ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <span className="font-bold uppercase tracking-wider">Status do Documento:</span>
          <span className="font-black">{contrato.paciente_assinado ? '✓ CONTRATO ASSINADO' : 'PENDENTE DE ASSINATURA'}</span>
        </div>

        {/* Fluxo de Assinatura */}
        {!contrato.paciente_assinado ? (
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5 p-4 bg-gray-50 rounded-2xl space-y-3">
              <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                <MessageCircle size={15} className="text-emerald-600" /> Enviar Código por WhatsApp
              </label>
              <div className="flex gap-2">
                <Input
                  value={telefoneDestino}
                  onChange={(e) => setTelefoneDestino(aplicarMascaraTelefone(e.target.value))}
                  placeholder="(68) 99999-9999"
                  className="bg-white border-gray-200 h-11 text-sm font-bold flex-1"
                />
                <Button
                  onClick={enviarTokenWhatsApp}
                  disabled={processando}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-4 rounded-xl text-xs uppercase"
                >
                  Enviar Zap
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 p-4 bg-gray-50 rounded-2xl space-y-3">
              <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                <Mail size={15} className="text-blue-600" /> Enviar Código por E-mail
              </label>
              <div className="flex gap-2">
                <Input
                  value={emailDestino}
                  onChange={(e) => setEmailDestino(e.target.value)}
                  placeholder="paciente@email.com"
                  className="bg-white border-gray-200 h-11 text-sm font-bold flex-1"
                />
                <Button
                  onClick={enviarTokenEmail}
                  disabled={processando}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-4 rounded-xl text-xs uppercase"
                >
                  Enviar E-mail
                </Button>
              </div>
            </div>

            {tokenEnviado && (
              <div className="space-y-3 pt-2 border-t">
                <label className="text-xs font-bold text-[#1e3a8a] uppercase block text-center">
                  Digite os 6 dígitos recebidos no WhatsApp ou E-mail:
                </label>
                <Input
                  maxLength={6}
                  value={tokenDigitado}
                  onChange={(e) => setTokenDigitado(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 849201"
                  className="text-center font-black tracking-[0.5em] text-xl h-14 bg-blue-50 border-none rounded-2xl text-[#1e3a8a]"
                />
                <Button
                  onClick={confirmarAssinatura}
                  disabled={processando}
                  className="w-full bg-[#1e3a8a] hover:bg-black text-white font-black h-12 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} /> Confirmar e Assinar Contrato
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 rounded-2xl text-center space-y-1">
            <p className="text-emerald-800 font-black text-sm uppercase">Assinatura Concluída com Sucesso!</p>
            <p className="text-emerald-600 text-xs font-bold">O documento possui plena validade jurídica digital.</p>
          </div>
        )}

        {/* Download do Documento */}
        <div className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={baixarPdfOficial}
            className="w-full h-11 rounded-xl text-xs font-black uppercase text-[#1e3a8a] border-blue-200 hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <Download size={16} /> Baixar PDF do Contrato
          </Button>
        </div>
      </Card>
    </div>
  );
=======
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ShieldCheck, KeyRound, Download, MessageCircle, Mail, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoSer2 from '@/assets/ser2.png';

export const MAPA_CRP_PROFISSIONAIS: Record<string, string> = {
  'helenara': 'CRP - 24/02216',
  'helenara chaves': 'CRP - 24/02216',
  'helenara maria da silva mendes chaves': 'CRP - 24/02216',
  'dra helenara chaves': 'CRP - 24/02216',
};

export const obterCrpProfissional = (nome: string, crpBanco?: string): string => {
  if (crpBanco && crpBanco.trim() !== '' && crpBanco !== 'CRP') return crpBanco;
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

  return crpBanco || 'CRP 24/_____';
};

export function Assinar() {
  const { id } = useParams<{ id: string }>();
  const [contrato, setContrato] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [telefoneDestino, setTelefoneDestino] = useState('');
  const [emailDestino, setEmailDestino] = useState('');
  
  const [tokenDigitado, setTokenDigitado] = useState('');
  const [tokenEnviado, setTokenEnviado] = useState(false);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    carregarContrato();
  }, [id]);

  const carregarContrato = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from('contratos').select('*').eq('id', id).single();
    if (error || !data) {
      toast.error('Contrato não localizado.');
    } else {
      const crpFinal = obterCrpProfissional(data.profissional_nome, data.profissional_crp);
      setContrato({ ...data, profissional_crp: crpFinal });
      
      if (data.paciente_telefone) {
        setTelefoneDestino(aplicarMascaraTelefone(data.paciente_telefone));
      }
      if (data.paciente_email) {
        setEmailDestino(data.paciente_email);
      }
    }
    setLoading(false);
  };

  const aplicarMascaraTelefone = (val: string) => {
    if (!val) return '';
    const nums = val.replace(/\D/g, '');
    return nums
      .replace(/(\d{2})(\d)/, '($1) $2')       .replace(/(\d{5})(\d{4})$/, '$1-$2')
      .slice(0, 15);
  };

  const enviarTokenWhatsApp = async () => {
    if (!contrato) return;
    const foneLimpo = telefoneDestino.replace(/\D/g, '');
    if (foneLimpo.length < 10) {
      return toast.error('Informe um WhatsApp válido com DDD.');
    }

    setProcessando(true);
    try {
      const codigoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expira = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const payloadUpdate = {
        paciente_telefone: foneLimpo,
        token_paciente: codigoOtp,
        token_paciente_expira: expira
      };

      const { error } = await supabase.from('contratos').update(payloadUpdate).eq('id', contrato.id);
      if (error) throw error;

      setContrato((prev: any) => ({ ...prev, ...payloadUpdate }));

      const nomeFormatado = (contrato.paciente_nome || '').trim().toUpperCase();
      const mensagem = `Olá, *${nomeFormatado}*! O seu código de segurança para assinar o Contrato Terapêutico do Instituto SerClin é: *${codigoOtp}*. Válido por 15 minutos.`;
      window.open(`https://wa.me/55${foneLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');

      setTokenEnviado(true);
      toast.success('Código enviado para o WhatsApp!');
    } catch (e: any) {
      toast.error('Erro ao gerar código de segurança.');
    } finally {
      setProcessando(false);
    }
  };

  const enviarTokenEmail = async () => {
    if (!contrato) return;
    if (!emailDestino || !emailDestino.includes('@')) {
      return toast.error('Informe um E-mail válido cadastrado.');
    }

    setProcessando(true);
    try {
      const codigoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expira = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const payloadUpdate = {
        paciente_email: emailDestino,
        token_paciente: codigoOtp,
        token_paciente_expira: expira
      };

      const { error } = await supabase.from('contratos').update(payloadUpdate).eq('id', contrato.id);
      if (error) throw error;

      setContrato((prev: any) => ({ ...prev, ...payloadUpdate }));

      toast.success(`Código OTP enviado para o e-mail: ${emailDestino}`);
      setTokenEnviado(true);
    } catch (e: any) {
      toast.error('Erro ao gerar código para o e-mail.');
    } finally {
      setProcessando(false);
    }
  };

  const confirmarAssinatura = async () => {
    if (tokenDigitado.length !== 6) return toast.error('Digite o código de 6 dígitos.');
    setProcessando(true);

    try {
      const { data: dadosAtuais, error: errBusca } = await supabase
        .from('contratos')
        .select('*')
        .eq('id', contrato.id)
        .single();

      if (errBusca || !dadosAtuais) {
        setProcessando(false);
        return toast.error('Erro ao verificar contrato no servidor.');
      }

      const tokenEsperado = dadosAtuais.token_paciente;
      const expiraString = dadosAtuais.token_paciente_expira;
      const expirou = expiraString ? new Date() > new Date(expiraString) : true;

      if (!tokenEsperado || tokenDigitado.trim() !== tokenEsperado.trim() || expirou) {
        setProcessando(false);
        return toast.error('Código inválido ou expirado.');
      }

      let ipOrigem = 'Auditado';
      try {
        const resIp = await fetch('https://api.ipify.org?format=json');
        const dataIp = await resIp.json();
        ipOrigem = dataIp.ip;
      } catch (err) {
        console.warn('IP não identificado:', err);
      }

      const agora = new Date().toISOString();
      const updateData = {
        paciente_assinado: true,
        paciente_assinado_em: agora,
        paciente_ip: ipOrigem,
        token_paciente: null,
        status: 'Concluído'
      };

      const { error: errUpdate } = await supabase.from('contratos').update(updateData).eq('id', contrato.id);
      if (errUpdate) throw errUpdate;

      toast.success('Contrato assinado eletronicamente com sucesso!');
      await carregarContrato();
    } catch (e: any) {
      toast.error('Falha ao confirmar assinatura.');
    } finally {
      setProcessando(false);
    }
  };

  const baixarPdfOficial = () => {
    if (!contrato) return;
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margemEsquerda = 20;
      const larguraUtil = 170;
      let y = 14;

      try {
        doc.addImage(logoSer2, "PNG", margemEsquerda, y, 32, 22);
      } catch (e) {
        console.warn("Logo não carregada:", e);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.text("INSTITUTO SERCLIN", margemEsquerda + 36, y + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Clínica de Psicologia & Neuropsicologia Integrada", margemEsquerda + 36, y + 12.5);
      doc.text("Rio Branco - Acre | Atendimento Especializado", margemEsquerda + 36, y + 17.5);

      y += 28;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.6);
      doc.line(margemEsquerda, y, margemEsquerda + larguraUtil, y);

      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 58, 138);
      doc.text("CONTRATO TERAPÊUTICO / TERMO DE CIÊNCIA", 105, y, { align: "center" });

      y += 8;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margemEsquerda, y, larguraUtil, 15, 2, 2, "F");

      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text("PACIENTE:", margemEsquerda + 4, y + 6);
      doc.setFont("helvetica", "normal");
      doc.text((contrato.paciente_nome || "").toUpperCase(), margemEsquerda + 28, y + 6);

      doc.setFont("helvetica", "bold");
      doc.text("CPF:", margemEsquerda + 4, y + 11.5);
      doc.setFont("helvetica", "normal");
      doc.text(contrato.paciente_cpf || "Não informado", margemEsquerda + 15, y + 11.5);

      y += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text("Declaro estar ciente e de acordo com as condições recíprocas para realização da Avaliação Neuropsicológica no Instituto SerClin:", margemEsquerda, y, { maxWidth: larguraUtil, align: "justify" });

      y += 8;
      const clausulas = [
        {
          titulo: "• Valor e Pagamento:",
          texto: `R$ ${(contrato.valor || 1300).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} à vista ou via Pix. No cartão de crédito, acrescido da taxa da máquina em até 12x.`
        },
        {
          titulo: "• Duração e Entrega:",
          texto: "Aproximadamente 6 a 8 sessões de ~40 minutos (1ª anamnese, sessões seguintes testes e última devolutiva). Laudo entregue no prazo de 20 a 30 dias úteis após a finalização dos testes."
        },
        {
          titulo: "• Pontualidade e Compensação de Atrasos (Bilateral):",
          texto: "Os atendimentos ocorrem por hora marcada. O atraso do paciente não será compensado ao final para não prejudicar atendimentos subsequentes. Em caso de atraso decorrente do profissional/clínica, o tempo excedente será integralmente compensado ao final da mesma sessão ou reposto posteriormente."
        },
        {
          titulo: "• Remarcações e Manutenção da Agenda:",
          texto: "O paciente manterá o mesmo horário fixo até a conclusão. Em caso de remarcação por parte da clínica por imprevistos, o paciente tem prioridade e garantia de cumprimento de todas as sessões previstas."
        },
        {
          titulo: "• Cláusula de Cancelamento e Rescisão:",
          texto: "O PACIENTE poderá rescindir este contrato a qualquer momento, mediante aviso prévio por escrito.\n" +
                 "Parágrafo Primeiro: Em desistência anterior ao início da 1ª sessão de avaliação, haverá a retenção de 10% do valor total a título de taxas administrativas e reserva de agenda.\n" +
                 "Parágrafo Segundo: Em desistência após o início das sessões, o PACIENTE pagará o valor proporcional exato das sessões já realizadas (Valor Total ÷ Nº Total de Sessões).\n" +
                 "Parágrafo Terceiro: Sobre o saldo financeiro das sessões contratadas e não realizadas, incidirá multa rescisória de 15%, sendo o valor restante integralmente reembolsado em até 15 dias úteis via Pix."
        }
      ];

      clausulas.forEach(c => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(30, 58, 138);
        doc.text(c.titulo, margemEsquerda, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        const l = doc.splitTextToSize(c.texto, larguraUtil);
        doc.text(l, margemEsquerda + 2, y);
        y += (l.length * 4.5) + 3.5;
      });

      y += 2;
      const hoje = format(new Date(), "'Rio Branco - AC,' dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(hoje, 105, y, { align: "center" });

      y += 8;
      const largBox = 80;
      const posX1 = margemEsquerda + 2;
      const posX2 = margemEsquerda + larguraUtil - largBox - 2;

      if (contrato.paciente_assinado) {
        doc.setDrawColor(202, 138, 4);
        doc.setFillColor(254, 252, 232);
        doc.roundedRect(posX1, y, largBox, 32, 2.5, 2.5, "FD");

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(133, 77, 14);
        doc.text("ASSINATURA DO(A) PACIENTE/RESPONSÁVEL", posX1 + (largBox / 2), y + 5.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(74, 54, 20);
        doc.text((contrato.paciente_nome || "").toUpperCase(), posX1 + (largBox / 2), y + 10, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(180, 83, 9);
        doc.text("ASSINADO ELETRONICAMENTE", posX1 + (largBox / 2), y + 16, { align: "center" });
        doc.text("(AUTENTICAÇÃO VIA TOKEN OTP)", posX1 + (largBox / 2), y + 20, { align: "center" });

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(113, 63, 18);
        const dataAssinatura = contrato.paciente_assinado_em 
          ? format(new Date(contrato.paciente_assinado_em), 'dd/MM/yyyy HH:mm') 
          : format(new Date(), 'dd/MM/yyyy HH:mm');
        doc.text(`Data: ${dataAssinatura}`, posX1 + (largBox / 2), y + 24.5, { align: "center" });
        doc.text(`IP: ${contrato.paciente_ip || 'Auditado'}`, posX1 + (largBox / 2), y + 28.5, { align: "center" });

        const crpExibicao = obterCrpProfissional(contrato.profissional_nome, contrato.profissional_crp);

        doc.setDrawColor(30, 58, 138);
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(posX2, y, largBox, 32, 2.5, 2.5, "FD");

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("PROFISSIONAL RESPONSÁVEL", posX2 + (largBox / 2), y + 5.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(224, 231, 255);
        doc.text((contrato.profissional_nome || "").toUpperCase(), posX2 + (largBox / 2), y + 11.5, { align: "center" });
        doc.text(crpExibicao, posX2 + (largBox / 2), y + 16, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(191, 219, 254);
        doc.text("EMISSÃO ELETRÔNICA OFICIAL", posX2 + (largBox / 2), y + 23, { align: "center" });
        doc.setFontSize(6);
        doc.text("INSTITUTO SERCLIN", posX2 + (largBox / 2), y + 27, { align: "center" });

      } else {
        const largLinha = 80;
        const pX1 = margemEsquerda + 2;
        const pX2 = margemEsquerda + larguraUtil - largLinha - 2;

        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.4);
        doc.line(pX1, y + 12, pX1 + largLinha, y + 12);

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("ASSINATURA DO(A) PACIENTE/RESPONSÁVEL", pX1 + (largLinha / 2), y + 16.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text((contrato.paciente_nome || "").toUpperCase(), pX1 + (largLinha / 2), y + 21, { align: "center" });

        doc.line(pX2, y + 12, pX2 + largLinha, y + 12);

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("PROFISSIONAL RESPONSÁVEL", pX2 + (largLinha / 2), y + 16.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text((contrato.profissional_nome || "").toUpperCase(), pX2 + (largLinha / 2), y + 21, { align: "center" });
        doc.text(contrato.profissional_crp || "CRP", pX2 + (largLinha / 2), y + 25.5, { align: "center" });
      }

      doc.save(`Contrato_${contrato.paciente_nome.replace(/\s+/g, '_')}.pdf`);
      toast.success("PDF do Contrato baixado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar documento.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xs uppercase font-bold text-gray-400">
        Carregando Contrato SerClin...
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 text-center max-w-md rounded-3xl">
          <p className="font-bold text-red-500">Contrato não encontrado ou cancelado.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-[580px] bg-white rounded-[2.5rem] shadow-xl p-6 md:p-8 space-y-5 text-left border-none">
        
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 border-b pb-4">
          <img src={logoSer2} className="w-14 h-14 object-contain" alt="SerClin" />
          <div>
            <h1 className="text-lg font-black text-[#1e3a8a] uppercase leading-tight">Assinatura do Paciente</h1>
            <p className="text-[11px] text-gray-500 font-bold uppercase">Instituto SerClin • Contrato Terapêutico</p>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
          <p className="text-gray-700"><strong>Paciente:</strong> {contrato.paciente_nome}</p>
          <p className="text-gray-700"><strong>CPF:</strong> {contrato.paciente_cpf || 'Não informado'}</p>
          <p className="text-gray-700">
            <strong>Profissional:</strong> {contrato.profissional_nome} ({obterCrpProfissional(contrato.profissional_nome, contrato.profissional_crp)})
          </p>
          <p className="text-gray-700"><strong>Valor Global:</strong> R$ {(contrato.valor || 1300).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Condições e Cláusula de Rescisão */}
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-950 max-h-[35vh] overflow-y-auto custom-scrollbar">
          <p className="font-black text-[#854d0e] uppercase tracking-wide flex items-center gap-1.5 text-sm">
            <ShieldAlert size={16} className="text-amber-600" /> Condições Gerais & Rescisão Bilateral
          </p>
          <p className="leading-relaxed">• <strong>Agendamento & Atrasos:</strong> Atendimentos com hora marcada mantendo o mesmo horário fixo. O atraso do paciente não será compensado ao fim da sessão. Em caso de atraso decorrente do profissional/clínica, o tempo excedente será integralmente compensado na mesma sessão ou reposto consensualmente em atendimento posterior.</p>
          <p className="leading-relaxed">• <strong>Remarcações pela Clínica:</strong> Em caso de imprevisto pela clínica, o paciente não perde o atendimento e é devidamente reagendado com prioridade.</p>
          <div className="pt-2 border-t border-amber-200/60 space-y-1.5">
            <p className="font-bold text-amber-900">Cláusula de Cancelamento e Rescisão:</p>
            <p className="leading-relaxed">O PACIENTE poderá rescindir este contrato a qualquer momento, mediante aviso prévio por escrito.</p>
            <p className="leading-relaxed"><strong>Parágrafo Primeiro:</strong> Em desistência anterior ao início da 1ª sessão, retenção de 10% do valor do contrato para custos administrativos e reserva de agenda.</p>
            <p className="leading-relaxed"><strong>Parágrafo Segundo:</strong> Em desistência após o início, o PACIENTE pagará o valor proporcional exato das sessões já realizadas (Valor Total ÷ Nº Total de Sessões).</p>
            <p className="leading-relaxed"><strong>Parágrafo Terceiro:</strong> Sobre o saldo financeiro das sessões não realizadas, incidirá multa rescisória de 15%, sendo o restante reembolsado em até 15 dias úteis via Pix.</p>
          </div>
        </div>

        {/* Estado da Assinatura */}
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${contrato.paciente_assinado ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <span className="font-bold uppercase tracking-wider">Status do Documento:</span>
          <span className="font-black">{contrato.paciente_assinado ? '✓ CONTRATO ASSINADO' : 'PENDENTE DE ASSINATURA'}</span>
        </div>

        {/* Fluxo de Assinatura */}
        {!contrato.paciente_assinado ? (
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5 p-4 bg-gray-50 rounded-2xl space-y-3">
              <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                <MessageCircle size={15} className="text-emerald-600" /> Enviar Código por WhatsApp
              </label>
              <div className="flex gap-2">
                <Input
                  value={telefoneDestino}
                  onChange={(e) => setTelefoneDestino(aplicarMascaraTelefone(e.target.value))}
                  placeholder="(68) 99999-9999"
                  className="bg-white border-gray-200 h-11 text-sm font-bold flex-1"
                />
                <Button
                  onClick={enviarTokenWhatsApp}
                  disabled={processando}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-4 rounded-xl text-xs uppercase"
                >
                  Enviar Zap
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 p-4 bg-gray-50 rounded-2xl space-y-3">
              <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                <Mail size={15} className="text-blue-600" /> Enviar Código por E-mail
              </label>
              <div className="flex gap-2">
                <Input
                  value={emailDestino}
                  onChange={(e) => setEmailDestino(e.target.value)}
                  placeholder="paciente@email.com"
                  className="bg-white border-gray-200 h-11 text-sm font-bold flex-1"
                />
                <Button
                  onClick={enviarTokenEmail}
                  disabled={processando}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-4 rounded-xl text-xs uppercase"
                >
                  Enviar E-mail
                </Button>
              </div>
            </div>

            {tokenEnviado && (
              <div className="space-y-3 pt-2 border-t">
                <label className="text-xs font-bold text-[#1e3a8a] uppercase block text-center">
                  Digite os 6 dígitos recebidos no WhatsApp ou E-mail:
                </label>
                <Input
                  maxLength={6}
                  value={tokenDigitado}
                  onChange={(e) => setTokenDigitado(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 849201"
                  className="text-center font-black tracking-[0.5em] text-xl h-14 bg-blue-50 border-none rounded-2xl text-[#1e3a8a]"
                />
                <Button
                  onClick={confirmarAssinatura}
                  disabled={processando}
                  className="w-full bg-[#1e3a8a] hover:bg-black text-white font-black h-12 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} /> Confirmar e Assinar Contrato
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 rounded-2xl text-center space-y-1">
            <p className="text-emerald-800 font-black text-sm uppercase">Assinatura Concluída com Sucesso!</p>
            <p className="text-emerald-600 text-xs font-bold">O documento possui plena validade jurídica digital.</p>
          </div>
        )}

        {/* Download do Documento */}
        <div className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={baixarPdfOficial}
            className="w-full h-11 rounded-xl text-xs font-black uppercase text-[#1e3a8a] border-blue-200 hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <Download size={16} /> Baixar PDF do Contrato
          </Button>
        </div>
      </Card>
    </div>
  );
>>>>>>> 1e02def (feat: ajuste de fuso horario local, estilizacao de eventos lado a lado na agenda e correcao de contratos)
}