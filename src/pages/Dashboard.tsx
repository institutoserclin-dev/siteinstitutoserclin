import SignatureCanvas from 'react-signature-canvas';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  LogOut, Calendar as CalendarIcon, Plus, X, Trash2, 
  FileText, BarChart3, Shield, Clock, Users, Filter, 
  MessageCircle, CheckCircle, ExternalLink, MessageSquare 
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { usePerfil } from "@/hooks/usePerfil";

// Bibliotecas para PDF
import { jsPDF } from "jspdf";
import "jspdf-autotable";

import 'react-big-calendar/lib/css/react-big-calendar.css';
import logoSerClin from "@/assets/logo-serclin.png";

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const mapearStatusParaBanco = (statusVisual: string) => {
  const s = statusVisual.toLowerCase();
  if (s.includes('presen') || s.includes('atendido')) return 'Presenca';
  if (s.includes('falta')) return 'Falta';
  return 'Agendado';
};

const EventoCustomizado = ({ event }: any) => (
  <div className="h-full w-full flex flex-col items-center justify-center text-center p-1 overflow-hidden">
    <span className="text-white font-bold text-[10px] uppercase leading-tight truncate w-full">
      {event.title}
    </span>
    {(event.original?.status === 'Presenca' || event.original?.status === 'Presença') && <CheckCircle size={10} className="text-white mt-0.5" />}
  </div>
);

