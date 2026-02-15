import SignatureCanvas from 'react-signature-canvas';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  LogOut, Calendar as CalendarIcon, Plus, X, Trash2, 
  FileText, BarChart3, Shield, Clock, Users, Filter, 
  CheckCircle, RefreshCw, Wallet, Receipt, Calculator, Scale, MessageCircle, Send
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { usePerfil } from "@/hooks/usePerfil";

import { jsPDF } from "jspdf";
import "jspdf-autotable";
import QRCode from 'qrcode'; 

import 'react-big-calendar/lib/css/react-big-calendar.css';
import logoSer2 from "@/assets/ser2.png";

// --- CONFIGURAÇÃO DE TRADUÇÃO ---
const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ 
  format, 
  parse, 
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }), 
  getDay, 
  locales 
});

const mensagensPortugues = {
  allDay: 'Dia Inteiro',
  previous: 'Anterior',
  next: 'Próximo',
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Nenhum agendamento neste período.',
  showMore: (total: number) => `+ ver mais (${total})`
};

const mapearStatusParaBanco = (statusVisual: string) => {
  const s = statusVisual.toLowerCase();
  if (s.includes('presen') || s.includes('atendido')) return 'Presenca';
  if (s.includes('falta')) return 'Falta';
  return 'Agendado';
};

const EventoCustomizado = ({ event }: any) => (
  <div className="h-full w-full flex flex-col items-center justify-center text-center p-1 overflow-hidden">
    <span className="text-white font-bold text-[13px] uppercase leading-tight truncate w-full px-1">
      {event.title}
    </span>
    {(event.original?.status === 'Presenca' || event.original?.status === 'Presença') && <CheckCircle size={10} className="text-white mt-0.5" />}
  </div>
);

