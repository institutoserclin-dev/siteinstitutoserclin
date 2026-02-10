import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  ArrowLeft, User, Save, History, FilePlus, Edit, AlertCircle, 
  Clock, Paperclip, FileText, Download, Shield, MessageCircle, 
  CheckCircle, XCircle, Trash2 // <-- Adicionado Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePerfil } from "@/hooks/usePerfil";

const formatarDataSegura = (data: string | null | undefined) => {
  if (!data) return "Data desconhecida";
  try { return format(new Date(data), "dd/MM/yyyy HH:mm", { locale: ptBR }); } catch (e) { return "Data inválida"; }
};

export function Prontuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSecretaria, isAdmin } = usePerfil(); // <-- Adicionado isAdmin
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [paciente, setPaciente] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumoPresenca, setResumoPresenca] = useState({ presencas: 0, faltas: 0 });
  const [modoEdicao, setModoEdicao] = useState<string | null>(null);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [novoRegistro, setNovoRegistro] = useState({ tipo: "Sessão", descricao: "" });

  const carregarDados = async () => {
    try {
      setLoading(true);
      const { data: p } = await supabase.from("pacientes").select("*").eq("id", id).single();
      setPaciente(p);
      const { data: r } = await supabase.from("prontuarios").select("*").eq("paciente_id", id).order("created_at", { ascending: false });
      setRegistros(r || []);
      if (p) {
        const { data: ag } = await supabase.from("agendamentos").select("status").eq("paciente_nome", p.nome);
        if (ag) {
          setResumoPresenca({
            presencas: ag.filter(a => a.status === 'Presença').length,
            faltas: ag.filter(a => a.status === 'Falta').length
          });
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { carregarDados(); }, [id]);

  // --- NOVA FUNÇÃO DE EXCLUSÃO ---
  const handleExcluirRegistro = async (registroId: string) => {
    if (!confirm("Deseja apagar este registro permanentemente? Esta ação não pode ser desfeita.")) return;
    
    try {
      const { error } = await supabase
        .from("prontuarios")
        .delete()
        .eq("id", registroId);

      if (error) throw error;

      toast.success("Registro removido!");
      carregarDados(); // Recarrega a lista
    } catch (error: any) {
      toast.error("Erro ao excluir registro.");
    }
  };

  const abrirWhatsApp = () => {
    if (!paciente?.telefone) return toast.error("Telefone não encontrado.");
    const numeroLimpo = paciente.telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${numeroLimpo}`, "_blank");
  };

  const handleSalvarRegistro = async () => {
    if (!novoRegistro.descricao) return toast.warning("Escreva algo na descrição.");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let nomeProfissional = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email || "Profissional";
      if (user?.email === 'romulochaves77@gmail.com') {
        nomeProfissional = "Rômulo Chaves da Silva";
      }

      const emailProfissional = user?.email || "";
      let arquivoUrl: string | null = null;
      let arquivoNome: string | null = null;

      if (arquivoSelecionado) {
        const fileExt = arquivoSelecionado.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${id}/${fileName}`; 
        const { error: uploadError } = await supabase.storage.from('documentos').upload(filePath, arquivoSelecionado);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(filePath);
        arquivoUrl = publicUrl;
        arquivoNome = arquivoSelecionado.name;
      }

      if (modoEdicao) {
        const registroOriginal = registros.find(r => r.id === modoEdicao);
        if (!registroOriginal) return;
        const finalUrl = arquivoUrl || registroOriginal.arquivo_url;
        const finalNome = arquivoNome || registroOriginal.arquivo_nome;
        const versaoAntiga = {
          texto: registroOriginal.descricao,
          data: new Date().toISOString(),
          autor: registroOriginal.profissional_nome || "Desconhecido",
          arquivo: registroOriginal.arquivo_nome
        };
        const historicoAntigo = Array.isArray(registroOriginal.historico) ? registroOriginal.historico : [];
        const historicoAtualizado = [ ...historicoAntigo, versaoAntiga ];

        await supabase.from("prontuarios").update({
          descricao: novoRegistro.descricao,
          updated_at: new Date().toISOString(),
          profissional_nome: nomeProfissional,
          profissional_email: emailProfissional,
          historico: historicoAtualizado,
          arquivo_url: finalUrl,
          arquivo_nome: finalNome
        }).eq("id", modoEdicao);
        toast.success("Atualizado!");
      } else {
        await supabase.from("prontuarios").insert([{
          paciente_id: id,
          tipo_registro: novoRegistro.tipo,
          descricao: novoRegistro.descricao,
          profissional_nome: nomeProfissional,
          profissional_email: emailProfissional,
          historico: [],
          arquivo_url: arquivoUrl,
          arquivo_nome: arquivoNome
        }]);
        toast.success("Salvo!");
      }
      setNovoRegistro({ tipo: "Sessão", descricao: "" });
      setArquivoSelecionado(null);
      setModoEdicao(null);
      carregarDados();
    } catch (error: any) { toast.error("Erro ao salvar."); }
  };

  const iniciarEdicao = (reg: any) => {
    setModoEdicao(reg.id);
    setNovoRegistro({ tipo: reg.tipo_registro, descricao: reg.descricao });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputClass = "flex w-full rounded-xl border border-gray-300 bg-white px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium";
  
  if (loading) return <div className="p-20 text-center font-black uppercase text-gray-400 tracking-widest animate-pulse">Carregando Prontuário...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans text-left">
      <div className="max-w-6xl mx-auto space-y-10">
        <Button variant="ghost" onClick={() => navigate("/sistema/pacientes")} className="gap-2 pl-0 text-gray-500 font-black uppercase text-sm hover:bg-transparent hover:text-blue-600">
          <ArrowLeft size={22} /> Voltar
        </Button>

        {/* Cabeçalho do Paciente... */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-md border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
          <div className="bg-blue-100 p-1 rounded-3xl shrink-0 shadow-inner">
             {paciente?.foto_url ? (
                <img src={paciente.foto_url} className="w-28 h-28 rounded-[1.4rem] object-cover border-4 border-white shadow-sm" />
              ) : (
                <div className="w-28 h-28 flex items-center justify-center text-blue-600"><User size={50} /></div>
              )}
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-4">
            <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight uppercase leading-none">{paciente?.nome}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-5 items-center">
              <span className="text-xs font-black px-4 py-1.5 bg-blue-600 text-white rounded-lg uppercase tracking-widest">
                {paciente?.convenio || "Particular"}
              </span>
              {paciente?.telefone && (
                <button onClick={abrirWhatsApp} className="group flex items-center gap-3 bg-green-50 hover:bg-green-600 hover:text-white border border-green-200 px-6 py-2.5 rounded-full transition-all shadow-sm">
                  <MessageCircle size={20} className="text-green-600 group-hover:text-white fill-current" />
                  <span className="text-base font-bold tracking-widest font-mono">{paciente.telefone}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-4 shrink-0">
            <div className="bg-white border-2 border-green-100 p-5 rounded-[1.5rem] text-center min-w-[110px] shadow-sm">
              <div className="text-green-600 font-black text-3xl flex items-center justify-center gap-2">
                <CheckCircle size={24}/> {resumoPresenca.presencas}
              </div>
              <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mt-1">Presenças</p>
            </div>
            <div className="bg-white border-2 border-red-100 p-5 rounded-[1.5rem] text-center min-w-[110px] shadow-sm">
              <div className="text-red-600 font-black text-3xl flex items-center justify-center gap-2">
                <XCircle size={24}/> {resumoPresenca.faltas}
              </div>
              <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-1">Faltas</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {!isSecretaria && (
            <div className="lg:col-span-1 space-y-6">
              <Card className={`border-none shadow-xl rounded-[2rem] overflow-hidden ${modoEdicao ? 'ring-4 ring-yellow-400' : ''}`}>
                <div className={`${modoEdicao ? 'bg-yellow-500' : 'bg-gray-800'} px-8 py-5`}>
                  <h3 className="font-black text-white flex items-center gap-3 text-sm uppercase tracking-[0.2em]">
                    {modoEdicao ? <><Edit size={20}/> Editando</> : <><FilePlus size={20}/> Nova Evolução</>}
                  </h3>
                </div>
                <CardContent className="p-8 space-y-6 bg-white">
                  {/* Campos do formulário... */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 block uppercase tracking-widest">Tipo</label>
                    <select className={inputClass} value={novoRegistro.tipo} onChange={e => setNovoRegistro({...novoRegistro, tipo: e.target.value})}>
                      <option value="Sessão">Sessão Regular</option>
                      <option value="Anamnese">Anamnese / Inicial</option>
                      <option value="Avaliação">Avaliação</option>
                      <option value="Devolutiva">Devolutiva</option>
                      <option value="Laudo">Laudo / Documento</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 block uppercase tracking-widest">Descrição</label>
                    <textarea className={`${inputClass} min-h-[300px] resize-none leading-relaxed`} placeholder="Relato clínico..." value={novoRegistro.descricao} onChange={e => setNovoRegistro({...novoRegistro, descricao: e.target.value})} />
                  </div>
                  <div className="flex gap-3 pt-4">
                    {modoEdicao && <Button onClick={() => setModoEdicao(null)} variant="ghost" className="flex-1 font-bold h-14 rounded-xl">Cancelar</Button>}
                    <Button onClick={handleSalvarRegistro} className={`flex-[2] text-white font-black uppercase tracking-widest h-14 rounded-xl shadow-lg ${modoEdicao ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      <Save size={20} className="mr-2"/> Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className={isSecretaria ? "lg:col-span-3" : "lg:col-span-2 space-y-6"}>
            <h3 className="font-black text-gray-800 flex items-center gap-3 text-xl uppercase tracking-tighter px-2">
              <History size={26} className="text-blue-600"/> Histórico Clínica ({registros.length})
            </h3>

            <div className="space-y-6">
              {registros.map((reg) => (
                <div key={reg.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative group transition-all hover:shadow-md text-left">
                  <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] ${reg.tipo_registro === 'Laudo' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {reg.tipo_registro}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-700 uppercase">{reg.profissional_nome}</span>
                        <span className="text-xs font-bold text-gray-400">{formatarDataSegura(reg.created_at)}</span>
                      </div>
                    </div>
                    
                    {/* BOTÕES DE AÇÃO: EDITAR E EXCLUIR */}
                    <div className="flex items-center gap-1">
                      {!isSecretaria && (
                        <button onClick={() => iniciarEdicao(reg)} className="text-gray-300 hover:text-blue-600 p-2 transition-colors" title="Editar"><Edit size={20} /></button>
                      )}
                      
                      {/* BOTÃO EXCLUIR: SÓ APARECE PARA ADMIN */}
                      {isAdmin && (
                        <button 
                          onClick={() => handleExcluirRegistro(reg.id)} 
                          className="text-gray-300 hover:text-red-600 p-2 transition-colors"
                          title="Excluir Permanentemente"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>

                  {isSecretaria && reg.tipo_registro !== 'Laudo' ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-8 rounded-2xl text-gray-400 text-sm font-bold uppercase tracking-widest text-center flex flex-col items-center gap-3">
                      <Shield size={32} className="opacity-20"/> Conteúdo Restrito ao Corpo Clínico
                    </div>
                  ) : (
                    <div className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed mb-6 font-medium">
                      {reg.descricao}
                    </div>
                  )}

                  {reg.arquivo_url && (
                    <a href={reg.arquivo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-3 bg-blue-50 border-2 border-blue-100 rounded-2xl text-blue-700 text-sm font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                      <Download size={18} /> Ver Anexo
                    </a>
                  )}

                  {/* Log de edições... */}
                  {!isSecretaria && Array.isArray(reg.historico) && reg.historico.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-50">
                      <details className="group">
                        <summary className="flex items-center gap-2 text-[11px] font-black text-yellow-600 cursor-pointer select-none uppercase tracking-widest hover:text-yellow-700">
                          <AlertCircle size={14} /> Log de edições anteriores ({reg.historico.length})
                        </summary>
                        <div className="mt-4 space-y-4 bg-yellow-50/50 p-6 rounded-3xl border border-yellow-100">
                          {reg.historico.map((h: any, index: number) => (
                            <div key={index} className="text-sm border-b border-yellow-200/50 pb-4 last:border-0 last:pb-0">
                              <div className="flex justify-between text-gray-400 mb-2 font-black uppercase text-[10px] tracking-tighter">
                                <span>Alterado por: {h.autor}</span>
                                <span>{formatarDataSegura(h.data)}</span>
                              </div>
                              <p className="text-gray-500 italic line-through bg-white/80 p-4 rounded-xl border border-yellow-100 opacity-70 mb-2 font-medium">
                                {h.texto}
                              </p>
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
      </div>
    </div>
  );
}