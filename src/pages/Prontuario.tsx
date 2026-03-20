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
  const [meuPerfil, setMeuPerfil] = useState<any>(null); // CHAVES UNITÁRIAS
  
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
    if (!id || !meuPerfil?.permissao_auditoria) return;
    setLoadingLogs(true);
    const { data } = await supabase.from('logs_prontuario').select('*').eq('paciente_id', id).order('criado_em', { ascending: false }).limit(10);
    setLogs(data || []);
    setLoadingLogs(false);
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      if (!id) return;

      const { data: { user } } = await supabase.auth.getUser();
      const { data: todosPerfis } = await supabase.from('perfis').select('*').order('nome');
      
      if (user && todosPerfis) {
        const perfilLogado = todosPerfis.find(p => p.email?.toLowerCase().trim() === user.email?.toLowerCase().trim());
        setMeuPerfil(perfilLogado);
      }

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

      if (todosPerfis) {
        const filtrados = todosPerfis.filter(perfil => {
          const n = (perfil.nome || "").toLowerCase();
          const listaNegra = ['renata', 'instituto', 'secretaria', 'recepcao', 'admin', 'recepção'];
          return !listaNegra.some(termo => n.includes(termo));
        });
        setEquipeClinica(filtrados);
      }
    } catch (e) { toast.error("Erro ao carregar dados."); } finally { setLoading(false); }
  };

  useEffect(() => { carregarDados(); }, [id]);
  useEffect(() => { if (meuPerfil?.permissao_auditoria) carregarLogs(); }, [meuPerfil]);

  const handleSalvarDadosPaciente = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("pacientes").update({ anamnese: tempDados.anamnese, observacoes: tempDados.observacoes }).eq("id", id);
      if (error) throw error;
      await registrarLog("Editou Dados Clínicos", "Atualizou anamnese ou observações.");
      toast.success("Dados clínicos atualizados!");
      setIsEditPacienteOpen(false);
      carregarDados();
    } catch (err) { toast.error("Erro ao atualizar dados."); } finally { setLoading(false); }
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
        arquivoUrl = publicUrl; arquivoNome = arquivoSelecionado.name;
      }

      if (modoEdicao) {
        const registroOriginal = registros.find(r => r.id === modoEdicao);
        const versaoAntiga = { texto: registroOriginal.descricao, data: new Date().toISOString(), autor: registroOriginal.profissional_nome || "Desconhecido" };
        await supabase.from("prontuarios").update({
          descricao: novoRegistro.descricao, tipo_registro: novoRegistro.tipo, profissional_nome: nomeAutor,
          historico: [ ...(registroOriginal.historico || []), versaoAntiga ], arquivo_url: arquivoUrl || registroOriginal.arquivo_url,
          arquivo_nome: arquivoNome || registroOriginal.arquivo_nome, updated_at: new Date().toISOString()
        }).eq("id", modoEdicao);
        await registrarLog("Editou Registro", `Alterou ${novoRegistro.tipo}`);
      } else {
        await supabase.from("prontuarios").insert([{
          paciente_id: id, tipo_registro: novoRegistro.tipo, descricao: novoRegistro.descricao,
          profissional_nome: nomeAutor, historico: [], arquivo_url: arquivoUrl, arquivo_nome: arquivoNome
        }]);
        await registrarLog("Criou Registro", `Adicionou ${novoRegistro.tipo}`);
      }
      setNovoRegistro({ tipo: isSecretaria ? "Laudo" : "Sessão", descricao: "" });
      setArquivoSelecionado(null); setModoEdicao(null); carregarDados();
    } catch (error) { toast.error("Erro ao salvar."); } finally { setLoading(false); }
  };

  const handleSalvarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAgendamento.profissional) return toast.error("Selecione o profissional.");
    setLoadingAgendamento(true);
    try {
      const dInicio = new Date(formAgendamento.inicio);
      const dFim = addMinutes(dInicio, parseInt(formAgendamento.duracao));
      const { error } = await supabase.from('agendamentos').insert([{
        sala_id: parseInt(formAgendamento.sala), profissional_nome: formAgendamento.profissional,
        paciente_nome: paciente.nome, paciente_id: id, paciente_telefone: paciente.telefone,
        data_inicio: dInicio.toISOString(), data_fim: dFim.toISOString(),
        status: formAgendamento.status === 'Presença' ? 'Presenca' : formAgendamento.status,
        valor_atendimento: parseFloat(formAgendamento.valor_atendimento), forma_pagamento: formAgendamento.forma_pagamento
      }]);
      if (error) throw error;
      await registrarLog("Novo Agendamento", `Marcou consulta com ${formAgendamento.profissional}`);
      setIsAgendamentoOpen(false); toast.success("Agendado!"); carregarDados();
    } catch (err) { toast.error("Erro ao agendar."); } finally { setLoadingAgendamento(false); }
  };

  const iniciarEdicao = (reg: any) => {
    setModoEdicao(reg.id);
    setNovoRegistro({ tipo: reg.tipo_registro, descricao: reg.descricao });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && !paciente) return <div className="p-20 text-center font-black text-gray-400">Carregando Prontuário...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-10 font-sans text-left pb-20">
      
      {/* HEADER MOBILE FIXO */}
      <header className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-40 shadow-sm pt-[calc(env(safe-area-inset-top,0px)+12px)] min-h-[calc(70px+env(safe-area-inset-top,0px))] -m-2 mb-4 md:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/sistema/pacientes")} className="p-2 -ml-2 text-gray-400"><ArrowLeft size={24} /></button>
          <div className="text-left">
            <h1 className="text-sm font-black uppercase text-gray-800 leading-none truncate max-w-[150px]">{paciente?.nome}</h1>
            <p className="text-[9px] font-bold text-blue-600 uppercase mt-1 tracking-widest">Prontuário SerClin</p>
          </div>
        </div>
        <div className="flex gap-2">
           {meuPerfil?.permissao_agendar && <Button onClick={() => setIsAgendamentoOpen(true)} size="icon" className="bg-blue-600 rounded-xl h-10 w-10 shadow-md"><CalendarIcon size={18} /></Button>}
           {meuPerfil?.permissao_excluir && <Button onClick={async () => { if(confirm("Apagar paciente?")) { await registrarLog("Excluiu Paciente", "Remoção via Header Mobile"); supabase.from("pacientes").delete().eq("id", id).then(() => navigate("/sistema/pacientes")) } }} size="icon" variant="ghost" className="text-red-300 h-10 w-10"><Trash2 size={18} /></Button>}
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
        {/* HEADER DESKTOP */}
        <div className="hidden md:flex justify-between items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/sistema/pacientes")} className="gap-2 text-gray-500 font-black uppercase text-xs">
            <ArrowLeft size={18} /> Voltar
          </Button>
          <div className="flex gap-2">
            {meuPerfil?.permissao_excluir && (
               <Button onClick={async () => { if(confirm("Apagar tudo?")) { await registrarLog("Excluiu Paciente", "Removeu prontuário completo"); supabase.from("pacientes").delete().eq("id", id).then(() => navigate("/sistema/pacientes")) } }} variant="ghost" className="text-red-400 hover:text-red-600 font-black uppercase text-[10px] gap-2">
                <Trash2 size={14} /> Excluir Tudo
              </Button>
            )}
            {meuPerfil?.permissao_agendar && (
              <Button onClick={() => setIsAgendamentoOpen(true)} className="bg-[#1e3a8a] text-white font-black uppercase text-[10px] px-6 rounded-full h-10 shadow-md">
                <CalendarIcon size={14} className="mr-2" /> Agendar
              </Button>
            )}
          </div>
        </div>

        {/* CARD INFORMATIVO */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 md:gap-8 items-center">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-50 rounded-2xl md:rounded-3xl flex items-center justify-center text-[#1e3a8a] shadow-inner overflow-hidden border-2 border-white shrink-0">
            {paciente?.foto_url ? <img src={paciente.foto_url} className="w-full h-full object-cover" alt="Foto" /> : <User size={30} />}
          </div>
          <div className="flex-1 text-center md:text-left min-w-0 w-full">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h1 className="text-xl md:text-2xl font-black text-gray-800 uppercase leading-tight truncate">{paciente?.nome}</h1>
              <button onClick={() => setIsEditPacienteOpen(true)} className="text-gray-300 hover:text-blue-600 shrink-0"><Edit size={16}/></button>
            </div>
            <p className="text-xs md:text-sm font-bold text-gray-400 mt-1 truncate">{paciente?.telefone} | {paciente?.convenio}</p>
          </div>
          <div className="flex gap-2 md:gap-3 text-center w-full md:w-auto justify-center">
            <div className="bg-green-50 px-3 md:px-5 py-2 rounded-xl md:rounded-2xl border border-green-100 flex-1 md:flex-none"><p className="text-lg md:text-xl font-black text-green-600">{resumoPresenca.presencas}</p><p className="text-[7px] md:text-[8px] font-black uppercase text-green-400 tracking-tighter">Presenças</p></div>
            <div className="bg-red-50 px-3 md:px-5 py-2 rounded-xl md:rounded-2xl border border-red-100 flex-1 md:flex-none"><p className="text-lg md:text-xl font-black text-red-600">{resumoPresenca.faltas}</p><p className="text-[7px] md:text-[8px] font-black uppercase text-red-400 tracking-tighter">Faltas</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 text-left">
          {/* COLUNA ESQUERDA: DADOS E AUDITORIA */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-sm rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-white">
              <div className="bg-blue-50 px-5 md:px-6 py-3 md:py-4 flex justify-between items-center border-b border-blue-100">
                <h3 className="font-black text-[#1e3a8a] uppercase text-[9px] md:text-[10px] flex items-center gap-2"><ClipboardList size={18}/> Dados Clínicos</h3>
                <button onClick={() => setIsEditPacienteOpen(true)} className="text-blue-600"><FileEdit size={18}/></button>
              </div>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="text-left"><label className="text-[9px] font-black text-gray-400 uppercase">Anamnese</label><p className="text-xs text-gray-800 mt-1 italic leading-relaxed">{paciente?.anamnese || "Não informada."}</p></div>
                <div className="pt-2 border-t border-gray-50 text-left"><label className="text-[9px] font-black text-gray-400 uppercase">Observações</label><p className="text-xs text-gray-800 mt-1 leading-relaxed">{paciente?.observacoes || "Nenhuma."}</p></div>
              </CardContent>
            </Card>

            {meuPerfil?.permissao_auditoria && (
              <Card className="border-none shadow-sm rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-white">
                <div className="bg-gray-50 px-5 md:px-6 py-3 md:py-4 border-b flex items-center gap-2">
                  <History size={16} className="text-gray-400" />
                  <h3 className="font-black text-gray-500 uppercase text-[9px] md:text-[10px]">Auditoria</h3>
                </div>
                <CardContent className="p-4 md:p-6 space-y-3 max-h-[250px] overflow-y-auto">
                  {loadingLogs ? <p className="text-[9px] font-bold text-gray-300">SINCRO...</p> : 
                   logs.map(log => (
                     <div key={log.id} className="border-l-2 border-blue-100 pl-3 py-1">
                       <p className="text-[9px] font-black text-gray-700 uppercase leading-tight">{log.acao}</p>
                       <p className="text-[8px] font-bold text-gray-400 mt-0.5">{log.profissional_nome?.split(' ')[0]} • {format(new Date(log.criado_em), "dd/MM HH:mm")}</p>
                     </div>
                   ))}
                </CardContent>
              </Card>
            )}

            <Card className={`border-none shadow-lg rounded-[1.5rem] md:rounded-[2rem] overflow-hidden ${modoEdicao ? 'ring-4 ring-amber-400' : ''}`}>
              <div className={`${modoEdicao ? 'bg-amber-500' : 'bg-[#1e3a8a]'} px-5 md:px-6 py-3 md:py-4 text-white font-black uppercase text-[9px] md:text-[10px] flex justify-between items-center`}>
                <span>{modoEdicao ? 'Editando Registro' : 'Novo Registro'}</span>
                {modoEdicao && <X size={16} className="cursor-pointer" onClick={() => setModoEdicao(null)} />}
              </div>
              <CardContent className="p-4 md:p-6 space-y-4">
                <select className="w-full rounded-xl border-none bg-gray-50 px-4 py-3 text-xs font-bold uppercase outline-none" value={novoRegistro.tipo} onChange={e => setNovoRegistro({...novoRegistro, tipo: e.target.value})}><option value="Sessão">Sessão</option><option value="Laudo">Laudo / PDF</option><option value="Avaliação">Avaliação</option></select>
                <textarea className="w-full rounded-xl border-none bg-gray-50 px-4 py-3 text-sm min-h-[120px] md:min-h-[180px] outline-none resize-none" placeholder="Relato clínico..." value={novoRegistro.descricao} onChange={e => setNovoRegistro({...novoRegistro, descricao: e.target.value})} />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full border-dashed border-2 text-[9px] md:text-[10px] font-black uppercase h-11 md:h-12"><Paperclip size={16} className="mr-2" /> {arquivoSelecionado ? arquivoSelecionado.name : "Anexar PDF"}</Button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setArquivoSelecionado(e.target.files?.[0] || null)} />
                <Button onClick={handleSalvarRegistro} className={`w-full text-white font-black uppercase text-xs h-11 md:h-12 rounded-xl shadow-lg ${modoEdicao ? 'bg-amber-600' : 'bg-[#1e3a8a]'}`}><Save size={18} className="mr-2"/> {modoEdicao ? 'Atualizar' : 'Salvar'}</Button>
              </CardContent>
            </Card>
          </div>

          {/* LISTA DE REGISTROS */}
          <div className="lg:col-span-2 space-y-4 text-left">
            {registros.length === 0 ? <div className="bg-white p-12 rounded-[1.5rem] md:rounded-[2rem] border border-dashed border-gray-200 text-center"><p className="text-gray-400 font-bold uppercase text-xs">Nenhum registro.</p></div> :
            registros.map((reg) => (
              <div key={reg.id} className="bg-white p-4 md:p-6 pl-6 md:pl-8 rounded-[1.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2.5" style={{ backgroundColor: getCorProfissional(reg.profissional_nome) }} />
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="text-[8px] md:text-[9px] font-black uppercase px-2 py-0.5 md:py-1 bg-blue-50 text-[#1e3a8a] rounded-md">{reg.tipo_registro}</span>
                    <span className="text-[9px] md:text-[11px] font-black text-gray-800 uppercase truncate max-w-[120px] md:max-w-none">{reg.profissional_nome}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {meuPerfil?.permissao_excluir && <button onClick={async () => { if(confirm("Apagar registro?")) { await registrarLog("Apagou Registro", `Removeu ${reg.tipo_registro}`); supabase.from("prontuarios").delete().eq("id", reg.id).then(carregarDados) } }} className="text-gray-200 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>}
                    <button onClick={() => iniciarEdicao(reg)} className="text-gray-300 hover:text-amber-500 transition-colors"><Edit size={16}/></button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap mt-3 leading-relaxed">{reg.descricao}</p>
                {reg.arquivo_url && <a href={reg.arquivo_url} target="_blank" className="inline-flex items-center gap-2 text-[9px] md:text-[10px] font-black text-[#1e3a8a] uppercase mt-4 hover:underline"><FileText size={14} /> Ver Documento</a>}
                {meuPerfil?.permissao_auditoria && reg.historico && reg.historico.length > 0 && (
                  <details className="mt-4">
                    <summary className="text-[8px] md:text-[9px] font-black text-amber-600 uppercase cursor-pointer flex items-center gap-1"><AlertCircle size={12}/> Auditoria ({reg.historico.length})</summary>
                    <div className="mt-2 space-y-2 border-l-2 border-amber-50 pl-3">
                      {reg.historico.map((h:any, i:number) => (
                        <div key={i} className="text-[9px] text-gray-400 italic leading-tight"><strong>{h.autor?.split(' ')[0]}</strong> em {formatarDataSegura(h.data)}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* MODAIS */}
        {isEditPacienteOpen && (
          <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-2 md:p-4 backdrop-blur-sm">
            <Card className="w-full max-w-[500px] h-full md:h-auto rounded-[1.5rem] md:rounded-[2.5rem] bg-white flex flex-col p-4 md:p-8 shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center mb-6"><h3 className="font-black text-[#1e3a8a] uppercase text-xs tracking-widest text-left">Informações Clínicas</h3><button onClick={() => setIsEditPacienteOpen(false)} className="p-2"><X size={24}/></button></div>
              <div className="space-y-4 flex-1 overflow-y-auto">
                <textarea value={tempDados.anamnese} onChange={e => setTempDados({...tempDados, anamnese: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm h-40 outline-none resize-none" placeholder="Anamnese..." />
                <textarea value={tempDados.observacoes} onChange={e => setTempDados({...tempDados, observacoes: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm h-32 outline-none resize-none" placeholder="Observações..." />
                <Button onClick={handleSalvarDadosPaciente} disabled={loading} className="w-full bg-[#1e3a8a] hover:bg-black text-white font-black h-14 rounded-2xl uppercase text-xs mt-4">Salvar Dados</Button>
              </div>
            </Card>
          </div>
        )}

        {isAgendamentoOpen && (
          <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-2 md:p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setIsAgendamentoOpen(false)}>
            <Card className="w-full max-w-[420px] h-full md:h-auto rounded-[1.5rem] md:rounded-[2.5rem] bg-white shadow-2xl overflow-hidden flex flex-col">
              <div className="bg-[#1e3a8a] p-4 md:p-5 flex justify-between items-center shrink-0 text-white"><h3 className="font-black uppercase text-[10px] md:text-[11px]">Agendar Consulta</h3><button onClick={() => setIsAgendamentoOpen(false)} className="text-white p-2"><X size={22}/></button></div>
              <form onSubmit={handleSalvarAgendamento} className="p-4 md:p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <Select value={formAgendamento.status} onValueChange={(v) => setFormAgendamento({...formAgendamento, status: v})}><SelectTrigger className="bg-blue-50 font-bold text-blue-700 h-10 uppercase text-[9px] md:text-[10px] rounded-xl"><SelectValue /></SelectTrigger><SelectContent className="z-[1000]"><SelectItem value="Agendado">Agendado</SelectItem><SelectItem value="Presença">Presença</SelectItem></SelectContent></Select>
                  <Select value={formAgendamento.forma_pagamento} onValueChange={(v) => setFormAgendamento({...formAgendamento, forma_pagamento: v})}><SelectTrigger className="bg-emerald-50 font-bold text-emerald-700 h-10 text-[9px] md:text-[10px] uppercase rounded-xl"><SelectValue /></SelectTrigger><SelectContent className="z-[1000]"><SelectItem value="Pix">Pix</SelectItem><SelectItem value="Dinheiro">Dinheiro</SelectItem></SelectContent></Select>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <Input type="number" step="0.01" value={formAgendamento.valor_atendimento} onChange={e => setFormAgendamento({...formAgendamento, valor_atendimento: e.target.value})} className="bg-gray-50 h-10 font-bold text-sm rounded-xl" />
                  <Select value={formAgendamento.duracao} onValueChange={(v) => setFormAgendamento({...formAgendamento, duracao: v})}><SelectTrigger className="bg-gray-50 h-10 font-bold text-sm rounded-xl"><SelectValue /></SelectTrigger><SelectContent className="z-[1000]"><SelectItem value="30">30 Min</SelectItem><SelectItem value="40">40 Min</SelectItem><SelectItem value="60">60 Min</SelectItem></SelectContent></Select>
                </div>
                <Select value={formAgendamento.profissional} onValueChange={(v) => setFormAgendamento({...formAgendamento, profissional: v})} required><SelectTrigger className="bg-gray-50 h-10 font-bold text-sm uppercase rounded-xl"><SelectValue placeholder="Selecionar..." /></SelectTrigger><SelectContent className="z-[1000] text-left">{equipeClinica.map(p => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>)}</SelectContent></Select>
                <input type="datetime-local" className="w-full h-11 bg-gray-50 rounded-xl px-4 text-xs font-bold outline-none border-none" value={formAgendamento.inicio} onChange={e => setFormAgendamento({...formAgendamento, inicio: e.target.value})} />
                <Button type="submit" disabled={loadingAgendamento} className="w-full bg-[#1e3a8a] text-white font-black uppercase h-14 rounded-2xl shadow-xl mt-2">Confirmar</Button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}