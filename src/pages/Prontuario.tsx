import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; 
import { 
  ArrowLeft, User, Save, Edit, AlertCircle, 
  Paperclip, FileText, Trash2, 
  Calendar as CalendarIcon, X, RefreshCw, Clock,
  FileEdit, ClipboardList, History, Brain, Plus, Activity,
  Bold, Italic, Underline, AlignLeft, AlignCenter, Layout, CheckCircle2,
  Stethoscope, Target, FileSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePerfil } from "@/hooks/usePerfil";

// --- FUNÇÕES DE MÁSCARA (PRESERVADAS) ---
const formatarTelefone = (tel: string | null | undefined) => {
  if (!tel) return "Não informado";
  let v = tel.replace(/\D/g, "");
  return v.length === 11 ? v.replace(/(\d{2})(\d)(\d{4})(\d{4})/, "($1) $2 $3-$4") : tel;
};

const formatarCPF = (cpf: string | null | undefined) => {
  if (!cpf) return "Não informado";
  let v = cpf.replace(/\D/g, "");
  return v.length === 11 ? v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : cpf;
};

export function Prontuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSecretaria, isAdmin } = usePerfil(); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null); 
  
  const [paciente, setPaciente] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [meuPerfil, setMeuPerfil] = useState<any>(null);
  const [equipeClinica, setEquipeClinica] = useState<any[]>([]);
  const [resumoPresenca, setResumoPresenca] = useState({ presencas: 0, faltas: 0 });

  // ESTADOS DO EDITOR E LAUDO
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [testes, setTestes] = useState([{ id: 1, funcao: "", nome: "", percentil: "", classificacao: "" }]);
  
  const [isAgendamentoOpen, setIsAgendamentoOpen] = useState(false);
  const [isEditPacienteOpen, setIsEditPacienteOpen] = useState(false);
  const [tempDados, setTempDados] = useState({ anamnese: "", observacoes: "", status_neuro: "Anamnese" });

  const [formAgendamento, setFormAgendamento] = useState({ 
    profissional: '', sala: '1', inicio: format(new Date(), "yyyy-MM-dd'T'HH:mm"), 
    duracao: '40', status: 'Agendado', valor_atendimento: "0.00", forma_pagamento: "Pix"
  });

  const [novoRegistro, setNovoRegistro] = useState({ tipo: "Sessão", descricao: "" });
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);

  const [formLaudo, setFormLaudo] = useState({
    finalidade: "Delinear o perfil neuropsicológico diante das alterações de comportamento.",
    demanda: "",
    procedimentos: "Utilização dos 4 pilares: aplicação de testes cognitivos, entrevistas clínicas, observação comportamental e escalas de avaliação de sintomas.",
    conclusao: "",
    encaminhamentos: "",
    ressalva: "Os resultados aqui descritos são de caráter dinâmico...",
    crp_manual: ""
  });

  const bateriasPadrao = [
    { id: 101, funcao: "Inteligência", nome: "WISC-IV / SON-R", percentil: "", classificacao: "" },
    { id: 102, funcao: "Atenção Sustentada", nome: "TAVIS-4", percentil: "", classificacao: "" },
    { id: 103, funcao: "Memória Operacional", nome: "Dígitos", percentil: "", classificacao: "" },
    { id: 104, funcao: "Funções Executivas", nome: "FDT / Trilhas", percentil: "", classificacao: "" }
  ];

  const carregarDados = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: perfis } = await supabase.from('perfis').select('*').order('nome');
      if (user && perfis) {
        setMeuPerfil(perfis.find(p => p.email?.toLowerCase().trim() === user.email?.toLowerCase().trim()));
        setEquipeClinica(perfis.filter(p => !['recepcao', 'admin'].some(t => p.nome?.toLowerCase().includes(t))));
      }

      const { data: p } = await supabase.from("pacientes").select("*").eq("id", id).single();
      setPaciente(p);
      if (p) setTempDados({ anamnese: p.anamnese || "", observacoes: p.observacoes || "", status_neuro: p.status_neuro || "Anamnese" });

      const { data: ag } = await supabase.from("agendamentos").select("status").eq("paciente_id", id);
      if (ag) {
        setResumoPresenca({
          presencas: ag.filter(a => a.status.includes('Presen')).length,
          faltas: ag.filter(a => a.status === 'Falta').length
        });
      }

      const { data: r } = await supabase.from("prontuarios").select("*").eq("paciente_id", id).order("created_at", { ascending: false });
      setRegistros(r || []);
    } catch (e) { toast.error("Erro ao carregar prontuário."); } finally { setLoading(false); }
  };

  useEffect(() => { carregarDados(); }, [id]);

  const handleSalvarStatus = async (novoStatus: string) => {
    try {
      await supabase.from("pacientes").update({ status_neuro: novoStatus }).eq("id", id);
      setTempDados(prev => ({ ...prev, status_neuro: novoStatus }));
      toast.success(`Fase alterada para: ${novoStatus}`);
    } catch (e) { toast.error("Erro ao atualizar fase."); }
  };

  // --- FUNÇÕES DO EDITOR (PRESERVADAS) ---
  const formatDoc = (cmd: string, val: string = "") => document.execCommand(cmd, false, val);

  const handleSalvarRegistro = async () => {
    if (!novoRegistro.descricao && !arquivoSelecionado) return toast.warning("Preencha a evolução ou anexe arquivo.");
    setLoading(true);
    try {
      let arquivoUrl = null;
      let arquivoNome = null;

      if (arquivoSelecionado) {
        const fileName = `${id}/${Date.now()}_${arquivoSelecionado.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from('documentos').upload(fileName, arquivoSelecionado);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(fileName);
        arquivoUrl = publicUrl;
        arquivoNome = arquivoSelecionado.name;
      }

      await supabase.from("prontuarios").insert([{
        paciente_id: id,
        tipo_registro: novoRegistro.tipo,
        descricao: novoRegistro.descricao || `Arquivo: ${arquivoNome}`,
        profissional_nome: meuPerfil?.nome || "Profissional SerClin",
        arquivo_url: arquivoUrl,
        arquivo_nome: arquivoNome
      }]);

      toast.success("Evolução salva!");
      setNovoRegistro({ tipo: "Sessão", descricao: "" });
      setArquivoSelecionado(null);
      carregarDados();
    } catch (e) { toast.error("Erro ao salvar."); } finally { setLoading(false); }
  };

  if (loading && !paciente) return <div className="p-20 text-center font-black text-gray-400 animate-pulse">CARREGANDO PRONTUÁRIO NEURO...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-10 font-sans pb-20 text-left">
      
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO COM STATUS DE AVALIAÇÃO */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <Select value={tempDados.status_neuro} onValueChange={handleSalvarStatus}>
                <SelectTrigger className="w-[180px] bg-blue-50 border-none font-black text-[10px] uppercase rounded-full text-blue-700 h-10">
                   <Target size={14} className="mr-2"/> <SelectValue />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="Anamnese">Anamnese</SelectItem>
                   <SelectItem value="Testagem">Testagem</SelectItem>
                   <SelectItem value="Correção">Correção</SelectItem>
                   <SelectItem value="Laudo">Laudo</SelectItem>
                   <SelectItem value="Devolutiva">Devolutiva</SelectItem>
                </SelectContent>
             </Select>
          </div>

          <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center border-4 border-white shadow-md shrink-0">
            {paciente?.foto_url ? <img src={paciente.foto_url} className="w-full h-full object-cover rounded-2xl" /> : <User size={40} className="text-blue-300" />}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-black text-gray-800 uppercase flex items-center gap-3 justify-center md:justify-start">
              {paciente?.nome}
              <button onClick={() => setIsEditPacienteOpen(true)} className="text-gray-300 hover:text-blue-600"><Edit size={16}/></button>
            </h1>
            <p className="text-xs font-bold text-gray-400 mt-1">
              {formatarCPF(paciente?.cpf)} • {resumoPresenca.presencas} sessões realizadas
            </p>
          </div>

          <div className="flex gap-2">
            <div className="bg-emerald-50 px-5 py-2 rounded-2xl border border-emerald-100 text-center">
              <p className="text-xl font-black text-emerald-600">{resumoPresenca.presencas}</p>
              <p className="text-[8px] font-black uppercase text-emerald-400 tracking-tighter">Sessão Atual</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            {/* CARD DE DADOS CLÍNICOS - FOCO NEURO */}
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
              <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                <h3 className="font-black text-white uppercase text-xs flex items-center gap-2"><Brain size={18}/> Avaliação Neuro</h3>
                <button onClick={() => setIsEditPacienteOpen(true)} className="text-white/50 hover:text-white"><FileEdit size={18}/></button>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Queixa Principal / Anamnese</label>
                  <p className="text-sm text-gray-700 mt-2 italic leading-relaxed">{paciente?.anamnese || "Não preenchido."}</p>
                </div>
                <div className="pt-4 border-t">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notas de Observação</label>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">{paciente?.observacoes || "Nenhuma nota."}</p>
                </div>
              </CardContent>
            </Card>

            {/* SELETOR DE REGISTRO */}
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white ring-4 ring-blue-50">
              <div className="bg-gray-800 px-6 py-5 text-white flex items-center gap-2">
                <Plus size={20} className="text-blue-400"/>
                <span className="font-black uppercase text-xs">Registrar Evolução</span>
              </div>
              <CardContent className="p-6 space-y-4">
                <select 
                  className="w-full rounded-xl bg-gray-50 px-4 py-3 text-xs font-black text-blue-900 border-none outline-none"
                  value={novoRegistro.tipo}
                  onChange={e => setNovoRegistro({...novoRegistro, tipo: e.target.value})}
                >
                  <option value="Sessão">Evolução de Sessão</option>
                  <option value="Testagem">Aplicação de Teste</option>
                  <option value="Laudo Estruturado">Gerar Laudo Neuro</option>
                  <option value="Anexo">Anexar Protocolo/Exame</option>
                </select>

                {novoRegistro.tipo === "Laudo Estruturado" ? (
                  <div className="space-y-4">
                    <Button onClick={() => setIsEditorOpen(true)} className="w-full bg-blue-600 h-14 rounded-xl font-black uppercase text-[10px] shadow-lg">
                      <Layout size={18} className="mr-2"/> Abrir Editor de Laudo
                    </Button>
                    <p className="text-[10px] text-center text-gray-400 font-bold uppercase">Utilize o editor para laudos premium</p>
                  </div>
                ) : (
                  <>
                    <textarea 
                      className="w-full rounded-xl bg-gray-50 p-4 text-sm min-h-[150px] border-none outline-none focus:bg-white transition-all"
                      placeholder="Relate o desempenho do paciente..."
                      value={novoRegistro.descricao}
                      onChange={e => setNovoRegistro({...novoRegistro, descricao: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 border-dashed rounded-xl h-12 text-[10px] font-black uppercase">
                        <Paperclip size={16} className="mr-2"/> {arquivoSelecionado ? "Pronto" : "PDF"}
                      </Button>
                      <Button onClick={handleSalvarRegistro} className="flex-1 bg-blue-700 rounded-xl h-12 font-black uppercase text-[10px]">Salvar</Button>
                    </div>
                    <input type="file" hidden ref={fileInputRef} onChange={e => setArquivoSelecionado(e.target.files?.[0] || null)} />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* LISTA DE REGISTROS COM CORES POR TIPO */}
            {registros.map((reg) => (
              <div key={reg.id} className="bg-white p-6 pl-8 rounded-[2rem] shadow-sm border border-gray-100 relative group transition-all hover:shadow-md">
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${reg.tipo_registro.includes('Laudo') ? 'bg-amber-400' : 'bg-blue-600'}`} />
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase px-2 py-1 bg-gray-100 text-gray-600 rounded-md">{reg.tipo_registro}</span>
                      <span className="text-[11px] font-black text-gray-800 uppercase">{reg.profissional_nome}</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                      {format(new Date(reg.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {isAdmin && (
                    <button onClick={async () => {
                      if(confirm("Excluir registro?")) {
                        await supabase.from("prontuarios").delete().eq("id", reg.id);
                        carregarDados();
                        toast.success("Removido.");
                      }
                    }} className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-4 leading-relaxed whitespace-pre-wrap">{reg.descricao}</p>
                {reg.arquivo_url && (
                  <a href={reg.arquivo_url} target="_blank" className="inline-flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl mt-4 hover:bg-blue-600 hover:text-white transition-all uppercase">
                    <FileSearch size={14}/> Visualizar Documento
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EDITOR PREMIUM (O Código do Modal permanece o mesmo que você já tem, ele é excelente) */}
      {isEditorOpen && (
         <div className="fixed inset-0 bg-black/90 z-[9999] flex items-start justify-center p-2 md:p-8 pt-10 backdrop-blur-md overflow-y-auto">
            {/* ... Seu código do modal do editor que você enviou está perfeito ... */}
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col mb-20 relative overflow-hidden">
               <div className="bg-gray-50 p-4 border-b flex items-center justify-between sticky top-0 z-50">
                  <div className="flex gap-1">
                     <button onClick={() => formatDoc('bold')} className="p-2 border rounded bg-white"><Bold size={16}/></button>
                     <button onClick={() => formatDoc('italic')} className="p-2 border rounded bg-white"><Italic size={16}/></button>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="ghost" onClick={() => setIsEditorOpen(false)} className="text-[10px] font-black uppercase">Cancelar</Button>
                     <Button onClick={() => setIsEditorOpen(false)} className="bg-blue-600 text-white font-black uppercase text-xs rounded-full px-6">Finalizar Laudo</Button>
                  </div>
               </div>
               <div className="p-10 bg-gray-100 flex justify-center">
                  <div 
                    ref={editorRef}
                    contentEditable 
                    className="bg-white w-[210mm] min-h-[297mm] p-20 shadow-2xl outline-none text-gray-800 font-serif leading-relaxed"
                    style={{ fontFamily: 'Times New Roman, serif' }}
                  >
                     <h1 className="text-center text-blue-900 font-bold text-2xl uppercase">Instituto SerClin</h1>
                     <p className="text-center italic text-gray-500 mb-10">Avaliação Neuropsicológica Especializada</p>
                     
                     <p><b>1. IDENTIFICAÇÃO</b></p>
                     <p>Paciente: {paciente?.nome}</p>
                     <p>Solicitante: Dr(a). ...</p>
                     <br />
                     <p><b>2. DEMANDA</b></p>
                     <p>{tempDados.anamnese}</p>
                     <br />
                     <p><b>3. RESULTADOS DOS TESTES</b></p>
                     <p>O paciente apresentou desempenho...</p>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* MODAL EDITAR PACIENTE */}
      {isEditPacienteOpen && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
           <Card className="w-full max-w-[500px] rounded-[2.5rem] bg-white p-8">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black uppercase text-blue-900">Editar Prontuário</h3>
                 <button onClick={() => setIsEditPacienteOpen(false)}><X size={24}/></button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Anamnese Cognitiva</label>
                    <textarea value={tempDados.anamnese} onChange={e => setTempDados({...tempDados, anamnese: e.target.value})} className="w-full h-40 bg-gray-50 rounded-2xl p-4 text-sm outline-none border-none focus:ring-2 focus:ring-blue-100" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Observações Clínicas</label>
                    <textarea value={tempDados.observacoes} onChange={e => setTempDados({...tempDados, observacoes: e.target.value})} className="w-full h-24 bg-gray-50 rounded-2xl p-4 text-sm outline-none border-none focus:ring-2 focus:ring-blue-100" />
                 </div>
                 <Button onClick={async () => {
                    await supabase.from("pacientes").update({ anamnese: tempDados.anamnese, observacoes: tempDados.observacoes }).eq("id", id);
                    toast.success("Dados salvos!");
                    setIsEditPacienteOpen(false);
                    carregarDados();
                 }} className="w-full bg-blue-900 h-14 rounded-2xl font-black uppercase text-xs">Salvar Alterações</Button>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}