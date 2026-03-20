import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  ArrowLeft, User, Save, Edit, AlertCircle, 
  Paperclip, FileText, Trash2, 
  Calendar as CalendarIcon, X, RefreshCw, Clock,
  FileEdit, ClipboardList, History 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePerfil } from "@/hooks/usePerfil";

const formatarDataSegura = (data: string | null | undefined) => {
  if (!data) return "Data desconhecida";
  try { return format(new Date(data), "dd/MM/yyyy HH:mm", { locale: ptBR }); } catch (e) { return "Data inválida"; }
};

export function Prontuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSecretaria, isAdmin } = usePerfil(); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [paciente, setPaciente] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [resumoPresenca, setResumoPresenca] = useState({ presencas: 0, faltas: 0 });
  const [modoEdicao, setModoEdicao] = useState<string | null>(null);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  
  const [isAgendamentoOpen, setIsAgendamentoOpen] = useState(false);
  const [equipeClinica, setEquipeClinica] = useState<any[]>([]); 
  const [loadingAgendamento, setLoadingAgendamento] = useState(false);

  const [isEditPacienteOpen, setIsEditPacienteOpen] = useState(false);
  const [tempDados, setTempDados] = useState({ anamnese: "", observacoes: "" });

  const [formAgendamento, setFormAgendamento] = useState({ 
    profissional: '', 
    sala: '1', 
    inicio: format(new Date(), "yyyy-MM-dd'T'HH:mm"), 
    duracao: '40', 
    status: 'Agendado',
    valor_atendimento: "0.00",
    forma_pagamento: "Pix"
  });

  const [novoRegistro, setNovoRegistro] = useState({ 
    tipo: isSecretaria ? "Laudo" : "Sessão", 
    descricao: "" 
  });

  const getCorProfissional = (nome: string) => {
    const prof = equipeClinica.find(p => p.nome === nome);
    return prof?.cor || "#1e3a8a";
  };

  const registrarLog = async (acao: string, detalhes: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: perf } = await supabase.from('perfis').select('nome').eq('id', user?.id).single();
      await supabase.from('logs_prontuario').insert([{
        paciente_id: id,
        profissional_nome: perf?.nome || user?.email,
        acao,
        detalhes
      }]);
      carregarLogs();
    } catch (err) { console.error("Erro Auditoria SerClin:", err); }
  };

  const carregarLogs = async () => {
    if (!id) return;
    setLoadingLogs(true);
    const { data } = await supabase.from('logs_prontuario').select('*').eq('paciente_id', id).order('criado_em', { ascending: false }).limit(10);
    setLogs(data || []);
    setLoadingLogs(false);
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      if (!id) return;

      const { data: p, error: errPac } = await supabase.from("pacientes").select("*").eq("id", id).maybeSingle();
      if (errPac) throw errPac;
      setPaciente(p);
      if (p) setTempDados({ anamnese: p.anamnese || "", observacoes: p.observacoes || "" });
      
      if (p) {
        const { data: ag } = await supabase.from("agendamentos").select("status").eq("paciente_id", id);
        if (ag) {
          setResumoPresenca({
            presencas: ag.filter(a => a.status === 'Presenca' || a.status === 'Presença').length,
            faltas: ag.filter(a => a.status === 'Falta').length
          });
        }
      }

      const { data: r } = await supabase.from("prontuarios").select("*").eq("paciente_id", id).order("created_at", { ascending: false });
      setRegistros(r || []);

      const { data: todosPerfis } = await supabase.from('perfis').select('*').order('nome');
      if (todosPerfis) {
        const filtrados = todosPerfis.filter(perfil => {
          const n = (perfil.nome || "").toLowerCase();
          const r = (perfil.role || "").toLowerCase();
          return !['instituto', 'recepcao', 'secretaria'].some(t => n.includes(t)) && r !== 'secretaria';
        });
        setEquipeClinica(filtrados);
      }
      carregarLogs();
    } catch (e) { toast.error("Erro ao carregar dados."); } finally { setLoading(false); }
  };

  useEffect(() => { carregarDados(); }, [id]);

  const handleSalvarDadosPaciente = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("pacientes").update({ anamnese: tempDados.anamnese, observacoes: tempDados.observacoes }).eq("id", id);
      if (error) throw error;
      await registrarLog("Editou Dados Clínicos", "Atualizou anamnese ou observações.");
      toast.success("Dados atualizados!");
      setIsEditPacienteOpen(false);
      carregarDados();
    } catch (err) { toast.error("Erro ao atualizar."); } finally { setLoading(false); }
  };

  const handleSalvarRegistro = async () => {
    if (!novoRegistro.descricao) return toast.warning("Descreva o atendimento.");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let nomeAutor = user?.user_metadata?.full_name || "Profissional SerClin";
      if (user?.email === 'romulochaves77@gmail.com') nomeAutor = "Dr. Rômulo Chaves";
      
      let arquivoUrl = null;
      let arquivoNome = null;

      if (arquivoSelecionado) {
        const fileName = `${id}/${Date.now()}_${arquivoSelecionado.name}`;
        await supabase.storage.from('documentos').upload(fileName, arquivoSelecionado);
        const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(fileName);
        arquivoUrl = publicUrl; arquivoNome = arquivoSelecionado.name;
      }

      if (modoEdicao) {
        const registroOriginal = registros.find(r => r.id === modoEdicao);
        const versaoAntiga = { texto: registroOriginal.descricao, data: new Date().toISOString(), autor: registroOriginal.profissional_nome };
        const historicoAtualizado = [ ...(registroOriginal.historico || []), versaoAntiga ];

        await supabase.from("prontuarios").update({
          descricao: novoRegistro.descricao, tipo_registro: novoRegistro.tipo, profissional_nome: nomeAutor,
          historico: historicoAtualizado, arquivo_url: arquivoUrl || registroOriginal.arquivo_url,
          arquivo_nome: arquivoNome || registroOriginal.arquivo_nome, updated_at: new Date().toISOString()
        }).eq("id", modoEdicao);
        await registrarLog("Editou Registro", `Alterou ${novoRegistro.tipo}`);
      } else {
        await supabase.from("prontuarios").insert([{
          paciente_id: id, tipo_registro: novoRegistro.tipo, descricao: novoRegistro.descricao,
          profissional_nome: nomeAutor, arquivo_url: arquivoUrl, arquivo_nome: arquivoNome
        }]);
        await registrarLog("Criou Registro", `Adicionou ${novoRegistro.tipo}`);
      }

      setNovoRegistro({ tipo: isSecretaria ? "Laudo" : "Sessão", descricao: "" });
      setArquivoSelecionado(null); setModoEdicao(null); carregarDados();
      toast.success("Salvo com sucesso!");
    } catch (error) { toast.error("Erro ao salvar."); } finally { setLoading(false); }
  };

  const handleSalvarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAgendamento(true);
    try {
      const dInicio = new Date(formAgendamento.inicio);
      const dFim = addMinutes(dInicio, parseInt(formAgendamento.duracao));
      await supabase.from('agendamentos').insert([{
        sala_id: parseInt(formAgendamento.sala), profissional_nome: formAgendamento.profissional,
        paciente_nome: paciente.nome, paciente_id: id, paciente_telefone: paciente.telefone,
        data_inicio: dInicio.toISOString(), data_fim: dFim.toISOString(),
        status: formAgendamento.status === 'Presença' ? 'Presenca' : formAgendamento.status,
        valor_atendimento: parseFloat(formAgendamento.valor_atendimento), forma_pagamento: formAgendamento.forma_pagamento
      }]);
      await registrarLog("Novo Agendamento", `Marcou consulta para ${format(dInicio, "dd/MM")}`);
      setIsAgendamentoOpen(false); carregarDados();
      toast.success("Agendado!");
    } catch (err) { toast.error("Erro ao agendar."); } finally { setLoadingAgendamento(false); }
  };

  if (loading && !paciente) return <div className="p-20 text-center font-black text-gray-400 animate-pulse">CARREGANDO PRONTUÁRIO...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-left pb-20">
      
      {/* HEADER FIXO MOBILE */}
      <header className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/sistema/pacientes")} className="p-2 -ml-2 text-gray-400"><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-sm font-black uppercase text-gray-800 leading-none truncate max-w-[180px]">{paciente?.nome}</h1>
            <p className="text-[9px] font-bold text-blue-600 uppercase mt-1 tracking-widest">Prontuário Digital SerClin</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => setIsAgendamentoOpen(true)} size="icon" className="bg-blue-600 rounded-xl h-10 w-10 shadow-md"><CalendarIcon size={18} /></Button>
           {isAdmin && <Button onClick={() => {if(confirm("Apagar paciente?")) navigate("/sistema/pacientes")}} size="icon" variant="ghost" className="text-red-300 h-10 w-10"><Trash2 size={18} /></Button>}
        </div>
      </header>

      <main className="p-4 md:p-10 max-w-6xl mx-auto space-y-6">
        
        {/* RESUMO RÁPIDO */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="rounded-2xl border-none shadow-sm bg-white p-4 flex flex-col items-center justify-center">
             <p className="text-xl font-black text-green-600">{resumoPresenca.presencas}</p>
             <p className="text-[8px] font-black uppercase text-gray-400">Presenças</p>
          </Card>
          <Card className="rounded-2xl border-none shadow-sm bg-white p-4 flex flex-col items-center justify-center">
             <p className="text-xl font-black text-red-600">{resumoPresenca.faltas}</p>
             <p className="text-[8px] font-black uppercase text-gray-400">Faltas</p>
          </Card>
          <Button onClick={() => setIsEditPacienteOpen(true)} variant="outline" className="h-full rounded-2xl border-dashed border-2 border-blue-100 flex flex-col gap-1 py-4 bg-white">
            <ClipboardList size={20} className="text-blue-600" />
            <span className="text-[8px] font-black uppercase text-blue-600">Dados Clínicos</span>
          </Button>
          <Card className="rounded-2xl border-none shadow-sm bg-white p-4 flex flex-col items-center justify-center overflow-hidden">
             {paciente?.foto_url ? <img src={paciente.foto_url} className="h-full w-full object-cover rounded-xl" /> : <User className="text-gray-200" />}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUNA DE REGISTRO (TOP NO MOBILE) */}
          <div className="lg:col-span-1 space-y-6">
            <Card className={`rounded-[2rem] border-none shadow-lg overflow-hidden ${modoEdicao ? 'ring-4 ring-amber-400' : ''}`}>
              <div className={`${modoEdicao ? 'bg-amber-500' : 'bg-[#1e3a8a]'} p-5 text-white flex justify-between items-center`}>
                <span className="font-black uppercase text-[10px] tracking-widest">{modoEdicao ? 'Editando Sessão' : 'Registrar Atendimento'}</span>
                {modoEdicao && <X size={18} className="cursor-pointer" onClick={() => setModoEdicao(null)} />}
              </div>
              <CardContent className="p-6 space-y-4">
                <Select value={novoRegistro.tipo} onValueChange={(v) => setNovoRegistro({...novoRegistro, tipo: v})}>
                  <SelectTrigger className="bg-gray-50 border-none h-12 font-bold uppercase text-[10px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Sessão">Sessão</SelectItem><SelectItem value="Laudo">Laudo / PDF</SelectItem><SelectItem value="Avaliação">Avaliação</SelectItem></SelectContent>
                </Select>
                <textarea 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm min-h-[150px] outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="O que foi trabalhado hoje? Evolução, queixas, conduta..."
                  value={novoRegistro.descricao}
                  onChange={e => setNovoRegistro({...novoRegistro, descricao: e.target.value})}
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 border-dashed border-2 h-12 rounded-xl text-[9px] font-black uppercase">
                    <Paperclip size={16} className="mr-1" /> {arquivoSelecionado ? "Pronto" : "Anexo"}
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setArquivoSelecionado(e.target.files?.[0] || null)} />
                  <Button onClick={handleSalvarRegistro} disabled={loading} className={`flex-[2] text-white font-black uppercase text-xs h-12 rounded-xl shadow-md ${modoEdicao ? 'bg-amber-600' : 'bg-blue-600'}`}>
                    {loading ? <RefreshCw className="animate-spin" /> : <><Save size={18} className="mr-2"/> Salvar</>}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AUDITORIA COMPACTA PARA MOBILE */}
            <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden hidden md:block">
              <div className="bg-gray-50 p-4 border-b flex items-center gap-2">
                <History size={16} className="text-gray-400" />
                <h3 className="font-black text-gray-400 uppercase text-[9px] tracking-widest">Logs de Atividade</h3>
              </div>
              <CardContent className="p-4 space-y-3 max-h-[250px] overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="border-l-2 border-blue-50 pl-3 py-1">
                    <p className="text-[9px] font-black text-gray-600 uppercase leading-none">{log.acao}</p>
                    <p className="text-[8px] font-medium text-gray-400 mt-1">{log.profissional_nome.split(' ')[0]} • {format(new Date(log.criado_em), "dd/MM HH:mm")}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* HISTÓRICO DE EVOLUÇÕES (EM CARDS) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
              <ClipboardList size={14} /> Histórico do Paciente
            </h3>
            
            {registros.length === 0 ? (
              <div className="bg-white p-16 rounded-[2.5rem] border-2 border-dashed border-gray-100 text-center">
                <FileText size={40} className="mx-auto text-gray-100 mb-4" />
                <p className="text-gray-300 font-black uppercase text-[10px]">Sem evoluções registradas.</p>
              </div>
            ) : (
              registros.map((reg) => (
                <div key={reg.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group transition-all hover:shadow-md">
                  <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: getCorProfissional(reg.profissional_nome) }} />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">{reg.tipo_registro}</span>
                        <span className="text-[10px] font-black text-gray-800 uppercase">{reg.profissional_nome}</span>
                      </div>
                      <p className="text-[9px] font-bold text-gray-300 mt-1 uppercase italic">{formatarDataSegura(reg.created_at)}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => iniciarEdicao(reg)} className="h-8 w-8 text-amber-500 hover:bg-amber-50"><Edit size={14}/></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { if(confirm("Apagar?")) { await registrarLog("Apagou Registro", reg.tipo_registro); supabase.from("prontuarios").delete().eq("id", reg.id).then(carregarDados) } }} className="h-8 w-8 text-red-300 hover:bg-red-50"><Trash2 size={14}/></Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">{reg.descricao}</p>
                  
                  {reg.arquivo_url && (
                    <a href={reg.arquivo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-[9px] font-black text-blue-700 uppercase mt-4 border border-gray-100 hover:bg-blue-50 transition-all">
                      <FileText size={14} /> Visualizar Anexo
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* MODAL ANAMNESE (FULLSCREEN MOBILE) */}
      {isEditPacienteOpen && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center md:p-4 backdrop-blur-sm">
          <Card className="w-full max-w-[550px] h-full md:h-auto md:rounded-[2.5rem] bg-white flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-[#1e3a8a] uppercase text-xs tracking-widest">Dados Clínicos</h3>
              <button onClick={() => setIsEditPacienteOpen(false)} className="p-2 text-gray-400"><X size={24}/></button>
            </div>
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Anamnese / Histórico</label>
                <textarea 
                  value={tempDados.anamnese} 
                  onChange={e => setTempDados({...tempDados, anamnese: e.target.value})} 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm min-h-[200px] outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Alergias, queixas crônicas, medicações..." 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observações Administrativas</label>
                <textarea 
                  value={tempDados.observacoes} 
                  onChange={e => setTempDados({...tempDados, observacoes: e.target.value})} 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Lembretes internos..." 
                />
              </div>
              <Button onClick={handleSalvarDadosPaciente} disabled={loading} className="w-full bg-blue-600 hover:bg-black text-white font-black h-16 rounded-2xl uppercase text-xs shadow-xl transition-all">
                {loading ? <RefreshCw className="animate-spin" /> : 'Salvar Dados Clínicos'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL AGENDAMENTO (FULLSCREEN MOBILE) */}
      {isAgendamentoOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center md:p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setIsAgendamentoOpen(false)}>
          <Card className="w-full max-w-[450px] h-full md:h-auto md:rounded-[2.5rem] bg-white shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#1e3a8a] p-6 flex justify-between items-center text-white">
              <h3 className="font-black uppercase text-[10px] tracking-widest">Nova Consulta: {paciente?.nome.split(' ')[0]}</h3>
              <button onClick={() => setIsAgendamentoOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleSalvarAgendamento} className="p-6 space-y-5 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <Select value={formAgendamento.status} onValueChange={(v) => setFormAgendamento({...formAgendamento, status: v})}>
                  <SelectTrigger className="bg-blue-50 border-none font-bold text-blue-700 h-12 uppercase text-[10px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[1001]"><SelectItem value="Agendado">Agendado</SelectItem><SelectItem value="Presença">Presença</SelectItem></SelectContent>
                </Select>
                <Select value={formAgendamento.forma_pagamento} onValueChange={(v) => setFormAgendamento({...formAgendamento, forma_pagamento: v})}>
                  <SelectTrigger className="bg-emerald-50 border-none font-bold text-emerald-700 h-12 text-[10px] uppercase rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[1001]"><SelectItem value="Pix">Pix</SelectItem><SelectItem value="Dinheiro">Dinheiro</SelectItem><SelectItem value="Cartão">Cartão</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Valor (R$)</label>
                  <Input type="number" step="0.01" value={formAgendamento.valor_atendimento} onChange={e => setFormAgendamento({...formAgendamento, valor_atendimento: e.target.value})} className="bg-gray-50 border-none h-12 font-bold text-sm rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Duração</label>
                  <Select value={formAgendamento.duracao} onValueChange={(v) => setFormAgendamento({...formAgendamento, duracao: v})}>
                    <SelectTrigger className="bg-gray-50 border-none h-12 font-bold text-sm rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[1001]"><SelectItem value="30">30 Min</SelectItem><SelectItem value="40">40 Min</SelectItem><SelectItem value="60">60 Min</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Profissional Responsável</label>
                <Select value={formAgendamento.profissional} onValueChange={(v) => setFormAgendamento({...formAgendamento, profissional: v})} required>
                  <SelectTrigger className="bg-gray-50 border-none h-12 font-bold text-sm uppercase rounded-xl"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent className="z-[1001]">{equipeClinica.map(p => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Data e Horário</label>
                <input type="datetime-local" className="w-full h-12 bg-gray-50 border-none rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600" value={formAgendamento.inicio} onChange={e => setFormAgendamento({...formAgendamento, inicio: e.target.value})} />
              </div>
              <Button type="submit" disabled={loadingAgendamento} className="w-full bg-[#1e3a8a] hover:bg-black text-white font-black uppercase h-16 rounded-2xl shadow-xl transition-all mt-4">
                {loadingAgendamento ? <RefreshCw className="animate-spin" /> : 'Confirmar Agendamento'}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* ESTILO PARA TEXTAREA E SCROLL */}
      <style>{`
        textarea { resize: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>
    </div>
  );
}