export function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin, isSecretaria } = usePerfil();

  // REFERÊNCIA DO CANVAS
  const sigCanvas = useRef<SignatureCanvas>(null);

  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [equipe, setEquipe] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAgendamentoOpen, setIsAgendamentoOpen] = useState(false);
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState<number | null>(null);
  const [filtroProfissional, setFiltroProfissional] = useState<string>("geral");
  const [buscaPaciente, setBuscaPaciente] = useState("");
  const [pacientesSugeridos, setPacientesSugeridos] = useState<any[]>([]);
  
  const [form, setForm] = useState({ 
    profissional: '', paciente_nome: '', paciente_id: null as number | null,
    telefone: '', sala: '1', inicio: '', duracao: '50', status: 'Agendado',
    assinatura_url: null as string | null
  });

  const fetchData = async () => {
    try {
      const { data: profs } = await supabase.from('profissionais').select('*');
      setEquipe(profs || []);
      const { data: agendamentos, error } = await supabase.from('agendamentos').select('*');
      if (!error && agendamentos) {
        const eventosFormatados = agendamentos.map(evt => ({
          id: evt.id,
          title: `${evt.paciente_nome} (S${evt.sala_id})`,
          start: new Date(evt.data_inicio),
          end: new Date(evt.data_fim),
          color: (profs || []).find(p => p.nome === evt.profissional_nome)?.cor || '#3b82f6',
          original: evt
        }));
        setEvents(eventosFormatados);
      }
    } catch (err) { toast.error("Erro ao carregar agenda."); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const pesquisar = async () => {
      if (buscaPaciente.length < 2) { setPacientesSugeridos([]); return; }
      const { data } = await supabase.from('pacientes').select('id, nome, telefone').ilike('nome', `%${buscaPaciente}%`).limit(5);
      setPacientesSugeridos(data || []);
    };
    pesquisar();
  }, [buscaPaciente]);

  // FUNÇÃO PARA GERAR ATESTADO EM PDF
  const gerarComprovante = () => {
    const doc = new jsPDF();
    const dataAtual = format(new Date(), "dd/MM/yyyy");
    const horaAtendimento = format(new Date(form.inicio), "HH:mm");

    // 1. Logo Centralizada no Topo
    // Dimensões: largura 50mm, altura proporcional
    doc.addImage(logoSerClin, 'PNG', 80, 15, 50, 25);

    // 2. Título do Documento
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235); // Azul
    doc.text("ATESTADO DE COMPARECIMENTO", 105, 55, { align: "center" });

    // Linha divisória fina
    doc.setDrawColor(200, 200, 200);
    doc.line(30, 62, 180, 62);

    // 3. Corpo do Texto Justificado com Espaçamento 1.5
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const textoCorpo = `Declaramos para os devidos fins de comprovação que o(a) paciente ${form.paciente_nome.toUpperCase()} esteve presente no INSTITUTO SERCLIN para atendimento especializado no dia ${format(new Date(form.inicio), "dd/MM/yyyy")}. O atendimento teve início às ${horaAtendimento} sob a responsabilidade do(a) profissional ${form.profissional.toUpperCase()}.`;

    // Configuração de Justificado e Espaçamento 1.5 (LineHeightFactor)
    // 210mm total - 20mm margem esquerda - 20mm margem direita = 170mm largura útil
    doc.text(textoCorpo, 20, 80, { 
      maxWidth: 170, 
      align: "justify",
      lineHeightFactor: 1.5 
    });

    // 4. Área da Assinatura
    if (form.assinatura_url) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("ASSINATURA DIGITAL DO PACIENTE:", 20, 130);
      doc.addImage(form.assinatura_url, 'PNG', 20, 135, 60, 25);
      doc.setDrawColor(0, 0, 0);
      doc.line(20, 160, 85, 160);
    }

    // 5. Rodapé Informativo
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("INSTITUTO SERCLIN - GESTÃO INTEGRADA EM SAÚDE", 105, 270, { align: "center" });
    doc.text("CNPJ: 64.585.207/0001-58 | R. Sorocaba, 140 - Rio Branco, AC", 105, 275, { align: "center" });
    doc.text(`Documento autenticado digitalmente em ${dataAtual} às ${format(new Date(), "HH:mm")}`, 105, 280, { align: "center" });

    doc.save(`Atestado_${form.paciente_nome.replace(/\s+/g, '_')}.pdf`);
    toast.success("Atestado gerado com sucesso!");
  };

  const handleSalvarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.profissional || !form.inicio) return toast.error("Preencha profissional e horário.");
    
    setLoading(true);
    try {
      const dInicio = new Date(form.inicio);
      const dFim = addMinutes(dInicio, parseInt(form.duracao));
      const salaId = parseInt(form.sala);

      const conflitoLocal = events.find(event => {
        if (eventoSelecionadoId && event.id === eventoSelecionadoId) return false;
        const overlap = dInicio < event.end && dFim > event.start;
        if (overlap) {
          if (event.original.profissional_nome === form.profissional) return "profissional";
          if (event.original.sala_id === salaId) return "sala";
        }
        return false;
      });

      if (conflitoLocal) {
        setLoading(false);
        return toast.error(
          conflitoLocal === "profissional" 
          ? `O(A) ${form.profissional} já tem agenda neste horário!` 
          : `A Sala ${salaId} já está ocupada neste horário!`
        );
      }

      let assinaturaBase64 = form.assinatura_url;
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
          assinaturaBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
      }

      const statusFinal = mapearStatusParaBanco(form.status);

      const payload = {
        sala_id: salaId,
        profissional_nome: form.profissional,
        paciente_nome: form.paciente_id ? form.paciente_nome : buscaPaciente,
        paciente_id: form.paciente_id,
        paciente_telefone: form.telefone,
        data_inicio: dInicio.toISOString(),
        data_fim: dFim.toISOString(),
        status: statusFinal,
        assinatura_url: assinaturaBase64
      };

      const { error } = eventoSelecionadoId 
        ? await supabase.from('agendamentos').update(payload).eq('id', eventoSelecionadoId)
        : await supabase.from('agendamentos').insert([payload]);

      if (error) throw error;

      setIsAgendamentoOpen(false);
      setBuscaPaciente("");
      setEventoSelecionadoId(null);
      await fetchData();
      toast.success("Agenda atualizada!");
    } catch (error: any) { 
      console.error(error);
      toast.error("Erro ao salvar agendamento.");
    } finally { setLoading(false); }
  };

  const enviarZap = () => {
    const tel = form.telefone.replace(/\D/g, '');
    if (!tel) return toast.error("Sem telefone.");
    const msg = `Olá, confirmamos seu horário no Instituto SerClin em ${format(new Date(form.inicio), "dd/MM 'às' HH:mm")}.`;
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden text-left">
      <header className="bg-white border-b px-6 py-3 flex justify-between items-center h-20 shadow-sm z-20 gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <img src={logoSerClin} className="w-12 h-12 object-contain" alt="SerClin" />
          <div className="hidden lg:block text-left">
            <h1 className="text-md font-bold text-gray-800 uppercase leading-none">SerClin</h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Gestão Integrada</p>
          </div>
        </div>

        <div className="flex-1 max-w-xs">
          <Select value={filtroProfissional} onValueChange={setFiltroProfissional}>
            <SelectTrigger className="bg-gray-50 border-none h-9 text-[10px] font-bold uppercase tracking-widest">
              <Filter size={14} className="mr-2 text-blue-600"/><SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Agenda Geral</SelectItem>
              {equipe.map(p => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-1.5 items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/relatorios')} className="text-orange-500 hover:bg-orange-50"><BarChart3 size={20}/></Button>
          {(isAdmin || isSecretaria) && <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/horarios')} className="text-green-600 hover:bg-green-50"><Clock size={20}/></Button>}
          {isAdmin && <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/acessos')} className="text-purple-600 hover:bg-purple-50"><Shield size={20}/></Button>}
          <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/pacientes')} className="text-blue-600 hover:bg-blue-50 mr-2"><Users size={20}/></Button>
          
          <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/lembretes')} className="relative text-emerald-600 hover:bg-emerald-50 mr-2" title="Lembretes de Amanhã">
            <MessageSquare size={20}/>
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </Button>

          <Button onClick={() => { setEventoSelecionadoId(null); setBuscaPaciente(""); setForm({...form, paciente_id: null, status: 'Agendado', assinatura_url: null, inicio: format(new Date(), "yyyy-MM-dd'T'HH:mm")}); setIsAgendamentoOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-9 px-4 text-xs font-bold"><Plus size={16} className="mr-1" /> AGENDAR</Button>
          <Button variant="ghost" size="icon" onClick={() => { supabase.auth.signOut(); navigate('/login'); }}><LogOut size={18} /></Button>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-hidden">
        <Card className="h-full border-none shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardContent className="p-0 h-full">
            <Calendar
              localizer={localizer} 
              events={filtroProfissional === "geral" ? events : events.filter(e => e.original?.profissional_nome === filtroProfissional)}
              view={view} onView={setView} date={date} onNavigate={setDate} 
              views={['day', 'week', 'month', 'agenda']} culture='pt-BR'
              messages={{ next: "Próx", previous: "Ant", today: "Hoje", month: "Mês", week: "Semana", day: "Dia", agenda: "Lista" }}
              components={{ event: EventoCustomizado }}
              eventPropGetter={(event: any) => ({ 
                style: { backgroundColor: event.color, border: 'none', borderRadius: '4px', opacity: (event.original?.status === 'Falta') ? 0.5 : 1 }
              })}
              onSelectEvent={(e) => {
                const evt = e.original;
                setEventoSelecionadoId(evt.id);
                setBuscaPaciente(evt.paciente_nome);
                setForm({ 
                  ...form, 
                  profissional: evt.profissional_nome, 
                  paciente_nome: evt.paciente_nome, 
                  paciente_id: evt.paciente_id, 
                  telefone: evt.paciente_telefone || '', 
                  inicio: format(new Date(evt.data_inicio), "yyyy-MM-dd'T'HH:mm"), 
                  duracao: '50', 
                  status: evt.status === 'Presenca' ? 'Presença' : (evt.status || 'Agendado'),
                  assinatura_url: evt.assinatura_url || null
                });
                setIsAgendamentoOpen(true);
              }}
              min={new Date(0, 0, 0, 7, 0, 0)} max={new Date(0, 0, 0, 21, 0, 0)}
            />
          </CardContent>
        </Card>
      </main>

      {isAgendamentoOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 overflow-hidden text-left font-sans">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">{eventoSelecionadoId ? 'Editar Detalhes' : 'Agendar Paciente'}</h3>
              <button onClick={() => setIsAgendamentoOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSalvarAgendamento} className="p-6 space-y-4">
              {eventoSelecionadoId && form.paciente_id && (
                <Button type="button" onClick={() => navigate(`/sistema/pacientes/${form.paciente_id}`)} className="w-full bg-blue-50 text-blue-700 font-bold py-4 rounded-xl flex items-center justify-center gap-2 mb-2 uppercase text-[10px] border border-blue-100"><FileText size={18} /> Ver Prontuário <ExternalLink size={12}/></Button>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                    <SelectTrigger className="bg-blue-50 border-none font-bold text-blue-700 h-10 uppercase text-[10px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agendado">Agendado</SelectItem>
                      <SelectItem value="Presença">Presença</SelectItem>
                      <SelectItem value="Falta">Falta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Duração (Min)</label>
                  <Select value={form.duracao} onValueChange={(v) => setForm({...form, duracao: v})}>
                    <SelectTrigger className="bg-gray-50 border-none h-10 font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 Min</SelectItem><SelectItem value="40">40 Min</SelectItem><SelectItem value="50">50 Min</SelectItem><SelectItem value="60">60 Min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Paciente</label>
                <div className="relative">
                  <Input placeholder="Buscar nome..." className="bg-gray-50 border-none font-bold uppercase text-xs h-11" value={buscaPaciente} onChange={(e) => setBuscaPaciente(e.target.value)} required />
                  {pacientesSugeridos.length > 0 && (
                    <div className="absolute z-[100] w-full bg-white border shadow-2xl rounded-xl mt-1 overflow-hidden">
                      {pacientesSugeridos.map(p => (
                        <button key={p.id} type="button" className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-none flex flex-col" onClick={() => { setForm({ ...form, paciente_nome: p.nome, paciente_id: p.id, telefone: p.telefone || '' }); setBuscaPaciente(p.nome); setPacientesSugeridos([]); }}>
                          <span className="font-bold text-sm text-gray-800 uppercase">{p.nome}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Profissional</label>
                  <Select value={form.profissional} onValueChange={(v) => setForm({...form, profissional: v})} required>
                    <SelectTrigger className="bg-gray-50 border-none h-11"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>{equipe.map(p => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Sala</label>
                  <Select value={form.sala} onValueChange={(v) => setForm({...form, sala: v})}>
                    <SelectTrigger className="bg-gray-50 border-none h-11"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Sala 01</SelectItem><SelectItem value="2">Sala 02</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp</label>
                  <div className="flex gap-1">
                    <Input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} className="bg-gray-50 border-none h-11" placeholder="(00)" />
                    <Button type="button" onClick={enviarZap} variant="outline" className="text-green-600 border-green-100 h-11 shrink-0"><MessageCircle size={18}/></Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Horário</label>
                  <input type="datetime-local" required className="w-full bg-gray-50 rounded-md p-2.5 text-sm h-11 outline-none" value={form.inicio} onChange={e => setForm({...form, inicio: e.target.value})} />
                </div>
              </div>

              {/* ÁREA DE ASSINATURA */}
              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase flex justify-between">
                  Assinatura de Presença
                  {form.assinatura_url && <span className="text-emerald-500 font-black">REGISTRADA</span>}
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white min-h-[120px] flex items-center justify-center relative">
                  {form.assinatura_url ? (
                    <div className="group relative w-full h-full flex flex-col items-center justify-center bg-gray-50 p-2">
                      <img src={form.assinatura_url} alt="Assinatura" className="max-h-[100px] object-contain" />
                      <Button type="button" onClick={() => setForm({ ...form, signature_url: null })} className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold text-[10px] uppercase">Refazer Assinatura</Button>
                    </div>
                  ) : (
                    <SignatureCanvas ref={sigCanvas} penColor='black' canvasProps={{width: 380, height: 120, className: 'sigCanvas w-full h-full'}} />
                  )}
                </div>
                <div className="flex justify-between items-center">
                   {!form.assinatura_url && (
                     <Button type="button" variant="ghost" size="sm" className="text-[9px] uppercase font-bold text-red-400" onClick={() => sigCanvas.current?.clear()}>Limpar Campo</Button>
                   )}
                   <p className="text-[8px] text-gray-400 font-bold uppercase italic ml-auto">Assine digitalmente no campo acima</p>
                </div>
              </div>

              {/* BOTÕES DE AÇÃO COM GERADOR DE PDF */}
              <div className="pt-4 flex flex-col gap-3">
                {eventoSelecionadoId && form.status === 'Presença' && (
                  <Button 
                    type="button" 
                    onClick={gerarComprovante}
                    className="w-full bg-gray-800 hover:bg-black text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2 uppercase text-[10px] shadow-md transition-all"
                  >
                    <FileText size={16} /> Gerar Atestado de Comparecimento
                  </Button>
                )}

                <div className="flex gap-3">
                  {eventoSelecionadoId && (
                     <Button type="button" variant="ghost" onClick={async () => { if(confirm("Apagar agendamento?")) { await supabase.from('agendamentos').delete().eq('id', eventoSelecionadoId); setIsAgendamentoOpen(false); fetchData(); } }} className="text-red-400 font-bold px-4 hover:bg-red-50"><Trash2 size={18}/></Button>
                  )}
                  <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold h-12 rounded-xl shadow-lg uppercase text-xs">
                    {loading ? 'Processando...' : 'Confirmar Agenda'}
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