import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createClient } from '@supabase/supabase-js';
import { 
  LogOut, Calendar as CalendarIcon, Plus, X, User, Trash2, 
  Save, UserPlus, Users, Shield, Clock 
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { usePerfil } from "@/hooks/usePerfil";
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin, isSecretaria } = usePerfil();

  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [equipe, setEquipe] = useState<any[]>([]); // Dinâmico agora
  const [loading, setLoading] = useState(false);
  const [isAgendamentoOpen, setIsAgendamentoOpen] = useState(false);
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState<number | null>(null);
  const [form, setForm] = useState({ profissional: '', paciente: '', telefone: '', sala: '1', inicio: '', fim: '', observacoes: '' });

  // 1. Carregar Dados
  const fetchData = async () => {
    // Busca Profissionais
    const { data: profs } = await supabase.from('profissionais').select('*');
    setEquipe(profs || []);

    // Busca Agenda
    const { data: agendamentos, error } = await supabase.from('agendamentos').select('*');
    if (!error && agendamentos) {
      const eventosFormatados = agendamentos.map(evt => {
        const prof = profs?.find(p => p.nome === evt.profissional_nome);
        return {
          id: evt.id,
          title: `${evt.paciente_nome} (${evt.profissional_nome?.split(' ')[0]})`,
          start: new Date(evt.data_inicio),
          end: new Date(evt.data_fim),
          resourceId: evt.sala_id,
          color: prof ? prof.cor : '#6b7280',
          original: evt
        };
      });
      setEvents(eventosFormatados);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSalvarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const inicio = new Date(form.inicio);
      const fim = new Date(form.fim);
      
      if (fim <= inicio) { toast.warning("Hora final deve ser maior que inicial."); setLoading(false); return; }

      // --- VALIDAÇÃO 1: O PROFISSIONAL ATENDE NESSE DIA/HORA? ---
      const profissionalObj = equipe.find(p => p.nome === form.profissional);
      if (profissionalObj && profissionalObj.horarios) {
        const diaSemana = inicio.getDay(); // 0=Dom, 1=Seg...
        const configDia = profissionalObj.horarios[diaSemana];

        if (!configDia || !configDia.ativo) {
          toast.error(`${form.profissional} não atende neste dia da semana.`);
          setLoading(false); return;
        }

        // Verifica hora (comparação simples de string HH:MM)
        const horaInicio = inicio.toTimeString().slice(0, 5);
        const horaFim = fim.toTimeString().slice(0, 5);

        if (horaInicio < configDia.inicio || horaFim > configDia.fim) {
          toast.error(`${form.profissional} só atende das ${configDia.inicio} às ${configDia.fim} neste dia.`);
          setLoading(false); return;
        }
      }

      // --- VALIDAÇÃO 2: CHOQUE DE HORÁRIO (OVERLAP) ---
      // Verifica se já existe agendamento para este profissional no intervalo (exceto ele mesmo se for edição)
      const { data: conflitos } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('profissional_nome', form.profissional)
        .neq('id', eventoSelecionadoId || -1) // Ignora o próprio ID se estiver editando
        .or(`and(data_inicio.lte.${fim.toISOString()},data_fim.gte.${inicio.toISOString()})`); // Lógica de Overlap

      // Nota: A lógica acima verifica se um evento começa antes do outro terminar E termina depois do outro começar.
      // Ajuste fino para evitar "colar" eventos (ex: um acaba 10:00 e outro começa 10:00 não é conflito)
      
      // Filtragem manual para garantir precisão
      const temConflitoReal = conflitos?.some(c => {
        // Busca o evento original na lista local para ter as datas exatas
        const evt = events.find(e => e.id === c.id);
        if (!evt) return false;
        // Se (NovoInicio < EventoFim) E (NovoFim > EventoInicio) -> Conflito
        return inicio < evt.end && fim > evt.start;
      });

      if (temConflitoReal) {
        toast.error(`Choque de horário! ${form.profissional} já tem paciente neste horário.`);
        setLoading(false); return;
      }

      // --- SALVAR ---
      const payload = {
        sala_id: parseInt(form.sala),
        profissional_nome: form.profissional,
        paciente_nome: form.paciente,
        paciente_telefone: form.telefone,
        data_inicio: inicio.toISOString(),
        data_fim: fim.toISOString(),
        observacoes: form.observacoes
      };

      if (eventoSelecionadoId) {
        const { error } = await supabase.from('agendamentos').update(payload).eq('id', eventoSelecionadoId);
        if (error) throw error;
        toast.success("Atualizado!");
      } else {
        const { error } = await supabase.from('agendamentos').insert([payload]);
        if (error) throw error;
        toast.success("Agendado!");
      }
      setIsAgendamentoOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async () => {
    if (!eventoSelecionadoId || !confirm("Apagar agendamento?")) return;
    await supabase.from('agendamentos').delete().eq('id', eventoSelecionadoId);
    setIsAgendamentoOpen(false);
    fetchData();
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };
  
  // Helpers de Calendário
  const handleViewChange = (newView: View) => setView(newView);
  const handleNavigate = (newDate: Date) => setDate(newDate);
  const handleSelectEvent = (event: any) => {
    const evt = event.original;
    const formatForInput = (d: Date) => { const offset = d.getTimezoneOffset() * 60000; return (new Date(d.getTime() - offset)).toISOString().slice(0, 16); };
    setEventoSelecionadoId(evt.id);
    setForm({
      profissional: evt.profissional_nome, paciente: evt.paciente_nome, telefone: evt.paciente_telefone || '',
      sala: String(evt.sala_id), inicio: formatForInput(evt.data_inicio), fim: formatForInput(evt.data_fim), observacoes: evt.observacoes || ''
    });
    setIsAgendamentoOpen(true);
  };
  const abrirModalCriacao = () => {
    setEventoSelecionadoId(null);
    const dataSugestao = new Date(date); dataSugestao.setHours(new Date().getHours() + 1, 0, 0, 0);
    const formatForInput = (d: Date) => { const offset = d.getTimezoneOffset() * 60000; return (new Date(d.getTime() - offset)).toISOString().slice(0, 16); };
    setForm({ profissional: '', paciente: '', telefone: '', sala: '1', inicio: formatForInput(dataSugestao), fim: '', observacoes: '' });
    setIsAgendamentoOpen(true);
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 10) value = value.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    else if (value.length > 6) value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    else if (value.length > 2) value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    else if (value.length > 0) value = value.replace(/^(\d*)/, "($1");
    setForm({ ...form, telefone: value });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm sticky top-0 z-20 h-20">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-sm"><CalendarIcon className="text-white w-6 h-6" /></div>
          <div><h1 className="text-xl font-bold text-gray-800">Instituto SerClin</h1><p className="text-xs text-gray-500 font-medium">Gestão Integrada</p></div>
        </div>
        
        <div className="flex gap-2">
          {/* BOTÕES DE GESTÃO (Admin e Secretária podem ver Horários) */}
          {(isAdmin || isSecretaria) && (
            <Button variant="outline" onClick={() => navigate('/sistema/horarios')} className="border-green-200 text-green-700 hover:bg-green-50 gap-2 h-10">
              <Clock size={18} /> <span className="hidden sm:inline">Horários</span>
            </Button>
          )}

          {isAdmin && (
            <Button variant="outline" onClick={() => navigate('/sistema/acessos')} className="border-purple-200 text-purple-700 hover:bg-purple-50 gap-2 h-10">
              <Shield size={18} /> <span className="hidden sm:inline">Acessos</span>
            </Button>
          )}

          <Button variant="outline" onClick={() => navigate('/sistema/pacientes')} className="border-blue-200 text-blue-700 hover:bg-blue-50 gap-2 h-10">
            <Users size={18} /> <span className="hidden sm:inline">Pacientes</span>
          </Button>

          <Button onClick={abrirModalCriacao} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm h-10">
            <Plus size={18} /> <span className="hidden sm:inline">Agendar</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-red-50 hover:text-red-600 text-gray-400 h-10 w-10"><LogOut size={18} /></Button>
        </div>
      </header>

      {/* LEGENDA DINÂMICA (Vem do Banco) */}
      <div className="bg-white border-b px-6 py-3 flex gap-4 overflow-x-auto scrollbar-hide">
        {equipe.map((prof) => (
          <div key={prof.id} className="flex items-center gap-2 min-w-fit px-2 py-1 rounded-full border border-transparent hover:border-gray-200">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: prof.cor }} />
            <span className="text-xs font-medium text-gray-700">{prof.nome.split(' ')[0]} {prof.nome.split(' ')[1] || ''}</span>
          </div>
        ))}
      </div>

      <main className="flex-1 p-4 md:p-6 overflow-hidden">
        <Card className="h-full shadow-md border-none flex flex-col bg-white">
          <CardContent className="p-0 flex-1 relative">
            <Calendar
              localizer={localizer}
              events={events}
              view={view}
              onView={handleViewChange}
              date={date}
              onNavigate={handleNavigate}
              views={['day', 'week', 'month', 'agenda']}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%', minHeight: '600px' }}
              messages={{ next: "Próx", previous: "Ant", today: "Hoje", month: "Mês", week: "Semana", day: "Dia", agenda: "Lista" }}
              culture='pt-BR'
              eventPropGetter={(event) => ({
                style: { backgroundColor: event.color, borderLeft: '4px solid rgba(0,0,0,0.2)', fontSize: '0.8rem', borderRadius: '4px' }
              })}
              onSelectEvent={handleSelectEvent}
            />
          </CardContent>
        </Card>
      </main>

      {/* MODAL DE AGENDAMENTO */}
      {isAgendamentoOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                {eventoSelecionadoId ? <><User size={18} className="text-blue-600"/> Editar</> : <><Plus size={18} className="text-green-600"/> Novo Agendamento</>}
              </h3>
              <button onClick={() => setIsAgendamentoOpen(false)}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
            </div>
            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSalvarAgendamento} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Profissional</label>
                  <Select value={form.profissional} onValueChange={(val) => setForm({...form, profissional: val})} required>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {equipe.map(prof => (
                        <SelectItem key={prof.id} value={prof.nome}>
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: prof.cor }} />{prof.nome}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-sm font-semibold">Paciente</label><Input required value={form.paciente} onChange={e => setForm({...form, paciente: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-sm font-semibold">Telefone</label><Input placeholder="(DD) 9..." value={form.telefone} onChange={handlePhoneChange} maxLength={15} /></div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Sala</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => setForm({...form, sala: '1'})} className={`cursor-pointer border rounded-lg p-3 text-center ${form.sala === '1' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}><span className="font-bold text-sm">Sala 01</span></div>
                    <div onClick={() => setForm({...form, sala: '2'})} className={`cursor-pointer border rounded-lg p-3 text-center ${form.sala === '2' ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' : 'hover:bg-gray-50'}`}><span className="font-bold text-sm">Sala 02</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-sm font-semibold">Início</label><input type="datetime-local" required className="w-full border rounded-md p-2 text-sm" value={form.inicio} onChange={e => setForm({...form, inicio: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-sm font-semibold">Fim</label><input type="datetime-local" required className="w-full border rounded-md p-2 text-sm" value={form.fim} onChange={e => setForm({...form, fim: e.target.value})} /></div>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-semibold">Obs</label><Input value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} /></div>
                <div className="pt-4 flex gap-3 border-t mt-4">
                  {eventoSelecionadoId && <Button type="button" variant="destructive" onClick={handleExcluir} disabled={loading}><Trash2 size={18} className="mr-2"/> Excluir</Button>}
                  <Button type="submit" className={`flex-[2] text-white font-bold ${eventoSelecionadoId ? 'bg-blue-600' : 'bg-green-600'}`} disabled={loading}><Save size={18} className="mr-2"/> {loading ? '...' : 'Salvar'}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}