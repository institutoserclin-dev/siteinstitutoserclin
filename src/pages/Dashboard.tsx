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
  CheckCircle, RefreshCw, Wallet, Receipt, Calculator, Scale, MessageCircle, Send, User 
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

// --- VISUAL SUPER CLEAN ---
const EventoCustomizado = ({ event }: any) => {
  const isPresenca = event.original?.status === 'Presenca' || event.original?.status === 'Presença';
  const isFalta = event.original?.status === 'Falta';
  
  return (
    <div className="h-full w-full flex items-center justify-start gap-1.5 px-1 overflow-hidden text-left">
      {isPresenca && (
        <CheckCircle size={13} className="text-white shrink-0" strokeWidth={3} />
      )}
      <span className={`text-white font-bold text-[11px] uppercase leading-tight truncate text-left ${isFalta ? 'line-through opacity-75' : ''}`}>
        {event.title}
      </span>
    </div>
  );
};

export function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin, isSecretaria } = usePerfil();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [nomeLogado, setNomeLogado] = useState<string>(""); 
  const [isGestorSeguro, setIsGestorSeguro] = useState(false);
  
  const sigCanvas = useRef<SignatureCanvas>(null);
  
  // INÍCIO DINÂMICO MOBILE (Melhoria mantida, funcionalidade preservada)
  const [view, setView] = useState<View>(window.innerWidth < 768 ? Views.AGENDA : Views.WEEK);
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
    valor_atendimento: "0,00",
    forma_pagamento: "Pix"
  });

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: todosPerfis } = await supabase.from('perfis').select('*').order('nome');
      
      let nomeParaFiltro = "";
      let ehGestorEfetivo = false;

      if (user && todosPerfis) {
        const emailAutenticado = user.email?.toLowerCase().trim();
        setUserEmail(emailAutenticado ?? null);

        const meuPerfil = todosPerfis.find(p => p.email?.toLowerCase().trim() === emailAutenticado);
        
        if (meuPerfil) {
          nomeParaFiltro = meuPerfil.nome || "";
          setNomeLogado(nomeParaFiltro);
          
          const roleNoBanco = (meuPerfil.role || "").toLowerCase().trim();
          
          if (
            emailAutenticado === 'romulochaves77@gmail.com' || 
            emailAutenticado === 'nahpsicologiachaves@gmail.com' ||
            roleNoBanco === 'admin' ||
            roleNoBanco === 'secretaria'
          ) {
            ehGestorEfetivo = true;
          }
        }
      }

      setIsGestorSeguro(ehGestorEfetivo);

      if (todosPerfis) {
        const filtrados = todosPerfis.filter(p => {
          const n = (p.nome || "").toLowerCase();
          const r = (p.role || "").toLowerCase();
          const proibidos = ['instituto', 'recepcao', 'recepção'];
          if (n.includes('renata') && r === 'secretaria') return false;
          return !proibidos.some(termo => n.includes(termo)) && r !== 'secretaria';
        });
        setEquipe(filtrados);

        const { data: agendamentos, error } = await supabase.from('agendamentos').select('*');
        if (!error && agendamentos) {
          let permitidos = agendamentos;
          
          if (!ehGestorEfetivo && nomeParaFiltro) {
            const nomeLogadoNorm = nomeParaFiltro.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            permitidos = agendamentos.filter(ag => {
              const nomeAgNorm = (ag.profissional_nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
              return nomeAgNorm === nomeLogadoNorm;
            });
          }

          const eventosFormatados = permitidos.map(evt => {
            const perfil = todosPerfis.find(p => p.nome?.trim().toLowerCase() === evt.profissional_nome?.trim().toLowerCase());
            return {
              id: evt.id,
              title: `${evt.paciente_nome} (S${evt.sala_id})`,
              start: new Date(evt.data_inicio),
              end: new Date(evt.data_fim),
              color: perfil?.cor || '#1e3a8a',
              original: evt
            };
          });
          setEvents(eventosFormatados);
        }
      }
    } catch (err) { toast.error("Erro ao carregar dados."); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const pesquisar = async () => {
      if (buscaPaciente.length < 2) { setPacientesSugeridos([]); return; }
      const { data } = await supabase.from('pacientes').select('id, nome, telefone').ilike('nome', `%${buscaPaciente}%`).limit(5);
      setPacientesSugeridos(data || []);
    };
    pesquisar();
  }, [buscaPaciente]);

  const aplicarMascaraTelefone = (value: string) => {
    if (!value) return "";
    const apenasNumeros = value.replace(/\D/g, "");
    return apenasNumeros.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{1})(\d{4})(\d{4})$/, "$1 $2-$3").slice(0, 16);
  };

  const aplicarMascaraMoeda = (value: string) => {
    const apenasNumeros = value.replace(/\D/g, "");
    const valorFloat = parseFloat(apenasNumeros) / 100;
    if (isNaN(valorFloat)) return "0,00";
    return valorFloat.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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
      const { data: val, error } = await supabase.from('validacoes').insert([{ paciente_nome: form.paciente_nome, profissional_nome: form.profissional }]).select('id').single();
      if (error) throw error;
      const urlValidacao = `https://institutoserclin.vercel.app/validar/${val.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(urlValidacao);
      
      const doc = new jsPDF();
      doc.addImage(logoSer2, 'PNG', 75, 10, 60, 40);
      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 58, 138);
      doc.text("ATESTADO DE COMPARECIMENTO", 105, 60, { align: "center" });
      const textoCorpo = `Declaramos para os devidos fins de comprovação que o(a) paciente ${form.paciente_nome.toUpperCase()} esteve presente no INSTITUTO SERCLIN para atendimento especializado no dia ${format(new Date(form.inicio), "dd/MM/yyyy")}. O atendimento teve início às ${format(new Date(form.inicio), "HH:mm")} sob a responsabilidade do(a) profissional ${form.profissional.toUpperCase()}.`;
      doc.setFontSize(12); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
      doc.text(textoCorpo, 20, 85, { maxWidth: 170, align: "justify", lineHeightFactor: 1.5 });
      
      if (form.assinatura_url) {
        doc.addImage(form.assinatura_url, 'PNG', 20, 140, 50, 20);
      }
      
      doc.addImage(qrCodeDataUrl, 'PNG', 87, 195, 30, 30);
      doc.save(`Atestado_${form.paciente_nome.replace(/\s+/g, '_')}.pdf`);
      toast.success("Atestado Gerado!");
    } catch (err) { toast.error("Erro ao gerar PDF."); } finally { setLoading(false); }
  };

  const handleExcluirAgendamento = async () => {
    if (!eventoSelecionadoId || !confirm("⚠️ Deseja realmente apagar este agendamento?")) return;
    setLoading(true);
    try {
      await supabase.from('agendamentos').delete().eq('id', eventoSelecionadoId);
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
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) assinaturaBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
      const valorLimpo = parseFloat(form.valor_atendimento.replace(/\./g, "").replace(",", "."));
      const payload = {
        sala_id: parseInt(form.sala), profissional_nome: form.profissional, paciente_nome: buscaPaciente,
        paciente_id: idDoPaciente, paciente_telefone: form.telefone, data_inicio: dInicio.toISOString(), data_fim: dFim.toISOString(),
        status: mapearStatusParaBanco(form.status), assinatura_url: assinaturaBase64, valor_atendimento: valorLimpo, forma_pagamento: form.forma_pagamento
      };
      const { error } = eventoSelecionadoId ? await supabase.from('agendamentos').update(payload).eq('id', eventoSelecionadoId) : await supabase.from('agendamentos').insert([payload]);
      if (error) throw error;
      setIsAgendamentoOpen(false); fetchData(); toast.success("Agenda salva!");
    } catch (err) { toast.error("Erro ao salvar."); } finally { setLoading(false); }
  };

  const agendamentosAmanha = events
    .filter(e => isSameDay(new Date(e.start), addDays(new Date(), 1)))
    .map(e => e.original)
    .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden text-left">
      <style>{`
        /* --- ESTILOS ORIGINAIS INTEGRADOS --- */
        .rbc-agenda-view table.rbc-agenda-table tbody > tr > td { color: #1f2937 !important; font-weight: 800 !important; font-size: 14px !important; }
        .rbc-agenda-view { background-color: #ffffff; border-radius: 1.5rem; overflow: hidden; border: 1px solid #e5e7eb; }
        .rbc-agenda-date-cell, .rbc-agenda-time-cell { color: #1e3a8a !important; font-weight: 800 !important; }
        .rbc-toolbar button { color: #1e3a8a !important; font-weight: bold; }
        .rbc-toolbar button.rbc-active { background-color: #1e3a8a !important; color: white !important; }
        .rbc-event-content { font-size: 13px !important; }
        
        @keyframes pulse-emerald {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .animate-priority { animation: pulse-emerald 2s infinite; }

        /* NOVA TÁTICA DE ALINHAMENTO */
        .rbc-time-view { border-radius: 1.5rem; overflow: hidden; border: 1px solid #e5e7eb; box-sizing: border-box !important; }
        .rbc-time-content { border-top: none !important; }
        .rbc-timeslot-group { 
          min-height: 48px !important; 
          display: flex !important; 
          flex-direction: column !important; 
          justify-content: center !important; 
          border-bottom: 1px solid #f3f4f6 !important; 
          box-sizing: border-box !important; 
        }
        .rbc-label { 
          display: block !important; height: 100% !important; padding: 0 8px !important; line-height: 48px !important; 
          color: #9ca3af !important; font-weight: 700 !important; font-size: 11px !important; text-align: right !important; 
        }

        @media (max-width: 768px) {
          .rbc-toolbar { flex-direction: column; gap: 8px; height: auto !important; padding: 10px !important; }
          .fixed.inset-0 .bg-white.rounded-\[2\.5rem\] { 
            max-width: 100% !important; width: 100% !important; height: 100% !important; 
            max-height: 100% !important; border-radius: 0 !important; margin: 0 !important; 
          }
          .sigCanvas { width: 100% !important; height: 120px !important; }
        }
      `}</style>

      {/* HEADER COMPLETO */}
      <header className="bg-white border-b px-6 py-3 flex justify-between items-center h-20 shadow-sm z-20 gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <img src={logoSer2} className="w-12 h-12 object-contain" alt="SerClin" />
          <div className="hidden lg:block text-left">
            <h1 className="text-md font-black text-gray-800 uppercase leading-none">SerClin</h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Gestão Integrada</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
          <User size={16} className="text-blue-600" />
          <span className="text-[11px] font-black text-blue-700 uppercase tracking-tight">
            Olá, {nomeLogado || 'Colaborador'}
          </span>
        </div>

        <div className="flex gap-1.5 items-center">
          {isGestorSeguro && (
            <>
              <div className="hidden md:flex flex-1 max-w-xs">
                <Select value={filtroProfissional} onValueChange={setFiltroProfissional}>
                  <SelectTrigger className="bg-gray-50 border-none h-9 text-[10px] font-bold uppercase tracking-widest text-left">
                    <Filter size={14} className="mr-2 text-blue-600"/><SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Agenda Geral</SelectItem>
                    {equipe.map(p => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setIsConfirmacaoAmanhaOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase gap-2 rounded-full px-5 h-9 mr-2 shadow-lg relative transition-all">
                <Send size={14} /> Amanhã
                {agendamentosAmanha.length > 0 && (
                  <span className="ml-1 bg-white text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm">
                    {agendamentosAmanha.length}
                  </span>
                )}
              </Button>
            </>
          )}

          {isGestorSeguro && (
            <div className="hidden md:flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/planos')} className="text-emerald-600" title="Financeiro"><Wallet size={20}/></Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/despesas')} className="text-red-500" title="Despesas"><Receipt size={20}/></Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/repasses')} className="text-blue-600" title="Repasses"><Calculator size={20}/></Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/fechamento')} className="text-indigo-600" title="Fechamento"><Scale size={20}/></Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/horarios')} className="text-green-600" title="Horários"><Clock size={20}/></Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/acessos')} className="text-purple-600" title="Acessos"><Shield size={20}/></Button>
            </div>
          )}

          <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/relatorios')} className="text-orange-500" title="Relatórios"><BarChart3 size={20}/></Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('/sistema/pacientes')} className="text-blue-600 mr-2" title="Pacientes"><Users size={20}/></Button>
          
          <Button onClick={() => { 
            setEventoSelecionadoId(null); setBuscaPaciente(""); 
            setForm({ ...form, profissional: isGestorSeguro ? '' : nomeLogado, paciente_id: null, status: 'Agendado', duracao: '40', assinatura_url: null, inicio: format(new Date(), "yyyy-MM-dd'T'HH:mm"), telefone: "", valor_atendimento: "0,00", forma_pagamento: "Pix" }); 
            setIsAgendamentoOpen(true); 
          }} className="bg-blue-600 hover:bg-black text-white rounded-full h-9 px-4 text-xs font-black shadow-lg transition-all">
            <Plus size={16} className="mr-1" /> AGENDAR
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { supabase.auth.signOut(); navigate('/login'); }} title="Sair"><LogOut size={18} /></Button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL DO CALENDÁRIO */}
      <main className="flex-1 p-2 md:p-4 overflow-hidden text-left">
        <Card className="h-full border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
          <CardContent className="p-0 h-full">
            <Calendar 
              localizer={localizer} culture='pt-BR' messages={mensagensPortugues}
              events={filtroProfissional === "geral" ? events : events.filter(e => e.original?.profissional_nome === filtroProfissional)} 
              view={view} onView={setView} date={date} onNavigate={setDate} 
              views={['day', 'week', 'month', 'agenda']} 
              components={{ event: EventoCustomizado }} 
              eventPropGetter={(event: any) => ({ style: { backgroundColor: event.color, color: 'white', border: 'none', borderRadius: '6px', opacity: event.original?.status === 'Falta' ? 0.5 : 1 } })}
              onSelectEvent={(e) => { 
                const evt = e.original; 
                setEventoSelecionadoId(evt.id); setBuscaPaciente(evt.paciente_nome); 
                setForm({ ...form, profissional: evt.profissional_nome, paciente_nome: evt.paciente_nome, paciente_id: evt.paciente_id, telefone: aplicarMascaraTelefone(evt.paciente_telefone || ''), sala: evt.sala_id?.toString() || '1', inicio: format(new Date(evt.data_inicio), "yyyy-MM-dd'T'HH:mm"), status: evt.status === 'Presenca' ? 'Presença' : (evt.status || 'Agendado'), duracao: evt.original?.duracao || '40', assinatura_url: evt.assinatura_url || null, valor_atendimento: aplicarMascaraMoeda(evt.valor_atendimento?.toString() || "0"), forma_pagamento: evt.forma_pagamento || "Pix" }); 
                setIsAgendamentoOpen(true); 
              }} 
            />
          </CardContent>
        </Card>
      </main>

      {/* MODAL DE CONFIRMAÇÃO DE AMANHÃ (Fiel ao original) */}
      {isConfirmacaoAmanhaOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[650px] border border-gray-100 overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center bg-white text-left">
              <div>
                <h3 className="font-black uppercase text-xl tracking-tighter text-[#1e3a8a]">Lista de Confirmação</h3>
                <p className="text-[12px] font-bold text-emerald-600 uppercase flex items-center gap-2">
                  <CalendarIcon size={14}/> {format(addDays(new Date(), 1), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <button onClick={() => setIsConfirmacaoAmanhaOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto bg-gray-50/50 space-y-3 text-left">
              {agendamentosAmanha.length === 0 ? (
                <div className="text-center py-20"><p className="text-gray-400 font-bold uppercase text-xs text-left">Nenhum agendamento para amanhã.</p></div>
              ) : (
                agendamentosAmanha.map((ag, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-gray-100 shadow-sm group">
                    <div className="flex items-center gap-5 text-left">
                      <div className="h-14 w-20 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100"><span className="font-black text-[#1e3a8a]">{format(new Date(ag.data_inicio), "HH:mm")}</span></div>
                      <div className="flex flex-col text-left">
                        <span className="font-black text-[15px] uppercase text-gray-800 leading-tight">{ag.paciente_nome}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Prof: {ag.profissional_nome}</span>
                          <span className="text-[10px] font-bold text-blue-500 uppercase">Sala {ag.sala_id}</span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => enviarWhatsApp(ag.paciente_nome, ag.paciente_telefone, ag.profissional_nome, ag.data_inicio)} className="bg-emerald-500 text-white rounded-2xl h-14 px-6 flex items-center gap-3 shadow-lg transition-all"><MessageCircle size={20} /><span className="font-black uppercase text-[11px] hidden sm:block">Confirmar</span></Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AGENDAMENTO COMPLETO COM NOVO BOTÃO DE PRONTUÁRIO */}
      {isAgendamentoOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-0 md:p-2 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setIsAgendamentoOpen(false)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[440px] h-full md:h-auto md:max-h-[95vh] flex flex-col overflow-hidden border border-gray-100">
            <div className="p-5 border-b flex justify-between items-center bg-white text-left shrink-0">
              <h3 className="font-black uppercase text-[15px] tracking-widest text-[#1e3a8a]">{eventoSelecionadoId ? 'Editar' : 'Novo'} Agendamento</h3>
              <button onClick={() => setIsAgendamentoOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSalvarAgendamento} className="p-6 space-y-4 text-left overflow-y-auto flex-1 custom-scrollbar">
              
              {/* ATALHO DE PRONTUÁRIO ADICIONADO (Mantendo a lógica intacta) */}
              {eventoSelecionadoId && (
                <Button 
                  type="button" 
                  onClick={() => navigate(`/sistema/pacientes/${form.paciente_id}`)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black h-12 rounded-xl flex items-center justify-center gap-2 uppercase text-[10px] shadow-md mb-2 transition-all"
                >
                  <FileText size={18} /> Acessar Prontuário do Paciente
                </Button>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[12px] font-black text-gray-500 uppercase">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}><SelectTrigger className="bg-blue-50 border-none font-bold text-blue-700 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[110]"><SelectItem value="Agendado">Agendado</SelectItem><SelectItem value="Presença">Presença</SelectItem><SelectItem value="Falta">Falta</SelectItem></SelectContent></Select></div>
                <div className="space-y-1"><label className="text-[12px] font-black text-gray-400 uppercase text-left">Pagamento</label>
                  <Select value={form.forma_pagamento} onValueChange={(v) => setForm({...form, forma_pagamento: v})}><SelectTrigger className="bg-emerald-50 border-none font-bold text-emerald-700 h-10 text-left"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[110]"><SelectItem value="Pix">Pix</SelectItem><SelectItem value="Dinheiro">Dinheiro</SelectItem><SelectItem value="Cartão">Cartão</SelectItem></SelectContent></Select></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[12px] font-black text-gray-400 uppercase text-left">Valor (R$)</label>
                  <Input type="text" value={form.valor_atendimento} onChange={e => setForm({...form, valor_atendimento: aplicarMascaraMoeda(e.target.value)})} className="bg-gray-50 border-none h-11 font-bold text-sm text-gray-700" /></div>
                <div className="space-y-1"><label className="text-[12px] font-black text-gray-400 uppercase text-left">Duração</label>
                  <Select value={form.duracao} onValueChange={(v) => setForm({...form, duracao: v})}><SelectTrigger className="bg-gray-50 border-none h-11 text-sm font-bold text-gray-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[110]"><SelectItem value="30">30 Min</SelectItem><SelectItem value="40">40 Min</SelectItem><SelectItem value="50">50 Min</SelectItem><SelectItem value="60">60 Min</SelectItem></SelectContent></Select></div>
              </div>

              <div className="space-y-1"><label className="text-[12px] font-black text-gray-400 uppercase text-left">Paciente</label>
                <div className="relative"><Input placeholder="Buscar..." className="bg-gray-50 border-none h-11 text-sm font-bold uppercase text-gray-700" value={buscaPaciente} onChange={(e) => setBuscaPaciente(e.target.value)} required />
                {pacientesSugeridos.length > 0 && (<div className="absolute z-[110] w-full bg-white border shadow-xl rounded-xl mt-1 overflow-hidden">{pacientesSugeridos.map(p => (<button key={p.id} type="button" className="w-full text-left p-3 hover:bg-blue-50 border-b flex flex-col" onClick={() => { setForm({ ...form, paciente_nome: p.nome, paciente_id: p.id, telefone: aplicarMascaraTelefone(p.telefone || '') }); setBuscaPaciente(p.nome); setPacientesSugeridos([]); }}><span className="font-bold text-sm uppercase text-gray-700">{p.nome}</span></button>))}</div>)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[12px] font-black text-gray-400 uppercase text-left">Sala</label>
                  <Select value={form.sala} onValueChange={(v) => setForm({...form, sala: v})}><SelectTrigger className="bg-gray-50 border-none h-11 text-sm font-bold text-gray-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[110]"><SelectItem value="1">Sala 01</SelectItem><SelectItem value="2">Sala 02</SelectItem><SelectItem value="3">Sala 03</SelectItem><SelectItem value="4">Sala 04</SelectItem></SelectContent></Select></div>
                <div className="space-y-1"><label className="text-[12px] font-black text-gray-400 uppercase text-left">WhatsApp</label>
                  <Input value={form.telefone} onChange={e => setForm({...form, telefone: aplicarMascaraTelefone(e.target.value)})} className="bg-gray-50 border-none h-11 text-gray-700 font-bold" placeholder="(00) 9 0000-0000" /></div>
              </div>

              <div className="space-y-1"><label className="text-[12px] font-black text-gray-400 uppercase text-left">Profissional Clínico</label>
                <Select value={form.profissional} onValueChange={(v) => setForm({...form, profissional: v})} required disabled={!isGestorSeguro}><SelectTrigger className="bg-gray-50 border-none h-11 font-bold text-sm text-gray-700"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent className="z-[110] text-left">{isGestorSeguro ? equipe.map(p => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>) : <SelectItem value={nomeLogado}>{nomeLogado}</SelectItem>}</SelectContent></Select>
              </div>

              <div className="space-y-1"><label className="text-[12px] font-black text-gray-400 uppercase text-left">Horário/Data</label>
                <input type="datetime-local" required className="w-full bg-gray-50 rounded-md p-2.5 text-xs font-bold h-11 border-none outline-none text-gray-700" value={form.inicio} onChange={e => setForm({...form, inicio: e.target.value})} />
              </div>

              <div className="space-y-1 pt-1 text-left">
                <label className="text-[12px] font-black text-gray-400 uppercase flex justify-between">Assinatura Digital {form.assinatura_url && <span className="text-emerald-500 font-black">OK</span>}</label>
                <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden bg-white min-h-[80px] flex items-center justify-center relative">
                  {form.assinatura_url ? (<div className="group relative w-full h-full flex flex-col items-center justify-center bg-gray-50 p-2"><img src={form.assinatura_url} alt="Assinatura" className="max-h-[60px] object-contain" /><button type="button" onClick={() => setForm({ ...form, assinatura_url: null })} className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 font-bold text-[9px] uppercase">Refazer</button></div>) : (<SignatureCanvas ref={sigCanvas} penColor='black' canvasProps={{width: 400, height: 80, className: 'sigCanvas w-full h-full'}} />)}
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2 shrink-0">
                {form.telefone && (<Button type="button" onClick={() => enviarWhatsApp(form.paciente_nome, form.telefone, form.profissional, form.inicio)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black h-11 rounded-xl flex items-center justify-center gap-2 uppercase text-[10px] shadow-md transition-all"><MessageCircle size={16} /> Confirmar WhatsApp</Button>)}
                {eventoSelecionadoId && (<Button type="button" onClick={gerarComprovante} className="w-full bg-[#1e3a8a] hover:bg-black text-white font-black h-11 rounded-xl flex items-center justify-center gap-2 uppercase text-[10px] shadow-md transition-all"><FileText size={16} /> Gerar Atestado</Button>)}
                <div className="flex gap-2">
                  {eventoSelecionadoId && (<Button type="button" variant="outline" onClick={handleExcluirAgendamento} className="px-5 border-red-200 text-red-500 hover:bg-red-50 h-12 rounded-2xl transition-all"><Trash2 size={20} /></Button>)}
                  <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-black text-white font-black h-12 rounded-2xl shadow-xl uppercase text-xs transition-all">{loading ? <RefreshCw className="animate-spin" /> : 'Confirmar Agenda'}</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}