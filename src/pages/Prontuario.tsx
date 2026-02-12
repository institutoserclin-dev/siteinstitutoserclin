import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  ArrowLeft, User, Save, History, FilePlus, Edit, AlertCircle, 
  Paperclip, FileText, Shield, CheckCircle, XCircle, Trash2, 
  Calendar as CalendarIcon, X, Plus, RefreshCw, Clock 
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
  const [loading, setLoading] = useState(true);
  const [resumoPresenca, setResumoPresenca] = useState({ presencas: 0, faltas: 0 });
  const [modoEdicao, setModoEdicao] = useState<string | null>(null);
  const [editandoPaciente, setEditandoPaciente] = useState(false);
  const [formPaciente, setFormPaciente] = useState({ nome: "", telefone: "", convenio: "" });
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  
  const [isAgendamentoOpen, setIsAgendamentoOpen] = useState(false);
  const [equipe, setEquipe] = useState<any[]>([]);
  const [loadingAgendamento, setLoadingAgendamento] = useState(false);
  const [formAgendamento, setFormAgendamento] = useState({ 
    profissional: '', sala: '1', inicio: format(new Date(), "yyyy-MM-dd'T'HH:mm"), duracao: '40', status: 'Agendado'
  });

  const [novoRegistro, setNovoRegistro] = useState({ 
    tipo: isSecretaria ? "Laudo" : "Sessão", 
    descricao: "" 
  });

  const getCorProfissional = (nome: string) => {
    const prof = equipe.find(p => p.nome === nome);
    return prof?.cor || "#1e3a8a";
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      const { data: p } = await supabase.from("pacientes").select("*").eq("id", id).single();
      setPaciente(p);
      if (p) {
        setFormPaciente({ nome: p.nome, telefone: p.telefone || "", convenio: p.convenio || "" });
        const { data: ag } = await supabase.from("agendamentos").select("status").eq("paciente_nome", p.nome);
        if (ag) {
          setResumoPresenca({
            presencas: ag.filter(a => a.status === 'Presenca' || a.status === 'Presença').length,
            faltas: ag.filter(a => a.status === 'Falta').length
          });
        }
      }
      const { data: r } = await supabase.from("prontuarios").select("*").eq("paciente_id", id).order("created_at", { ascending: false });
      setRegistros(r || []);
      const { data: profs } = await supabase.from('perfis').select('*');
      setEquipe(profs || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { carregarDados(); }, [id]);

  const iniciarEdicao = (reg: any) => {
    setModoEdicao(reg.id);
    setNovoRegistro({ tipo: reg.tipo_registro, descricao: reg.descricao });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSalvarRegistro = async () => {
    if (!novoRegistro.descricao) return toast.warning("Descreva o atendimento.");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let nomeAutor = user?.email === 'romulochaves77@gmail.com' ? "Rômulo Chaves da Silva" : (user?.user_metadata?.full_name || "Profissional SerClin");
      
      let arquivoUrl: string | null = null;
      let arquivoNome: string | null = null;

      if (arquivoSelecionado) {
        const fileName = `${id}/${Date.now()}_${arquivoSelecionado.name}`;
        const { error: upErr } = await supabase.storage.from('documentos').upload(fileName, arquivoSelecionado);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(fileName);
        arquivoUrl = publicUrl;
        arquivoNome = arquivoSelecionado.name;
      }

      if (modoEdicao) {
        const registroOriginal = registros.find(r => r.id === modoEdicao);
        const versaoAntiga = {
          texto: registroOriginal.descricao,
          data: new Date().toISOString(),
          autor: registroOriginal.profissional_nome || "Desconhecido"
        };
        const historicoAtualizado = [ ...(registroOriginal.historico || []), versaoAntiga ];

        await supabase.from("prontuarios").update({
          descricao: novoRegistro.descricao,
          tipo_registro: novoRegistro.tipo,
          profissional_nome: nomeAutor,
          historico: historicoAtualizado,
          arquivo_url: arquivoUrl || registroOriginal.arquivo_url,
          arquivo_nome: arquivoNome || registroOriginal.arquivo_nome,
          updated_at: new Date().toISOString()
        }).eq("id", modoEdicao);
        toast.success("Prontuário atualizado com rastro salvo!");
      } else {
        await supabase.from("prontuarios").insert([{
          paciente_id: id,
          tipo_registro: novoRegistro.tipo,
          descricao: novoRegistro.descricao,
          profissional_nome: nomeAutor,
          historico: [],
          arquivo_url: arquivoUrl,
          arquivo_nome: arquivoNome
        }]);
        toast.success("Novo registro salvo!");
      }

      setNovoRegistro({ tipo: isSecretaria ? "Laudo" : "Sessão", descricao: "" });
      setArquivoSelecionado(null);
      setModoEdicao(null);
      carregarDados();
    } catch (error) { toast.error("Erro ao salvar registro."); } finally { setLoading(false); }
  };

  const handleExcluirPacienteGeral = async () => {
    if (!confirm("⚠️ ATENÇÃO: Isso excluirá o PACIENTE e TODO O HISTÓRICO permanentemente. Confirma?")) return;
    try {
      const { error } = await supabase.from("pacientes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Prontuário removido!");
      navigate("/sistema/pacientes");
    } catch (error) { toast.error("Erro ao excluir."); }
  };

  const handleSalvarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAgendamento.profissional) return toast.error("Selecione o profissional.");
    setLoadingAgendamento(true);
    try {
      const dInicio = new Date(formAgendamento.inicio);
      const dFim = addMinutes(dInicio, parseInt(formAgendamento.duracao));
      const { error } = await supabase.from('agendamentos').insert([{
        sala_id: parseInt(formAgendamento.sala),
        profissional_nome: formAgendamento.profissional,
        paciente_nome: paciente.nome,
        paciente_id: id,
        paciente_telefone: paciente.telefone,
        data_inicio: dInicio.toISOString(),
        data_fim: dFim.toISOString(),
        status: 'Agendado'
      }]);
      if (error) throw error;
      setIsAgendamentoOpen(false);
      toast.success("Agendado!");
    } catch (err) { toast.error("Erro ao agendar."); } finally { setLoadingAgendamento(false); }
  };

  if (loading && !paciente) return <div className="p-20 text-center font-black uppercase text-gray-400">Carregando Prontuário...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans text-left">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/sistema/pacientes")} className="gap-2 text-gray-500 font-black uppercase text-xs">
            <ArrowLeft size={20} /> Voltar
          </Button>
          <div className="flex gap-2">
            {isAdmin && (
               <Button onClick={handleExcluirPacienteGeral} variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50 font-black uppercase text-[10px] gap-2">
                <Trash2 size={16} /> Excluir Tudo
              </Button>
            )}
            <Button onClick={() => setIsAgendamentoOpen(true)} className="bg-[#1e3a8a] text-white font-black uppercase text-[10px] px-6 rounded-full h-10 shadow-md">
              <CalendarIcon size={16} className="mr-2" /> Agendar Consulta
            </Button>
          </div>
        </div>

        {/* INFO PACIENTE COM FOTO RECUPERADA */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
          <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-[#1e3a8a] shadow-inner overflow-hidden border-2 border-white">
            {paciente?.foto_url ? (
              <img src={paciente.foto_url} alt={paciente.nome} className="w-full h-full object-cover" />
            ) : (
              <User size={40} />
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-black text-gray-800 uppercase leading-none">{paciente?.nome}</h1>
            <p className="text-sm font-bold text-gray-400 mt-2">{paciente?.telefone} | {paciente?.convenio}</p>
          </div>
          <div className="flex gap-3 text-center">
            <div className="bg-green-50 px-5 py-2 rounded-2xl border border-green-100 min-w-[90px]">
              <p className="text-xl font-black text-green-600">{resumoPresenca.presencas}</p>
              <p className="text-[8px] font-black uppercase text-green-400">Presenças</p>
            </div>
            <div className="bg-red-50 px-5 py-2 rounded-2xl border border-red-100 min-w-[90px]">
              <p className="text-xl font-black text-red-600">{resumoPresenca.faltas}</p>
              <p className="text-[8px] font-black uppercase text-red-400">Faltas</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          {/* NOVO REGISTRO */}
          <div className="lg:col-span-1">
            <Card className={`border-none shadow-lg rounded-[2rem] overflow-hidden ${modoEdicao ? 'ring-4 ring-amber-400' : ''}`}>
              <div className={`${modoEdicao ? 'bg-amber-500' : 'bg-[#1e3a8a]'} px-6 py-4 text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2`}>
                {modoEdicao ? <Edit size={16}/> : <FilePlus size={16}/>}
                {modoEdicao ? 'Editando Registro' : 'Novo Registro'}
              </div>
              <CardContent className="p-6 space-y-4">
                <select className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold uppercase outline-none" value={novoRegistro.tipo} onChange={e => setNovoRegistro({...novoRegistro, tipo: e.target.value})}>
                  <option value="Sessão">Sessão</option>
                  <option value="Laudo">Laudo / PDF</option>
                  <option value="Avaliação">Avaliação</option>
                  <option value="Anamnese">Anamnese</option>
                </select>
                <textarea className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm min-h-[180px] outline-none leading-relaxed" placeholder="Descreva o atendimento..." value={novoRegistro.descricao} onChange={e => setNovoRegistro({...novoRegistro, descricao: e.target.value})} />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full border-dashed border-2 text-[10px] font-black uppercase h-12">
                  <Paperclip size={16} className="mr-2" /> {arquivoSelecionado ? arquivoSelecionado.name : "Anexar PDF"}
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setArquivoSelecionado(e.target.files?.[0] || null)} />
                <Button onClick={handleSalvarRegistro} className={`w-full text-white font-black uppercase text-xs h-12 rounded-xl shadow-lg ${modoEdicao ? 'bg-amber-600' : 'bg-[#1e3a8a]'}`}>
                  <Save size={18} className="mr-2"/> {modoEdicao ? 'Atualizar' : 'Salvar no Prontuário'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* HISTÓRICO COM BARRA DE CORES E RASTRO */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-black text-gray-400 uppercase text-[10px] flex items-center gap-2 px-2"><History size={16}/> Linha do Tempo Clínica</h3>
            <div className="space-y-6">
              {registros.map((reg) => (
                <div key={reg.id} className="bg-white p-6 pl-8 rounded-[1.5rem] shadow-sm border border-gray-100 space-y-4 relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-2.5" style={{ backgroundColor: getCorProfissional(reg.profissional_nome) }} />
                  <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase px-2 py-1 bg-blue-50 text-[#1e3a8a] rounded-md">{reg.tipo_registro}</span>
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{reg.profissional_nome}</span>
                        <span className="text-[9px] font-bold text-gray-300 flex items-center gap-1"><Clock size={10}/> {formatarDataSegura(reg.created_at)}</span>
                      </div>
                    </div>
                    <button onClick={() => iniciarEdicao(reg)} className="text-gray-200 group-hover:text-amber-500 transition-colors"><Edit size={18}/></button>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed font-medium text-left">{reg.descricao}</p>
                  {reg.arquivo_url && (
                    <a href={reg.arquivo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[10px] font-black text-[#1e3a8a] uppercase hover:underline bg-blue-50/50 p-2 rounded-lg">
                      <FileText size={14} /> Documento: {reg.arquivo_nome}
                    </a>
                  )}
                  {/* HISTÓRICO DE EDIÇÕES (RASTRO) */}
                  {reg.historico && reg.historico.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-100">
                      <details className="group">
                        <summary className="text-[9px] font-black text-amber-600 uppercase cursor-pointer hover:text-amber-700 flex items-center gap-2 list-none">
                          <AlertCircle size={12}/> Ver alterações anteriores ({reg.historico.length})
                        </summary>
                        <div className="mt-3 space-y-3 pl-2 border-l-2 border-amber-100">
                          {reg.historico.map((h: any, i: number) => (
                            <div key={i} className="bg-amber-50/30 p-3 rounded-xl text-left">
                              <div className="flex justify-between text-[9px] font-bold text-amber-700 uppercase mb-2">
                                <span>Por: {h.autor}</span>
                                <span>{formatarDataSegura(h.data)}</span>
                              </div>
                              <p className="text-xs text-gray-400 italic line-through">{h.texto}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL AGENDAMENTO (40 MIN INCLUSO) */}
        {isAgendamentoOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setIsAgendamentoOpen(false)}>
            <Card className="w-full max-w-md rounded-[2.5rem] bg-white overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="bg-[#1e3a8a] p-6 flex justify-between items-center text-white font-black uppercase text-xs tracking-widest">
                <span>Agendar para {paciente?.nome}</span>
                <button onClick={() => setIsAgendamentoOpen(false)}><X size={24}/></button>
              </div>
              <form onSubmit={handleSalvarAgendamento} className="p-8 space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Profissional</label>
                    <Select value={formAgendamento.profissional} onValueChange={(v) => setFormAgendamento({...formAgendamento, profissional: v})}>
                      <SelectTrigger className="h-11 text-xs font-bold uppercase border-gray-100 bg-gray-50 focus:ring-2 focus:ring-[#1e3a8a]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent className="z-[110]">
                        {equipe.map(p => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Sala</label>
                    <Select value={formAgendamento.sala} onValueChange={(v) => setFormAgendamento({...formAgendamento, sala: v})}>
                      <SelectTrigger className="h-11 text-xs font-bold uppercase border-gray-100 bg-gray-50 focus:ring-2 focus:ring-[#1e3a8a]"><SelectValue /></SelectTrigger>
                      <SelectContent className="z-[110]"><SelectItem value="1">Sala 01</SelectItem><SelectItem value="2">Sala 02</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Horário</label>
                    <input type="datetime-local" className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-[#1e3a8a]" value={formAgendamento.inicio} onChange={e => setFormAgendamento({...formAgendamento, inicio: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Duração</label>
                    <Select value={formAgendamento.duracao} onValueChange={(v) => setFormAgendamento({...formAgendamento, duracao: v})}>
                      <SelectTrigger className="h-11 text-xs font-bold uppercase border-gray-100 bg-gray-50 focus:ring-2 focus:ring-[#1e3a8a]"><SelectValue /></SelectTrigger>
                      <SelectContent className="z-[110]">
                        <SelectItem value="30">30 Min</SelectItem><SelectItem value="40">40 Min</SelectItem><SelectItem value="50">50 Min</SelectItem><SelectItem value="60">60 Min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={loadingAgendamento} className="w-full bg-[#1e3a8a] text-white font-black uppercase text-xs h-14 rounded-2xl shadow-xl transition-all">
                  {loadingAgendamento ? <RefreshCw className="animate-spin" /> : "Confirmar Agendamento"}
                </Button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}