export function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin, isSecretaria } = usePerfil();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [equipe, setEquipe] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAgendamentoOpen, setIsAgendamentoOpen] = useState(false);
  const [isConfirmacaoAmanhaOpen, setIsConfirmacaoAmanhaOpen] = useState(false);
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState<number | null>(null);
  const [filtroProfissional, setFiltroProfissional] = useState<string>("geral");
  const [buscaPaciente, setBuscaPaciente] = useState("");
  const [pacientesSugeridos, setPacientesSugeridos] = useState<any[]>([]);
  
  const [form, setForm] = useState({ 
    profissional: '', paciente_nome: '', paciente_id: null as number | null,
    telefone: '', sala: '1', inicio: '', duracao: '40', status: 'Agendado',
    assinatura_url: null as string | null,
    valor_atendimento: "0.00",
    forma_pagamento: "Pix"
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserEmail(data.user.email ?? null);
    });
    fetchData();
  }, []);

  const souEuOAdmin = isAdmin || userEmail === 'romulochaves77@gmail.com';

  const fetchData = async () => {
    try {
      const { data: todosPerfis } = await supabase.from('perfis').select('*').order('nome');
      if (todosPerfis) {
        const listaNegra = ['renata', 'instituto', 'recepcao', 'secretaria', 'admin', 'recepção'];
        const filtrados = todosPerfis.filter(p => {
          const n = (p.nome || "").toLowerCase();
          const c = (p.cargo || "").toLowerCase();
          return !listaNegra.some(termo => n.includes(termo) || c.includes(termo));
        });
        setEquipe(filtrados);

        const { data: agendamentos, error } = await supabase.from('agendamentos').select('*');
        if (!error && agendamentos) {
          const eventosFormatados = agendamentos.map(evt => {
            const perfilEncontrado = todosPerfis.find(p => 
              p.nome?.trim().toLowerCase() === evt.profissional_nome?.trim().toLowerCase()
            );
            return {
              id: evt.id,
              title: `${evt.paciente_nome} (S${evt.sala_id})`,
              start: new Date(evt.data_inicio),
              end: new Date(evt.data_fim),
              color: perfilEncontrado?.cor || '#1e3a8a',
              original: evt
            };
          });
          setEvents(eventosFormatados);
        }
      }
    } catch (err) { toast.error("Erro ao carregar dados."); }
  };

  useEffect(() => {
    const pesquisar = async () => {
      if (buscaPaciente.length < 2) { setPacientesSugeridos([]); return; }
      const { data } = await supabase.from('pacientes').select('id, nome, telefone').ilike('nome', `%${buscaPaciente}%`).limit(5);
      setPacientesSugeridos(data || []);
    };
    pesquisar();
  }, [buscaPaciente]);

  const enviarWhatsApp = (nome: string, fone: string, prof: string, inicio: string) => {
    if (!fone) return toast.error("Paciente sem telefone.");
    const foneLimpo = fone.replace(/\D/g, '');
    const dataFormatada = format(new Date(inicio), "dd/MM/yyyy");
    const horaFormatada = format(new Date(inicio), "HH:mm");
    const mensagem = `Olá, ${nome}! Confirmamos sua consulta no *Instituto SerClin* com o(a) profissional ${prof} no dia *${dataFormatada}* às *${horaFormatada}*. Podemos confirmar sua presença?`;
    window.open(`https://wa.me/55${foneLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const gerarComprovante = async () => {
    setLoading(true);
    try {
      const { data: val, error } = await supabase.from('validacoes').insert([{
        paciente_nome: form.paciente_nome,
        profissional_nome: form.profissional
      }]).select('id').single();

      if (error) throw error;
      const urlValidacao = `https://institutoserclin.vercel.app/validar/${val.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(urlValidacao);

      const doc = new jsPDF();
      const dataAtual = format(new Date(), "dd/MM/yyyy");
      const horaAtendimento = format(new Date(form.inicio), "HH:mm");

      doc.addImage(logoSer2, 'PNG', 75, 10, 60, 40);
      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 58, 138);
      doc.text("ATESTADO DE COMPARECIMENTO", 105, 60, { align: "center" });
      doc.setDrawColor(200, 200, 200); doc.line(30, 65, 180, 65);

      doc.setFontSize(12); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
      const textoCorpo = `Declaramos para os devidos fins de comprovação que o(a) paciente ${form.paciente_nome.toUpperCase()} esteve presente no INSTITUTO SERCLIN para atendimento especializado no dia ${format(new Date(form.inicio), "dd/MM/yyyy")}. O atendimento teve início às ${horaAtendimento} sob a responsabilidade do(a) profissional ${form.profissional.toUpperCase()}.`;
      doc.text(textoCorpo, 20, 85, { maxWidth: 170, align: "justify", lineHeightFactor: 1.5 });

      if (form.assinatura_url) {
        doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("ASSINATURA DIGITAL DO PACIENTE:", 20, 135);
        doc.addImage(form.assinatura_url, 'PNG', 20, 140, 50, 20);
        doc.setDrawColor(0, 0, 0); doc.line(20, 160, 70, 160);
      }

      doc.setFontSize(7); doc.setTextColor(150, 150, 150);
      doc.text("Para validar a autenticidade deste documento, escaneie o código abaixo:", 105, 190, { align: "center" });
      doc.addImage(qrCodeDataUrl, 'PNG', 87, 195, 30, 30);
      doc.text(urlValidacao, 105, 230, { align: "center" });

      doc.setFontSize(8); doc.setTextColor(100, 100, 100);
      doc.text("INSTITUTO SERCLIN - GESTÃO INTEGRADA EM SAÚDE", 105, 270, { align: "center" });
      doc.text("CNPJ: 64.585.207/0001-58 | R. Sorocaba, 140 - Rio Branco, AC", 105, 275, { align: "center" });
      doc.text(`Documento autenticado digitalmente em ${dataAtual} às ${format(new Date(), "HH:mm")}`, 105, 280, { align: "center" });

      doc.save(`Atestado_${form.paciente_nome.replace(/\s+/g, '_')}.pdf`);
      toast.success("Atestado Gerado!");
    } catch (err) { toast.error("Erro ao gerar PDF."); } finally { setLoading(false); }
  };

  const handleExcluirAgendamento = async () => {
    if (!eventoSelecionadoId) return;
    if (!confirm("⚠️ Deseja realmente apagar este agendamento?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('agendamentos').delete().eq('id', eventoSelecionadoId);
      if (error) throw error;
      toast.success("Removido!");
      setIsAgendamentoOpen(false); fetchData();
    } catch (err) { toast.error("Erro."); } finally { setLoading(false); }
  };

  const handleSalvarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.profissional || !form.inicio) return toast.error("Preencha profissional.");
    setLoading(true);
    try {
      const dInicio = new Date(form.inicio);
      const dFim = addMinutes(dInicio, parseInt(form.duracao));
      let idDoPaciente = form.paciente_id;
      if (!idDoPaciente) {
        const { data: novoPac } = await supabase.from("pacientes").insert([{ nome: buscaPaciente, telefone: form.telefone, convenio: "Particular" }]).select('id').single();
        if (novoPac) idDoPaciente = novoPac.id;
      }
      let assinaturaBase64 = form.assinatura_url;
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
          assinaturaBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
      }
      const payload = {
        sala_id: parseInt(form.sala), profissional_nome: form.profissional, paciente_nome: buscaPaciente,
        paciente_id: idDoPaciente, paciente_telefone: form.telefone,
        data_inicio: dInicio.toISOString(), data_fim: dFim.toISOString(),
        status: mapearStatusParaBanco(form.status), assinatura_url: assinaturaBase64,
        valor_atendimento: parseFloat(form.valor_atendimento), forma_pagamento: form.forma_pagamento
      };
      const { error } = eventoSelecionadoId ? await supabase.from('agendamentos').update(payload).eq('id', eventoSelecionadoId) : await supabase.from('agendamentos').insert([payload]);
      if (error) throw error;
      setIsAgendamentoOpen(false); 
      fetchData(); 
      toast.success("Agenda salva!");
    } catch (err) { toast.error("Erro ao salvar."); } finally { setLoading(false); }
  };

  const agendamentosAmanha = events
    .filter(e => isSameDay(new Date(e.start), addDays(new Date(), 1)))
    .map(e => e.original);

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden text-left">
      <style>{`
        .rbc-agenda-view table.rbc-agenda-table tbody > tr > td { color: #1f2937 !important; font-weight: 800 !important; font-size: 14px !important; }
        .rbc-agenda-view { background-color: #ffffff; border-radius: 1.5rem; overflow: hidden; border: 1px solid #e5e7eb; }
        .rbc-agenda-date-cell, .rbc-agenda-time-cell { color: #1e3a8a !important; font-weight: 800 !important; }
        .rbc-toolbar button { color: #1e3a8a !important; font-weight: bold; }
        .rbc-toolbar button.rbc-active { background-color: #1e3a8a !important; color: white !important; }
        .rbc-event-content { font-size: 13px !important; }
      `}</style>

      <header className="bg-white border-b px-6 py-3 flex justify-between items-center h-20 shadow-sm z-20 gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <img src={logoSer2} className="w-12 h-12 object-contain" alt="SerClin" />
          <div className="hidden lg:block text-left">
            <h1 className="text-md font-black text-gray-800 uppercase leading-none">SerClin</h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Gestão Integrada</p>
          </div>
        </div>

        <div className="flex gap-1.5 items-center">
          {(souEuOAdmin || isSecretaria) && (
            <>
              <Button onClick={() => setIsConfirmacaoAmanhaOpen(true)} variant="ghost" className="text-emerald-600 font-black text-[10px] uppercase gap-2 bg-emerald-50 hover:bg-emerald-100 rounded-full px-4 h-9 mr-1 transition-all" title="Confirmar Amanhã">
                <Send size={14} /> Confirmar Amanhã
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/planos')} className="text-emerald-600" title="Financeiro e Planos"><Wallet size={20}/></Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/despesas')} className="text-red-500" title="Despesas"><Receipt size={20}/></Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/repasses')} className="text-blue-600" title="Repasses"><Calculator size={20}/></Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/fechamento')} className="text-indigo-600" title="Caixa"><Scale size={20}/></Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/relatorios')} className="text-orange-500" title="Relatórios"><BarChart3 size={20}/></Button>
          {(souEuOAdmin || isSecretaria) && <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/horarios')} className="text-green-600" title="Horários"><Clock size={20}/></Button>}
          {souEuOAdmin && <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/acessos')} className="text-purple-600" title="Controle de Acesso"><Shield size={20}/></Button>}
          <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/pacientes')} className="text-blue-600 mr-2" title="Pacientes"><Users size={20}/></Button>
          <Button onClick={() => { setEventoSelecionadoId(null); setBuscaPaciente(""); setForm({...form, paciente_id: null, status: 'Agendado', assinatura_url: null, inicio: format(new Date(), "yyyy-MM-dd'T'HH:mm")}); setIsAgendamentoOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-9 px-4 text-xs font-black shadow-lg" title="Novo Agendamento"><Plus size={16} className="mr-1" /> AGENDAR</Button>
          <Button variant="ghost" size="icon" onClick={() => { supabase.auth.signOut(); navigate('/login'); }} title="Sair"><LogOut size={18} /></Button>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-hidden text-left">
        <Card className="h-full border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
          <CardContent className="p-0 h-full">
            <Calendar 
              localizer={localizer} culture='pt-BR' messages={mensagensPortugues}
              events={filtroProfissional === "geral" ? events : events.filter(e => e.original?.profissional_nome === filtroProfissional)} 
              view={view} onView={setView} date={date} onNavigate={setDate} 
              views={['day', 'week', 'month', 'agenda']} 
              components={{ event: EventoCustomizado }} 
              eventPropGetter={(event: any) => ({ 
                style: { backgroundColor: event.color, color: 'white', border: 'none', borderRadius: '6px', opacity: (event.original?.status === 'Falta') ? 0.5 : 1 } 
              })} 
              onSelectEvent={(e) => { 
                const evt = e.original; 
                setEventoSelecionadoId(evt.id); setBuscaPaciente(evt.paciente_nome); 
                setForm({ ...form, profissional: evt.profissional_nome, paciente_nome: evt.paciente_nome, paciente_id: evt.paciente_id, telefone: evt.paciente_telefone || '', sala: evt.sala_id?.toString() || '1', inicio: format(new Date(evt.data_inicio), "yyyy-MM-dd'T'HH:mm"), status: evt.status === 'Presenca' ? 'Presença' : (evt.status || 'Agendado'), assinatura_url: evt.assinatura_url || null, valor_atendimento: evt.valor_atendimento?.toString() || "0.00", forma_pagamento: evt.forma_pagamento || "Pix"}); 
                setIsAgendamentoOpen(true); 
              }} 
            />
          </CardContent>
        </Card>
      </main>

      {/* MODAL DE CONFIRMAÇÃO DO PRÓXIMO DIA (AMPLIADO) */}
      {isConfirmacaoAmanhaOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[700px] animate-in zoom-in duration-200 border border-gray-100 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-white text-left">
              <div>
                <h3 className="font-black uppercase text-sm tracking-widest text-[#1e3a8a]">Confirmar Amanhã</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase">{format(addDays(new Date(), 1), "dd/MM/yyyy")}</p>
              </div>
              <button onClick={() => setIsConfirmacaoAmanhaOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
            </div>
            <div className="p-6 max-h-[500px] overflow-y-auto space-y-3 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {agendamentosAmanha.map((ag, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex flex-col text-left">
                      <span className="font-black text-[12px] uppercase text-gray-700">{ag.paciente_nome}</span>
                      <span className="text-[10px] font-bold text-blue-600 uppercase">{format(new Date(ag.data_inicio), "HH:mm")} - {ag.profissional_nome}</span>
                    </div>
                    <Button onClick={() => enviarWhatsApp(ag.paciente_nome, ag.paciente_telefone, ag.profissional_nome, ag.data_inicio)} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-11 w-11 p-0 shadow-md">
                      <MessageCircle size={20} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AGENDAMENTO (PRESERVADO) */}
      {isAgendamentoOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 backdrop-blur-sm overflow-y-auto" onClick={(e) => e.target === e.currentTarget && setIsAgendamentoOpen(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[440px] my-4 overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
            <div className="p-5 border-b flex justify-between items-center bg-white text-left">
              <h3 className="font-black uppercase text-[15px] tracking-widest text-[#1e3a8a]">{eventoSelecionadoId ? 'Editar' : 'Novo'} Agendamento</h3>
              <button onClick={() => setIsAgendamentoOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSalvarAgendamento} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-black text-gray-500 uppercase">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                    <SelectTrigger className="bg-blue-50 border-none font-bold text-blue-700 h-10 text-[14px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Agendado">Agendado</SelectItem><SelectItem value="Presença">Presença</SelectItem><SelectItem value="Falta">Falta</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-black text-gray-400 uppercase">Pagamento</label>
                  <Select value={form.forma_pagamento} onValueChange={(v) => setForm({...form, forma_pagamento: v})}>
                    <SelectTrigger className="bg-emerald-50 border-none font-bold text-emerald-700 h-10 text-[14px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Pix">Pix</SelectItem><SelectItem value="Dinheiro">Dinheiro</SelectItem><SelectItem value="Cartão">Cartão</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-black text-gray-400 uppercase">Valor (R$)</label>
                  <Input type="number" step="0.01" value={form.valor_atendimento} onChange={e => setForm({...form, valor_atendimento: e.target.value})} className="bg-gray-50 border-none h-11 font-bold text-sm text-gray-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-black text-gray-400 uppercase">Sala</label>
                  <Select value={form.sala} onValueChange={(v) => setForm({...form, sala: v})}>
                    <SelectTrigger className="bg-gray-50 border-none h-11 text-sm font-bold text-gray-700"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Sala 01</SelectItem><SelectItem value="2">Sala 02</SelectItem><SelectItem value="3">Sala 03</SelectItem><SelectItem value="4">Sala 04</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-black text-gray-400 uppercase">Paciente</label>
                <div className="relative">
                  <Input placeholder="Buscar..." className="bg-gray-50 border-none h-11 text-sm font-bold uppercase text-gray-700" value={buscaPaciente} onChange={(e) => setBuscaPaciente(e.target.value)} required />
                  {pacientesSugeridos.length > 0 && (
                    <div className="absolute z-[110] w-full bg-white border shadow-xl rounded-xl mt-1 overflow-hidden">
                      {pacientesSugeridos.map(p => (
                        <button key={p.id} type="button" className="w-full text-left p-3 hover:bg-blue-50 border-b flex flex-col" onClick={() => { setForm({ ...form, paciente_nome: p.nome, paciente_id: p.id, telefone: p.telefone || '' }); setBuscaPaciente(p.nome); setPacientesSugeridos([]); }}>
                          <span className="font-bold text-sm uppercase text-gray-700">{p.nome}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-black text-gray-400 uppercase">Profissional Clínico</label>
                <Select value={form.profissional} onValueChange={(v) => setForm({...form, profissional: v})} required>
                  <SelectTrigger className="bg-gray-50 border-none h-11 font-bold text-sm text-gray-700"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent className="z-[110]">{equipe.map(p => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-black text-gray-400 uppercase">WhatsApp</label>
                  <Input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} className="bg-gray-50 border-none h-11 text-gray-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-black text-gray-400 uppercase">Horário/Data</label>
                  <input type="datetime-local" required className="w-full bg-gray-50 rounded-md p-2.5 text-xs font-bold h-11 border-none outline-none text-gray-700" value={form.inicio} onChange={e => setForm({...form, inicio: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-1 pt-1">
                <label className="text-[12px] font-black text-gray-400 uppercase flex justify-between">Assinatura Digital {form.assinatura_url && <span className="text-emerald-500 font-black">OK</span>}</label>
                <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden bg-white min-h-[80px] flex items-center justify-center relative">
                  {form.assinatura_url ? (
                    <div className="group relative w-full h-full flex flex-col items-center justify-center bg-gray-50 p-2">
                      <img src={form.assinatura_url} alt="Assinatura" className="max-h-[60px] object-contain" />
                      <Button type="button" onClick={() => setForm({ ...form, assinatura_url: null })} className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold text-[9px] uppercase">Refazer</Button>
                    </div>
                  ) : (<SignatureCanvas ref={sigCanvas} penColor='black' canvasProps={{width: 400, height: 80, className: 'sigCanvas w-full h-full'}} />)}
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                {form.telefone && (
                  <Button type="button" onClick={() => enviarWhatsApp(form.paciente_nome, form.telefone, form.profissional, form.inicio)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black h-11 rounded-xl flex items-center justify-center gap-2 uppercase text-[10px] shadow-md">
                    <MessageCircle size={16} /> Confirmar WhatsApp
                  </Button>
                )}
                
                {eventoSelecionadoId && (
                  <Button type="button" onClick={gerarComprovante} className="w-full bg-[#1e3a8a] hover:bg-black text-white font-black h-11 rounded-xl flex items-center justify-center gap-2 uppercase text-[10px] shadow-md">
                    <FileText size={16} /> Gerar Atestado
                  </Button>
                )}
                
                <div className="flex gap-2">
                  {eventoSelecionadoId && (
                    <Button type="button" variant="outline" onClick={handleExcluirAgendamento} className="px-5 border-red-200 text-red-500 hover:bg-red-50 h-12 rounded-2xl">
                      <Trash2 size={20} />
                    </Button>
                  )}
                  <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-black text-white font-black h-12 rounded-2xl shadow-xl uppercase text-xs transition-all">
                    {loading ? <RefreshCw className="animate-spin" /> : 'Confirmar Agenda'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}