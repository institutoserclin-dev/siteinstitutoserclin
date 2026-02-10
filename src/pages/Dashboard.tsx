import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar as CalendarIcon, Plus, X, AlertTriangle, User } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Configuração Regional ---
const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// --- Lista da Equipe SerClin ---
const EQUIPE = [
  { nome: 'Dra. Helenara Chaves', area: 'Neuropsicologia', cor: '#7c3aed' }, // Roxo
  { nome: 'Dr. Antônio Pinto', area: 'Psicologia', cor: '#2563eb' },       // Azul
  { nome: 'Prof. Mestre Ramiro Mendes', area: 'Psicopedagogia', cor: '#16a34a' }, // Verde
  { nome: 'Fonoaudiologia', area: 'Fono', cor: '#ea580c' },                // Laranja
  { nome: 'Terapeuta ABA', area: 'ABA', cor: '#db2777' }                   // Rosa
];

export function Dashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado do Formulário
  const [novoAgendamento, setNovoAgendamento] = useState({
    profissional: '',
    paciente: '',
    telefone: '',
    sala: '1', 
    inicio: '',
    fim: '',
    observacoes: ''
  });

  // --- 1. Carregar Dados ---
  const fetchAgendamentos = async () => {
    try {
      const { data, error } = await supabase.from('agendamentos').select('*');
      if (error) throw error;

      const eventosFormatados = data.map(evt => {
        // Encontra a cor do profissional
        const prof = EQUIPE.find(p => p.nome === evt.profissional_nome);
        
        return {
          id: evt.id,
          // Título mostra: Profissional - Paciente (Sala X)
          title: `${evt.profissional_nome?.split(' ')[0] || 'Agendamento'} - ${evt.paciente_nome}`,
          start: new Date(evt.data_inicio),
          end: new Date(evt.data_fim),
          resourceId: evt.sala_id,
          color: prof ? prof.cor : '#6b7280', // Cor da especialidade ou cinza
          desc: `Sala ${evt.sala_id} | ${evt.profissional_nome}`
        };
      });

      setEvents(eventosFormatados);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgendamentos(); }, []);

  // --- 2. Salvar com Bloqueio de Sala ---
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const inicio = new Date(novoAgendamento.inicio);
    const fim = new Date(novoAgendamento.fim);
    const salaId = parseInt(novoAgendamento.sala);

    if (fim <= inicio) {
      alert("Horário inválido: O fim deve ser depois do início.");
      return;
    }

    if (!novoAgendamento.profissional) {
      alert("Por favor, selecione o profissional responsável.");
      return;
    }

    // VERIFICAÇÃO DE CHOQUE (SALA)
    const { data: conflitosSala } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('sala_id', salaId)
      .or(`and(data_inicio.lte.${fim.toISOString()},data_fim.gte.${inicio.toISOString()})`);

    // VERIFICAÇÃO DE CHOQUE (PROFISSIONAL - O mesmo médico não pode estar em 2 salas)
    const { data: conflitosProf } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('profissional_nome', novoAgendamento.profissional)
      .or(`and(data_inicio.lte.${fim.toISOString()},data_fim.gte.${inicio.toISOString()})`);

    if (conflitosSala && conflitosSala.length > 0) {
      alert(`⚠️ CONFLITO DE SALA!\nA Sala ${salaId} já está ocupada neste horário.`);
      return;
    }

    if (conflitosProf && conflitosProf.length > 0) {
      alert(`⚠️ CONFLITO DE AGENDA!\n${novoAgendamento.profissional} já tem atendimento neste horário em outra sala.`);
      return;
    }

    // Salvar
    const { error } = await supabase.from('agendamentos').insert([{
      sala_id: salaId,
      profissional_nome: novoAgendamento.profissional, // Salva o nome selecionado
      paciente_nome: novoAgendamento.paciente,
      paciente_telefone: novoAgendamento.telefone,
      data_inicio: inicio.toISOString(),
      data_fim: fim.toISOString(),
      status: 'agendado'
    }]);

    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      setIsModalOpen(false);
      fetchAgendamentos();
      // Resetar form (mantendo o profissional para agilizar)
      setNovoAgendamento(prev => ({ ...prev, paciente: '', telefone: '', inicio: '', fim: '' }));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <CalendarIcon className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Instituto SerClin</h1>
            <p className="text-xs text-gray-500">Gestão Multidisciplinar</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 gap-2 shadow-lg">
            <Plus size={18} /> Agendar
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
            <LogOut size={18} className="text-gray-500" />
          </Button>
        </div>
      </header>

      {/* Legenda da Equipe */}
      <div className="bg-white border-b px-6 py-2 flex gap-4 overflow-x-auto text-xs">
        {EQUIPE.map((prof) => (
          <div key={prof.nome} className="flex items-center gap-1 min-w-fit">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: prof.cor }} />
            <span className="font-medium text-gray-700">{prof.nome.split(' ')[0]} {prof.nome.split(' ')[1]}</span>
          </div>
        ))}
      </div>

      {/* Calendário */}
      <main className="flex-1 p-4 md:p-6 overflow-hidden">
        <Card className="h-full shadow-md border-none flex flex-col">
          <CardContent className="p-0 flex-1">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 700 }} // Altura fixa para garantir scroll
              defaultView={Views.WEEK}
              views={['day', 'week', 'month', 'agenda']}
              messages={{
                next: "Próximo",
                previous: "Anterior",
                today: "Hoje",
                month: "Mês",
                week: "Semana",
                day: "Dia",
                agenda: "Lista"
              }}
              culture='pt-BR'
              eventPropGetter={(event) => ({
                style: { backgroundColor: event.color, fontSize: '0.85rem' }
              })}
              tooltipAccessor="desc"
            />
          </CardContent>
        </Card>
      </main>

      {/* Modal de Agendamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <User size={18} /> Novo Atendimento
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              
              {/* Seleção do Profissional */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Profissional Responsável</label>
                <Select 
                  onValueChange={(val) => setNovoAgendamento({...novoAgendamento, profissional: val})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione quem irá atender..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPE.map(prof => (
                      <SelectItem key={prof.nome} value={prof.nome}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: prof.cor }} />
                          {prof.nome} <span className="text-gray-400 text-xs">({prof.area})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dados do Paciente */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                  <Input 
                    required 
                    placeholder="Nome completo" 
                    value={novoAgendamento.paciente}
                    onChange={e => setNovoAgendamento({...novoAgendamento, paciente: e.target.value})}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <Input 
                    placeholder="(68) 99999-9999" 
                    value={novoAgendamento.telefone}
                    onChange={e => setNovoAgendamento({...novoAgendamento, telefone: e.target.value})}
                  />
                </div>
              </div>

              {/* Sala */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sala de Atendimento</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setNovoAgendamento({...novoAgendamento, sala: '1'})}
                    className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${
                      novoAgendamento.sala === '1' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-gray-800">Consultório 01</div>
                    <div className="text-xs text-gray-500">Neuropsicologia</div>
                  </div>
                  <div 
                    onClick={() => setNovoAgendamento({...novoAgendamento, sala: '2'})}
                    className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${
                      novoAgendamento.sala === '2' ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-gray-800">Consultório 02</div>
                    <div className="text-xs text-gray-500">Psicoterapia/Psicopedagogia</div>
                  </div>
                </div>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    onChange={e => setNovoAgendamento({...novoAgendamento, inicio: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    onChange={e => setNovoAgendamento({...novoAgendamento, fim: e.target.value})}
                  />
                </div>
              </div>

              {/* Botão Salvar */}
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold h-11 mt-2">
                Confirmar Agendamento
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}