import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  ArrowLeft, User, Save, History, FilePlus, Edit, AlertCircle, Clock, Paperclip, FileText, Download, Shield 
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
  const { isSecretaria } = usePerfil(); // Verifica se é Secretária
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [paciente, setPaciente] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modoEdicao, setModoEdicao] = useState<string | null>(null);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [novoRegistro, setNovoRegistro] = useState({ tipo: "Sessão", descricao: "" });

  const carregarDados = async () => {
    try {
      const { data: p } = await supabase.from("pacientes").select("*").eq("id", id).single();
      setPaciente(p);
      const { data: r } = await supabase.from("prontuarios").select("*").eq("paciente_id", id).order("created_at", { ascending: false });
      setRegistros(r || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { carregarDados(); }, [id]);

  const handleSalvarRegistro = async () => {
    if (!novoRegistro.descricao) return toast.warning("Escreva algo na descrição.");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const nomeProfissional = user?.user_metadata?.full_name || user?.email || "Profissional";
      const emailProfissional = user?.email || "";

      // --- CORREÇÃO DO ERRO AQUI ---
      // Definimos explicitamente que pode ser string (texto) ou null
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

        const { error } = await supabase.from("prontuarios").update({
          descricao: novoRegistro.descricao,
          updated_at: new Date().toISOString(),
          profissional_nome: nomeProfissional,
          profissional_email: emailProfissional,
          historico: historicoAtualizado,
          arquivo_url: finalUrl,
          arquivo_nome: finalNome
        }).eq("id", modoEdicao);
        if (error) throw error;
        toast.success("Registro atualizado!");
      } else {
        const { error } = await supabase.from("prontuarios").insert([{
          paciente_id: id,
          tipo_registro: novoRegistro.tipo,
          descricao: novoRegistro.descricao,
          profissional_nome: nomeProfissional,
          profissional_email: emailProfissional,
          historico: [],
          arquivo_url: arquivoUrl,
          arquivo_nome: arquivoNome
        }]);
        if (error) throw error;
        toast.success("Salvo com sucesso!");
      }
      setNovoRegistro({ tipo: "Sessão", descricao: "" });
      setArquivoSelecionado(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setModoEdicao(null);
      carregarDados();
    } catch (error: any) { console.error(error); toast.error("Erro ao salvar: " + error.message); }
  };

  const iniciarEdicao = (reg: any) => {
    setModoEdicao(reg.id);
    setNovoRegistro({ tipo: reg.tipo_registro, descricao: reg.descricao });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info("Editando registro...");
  };

  const cancelarEdicao = () => {
    setModoEdicao(null);
    setNovoRegistro({ tipo: "Sessão", descricao: "" });
    setArquivoSelecionado(null);
  };

  const inputClass = "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600";
  if (loading) return <div className="p-10 text-center text-gray-500">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/sistema/pacientes")} className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600">
          <ArrowLeft size={18} /> Voltar
        </Button>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
          <div className="bg-blue-100 p-4 rounded-full text-blue-600"><User size={32} /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{paciente?.nome}</h1>
            <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100 mt-1 inline-block">
              {paciente?.convenio || "Particular"}
            </span>
            <p className="text-gray-500 text-sm mt-1">{paciente?.genero}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SÓ PROFISSIONAL/ADMIN VÊ O FORMULÁRIO DE NOVA EVOLUÇÃO */}
          {!isSecretaria && (
            <div className="lg:col-span-1 space-y-4">
              <Card className={`border-none shadow-md ${modoEdicao ? 'ring-2 ring-yellow-400' : ''}`}>
                <div className={`${modoEdicao ? 'bg-yellow-500' : 'bg-blue-600'} px-5 py-3`}>
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase">
                    {modoEdicao ? <><Edit size={16}/> Editando</> : <><FilePlus size={16}/> Nova Evolução</>}
                  </h3>
                </div>
                <CardContent className="p-5 space-y-4 bg-white">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Tipo</label>
                    <select className={inputClass} value={novoRegistro.tipo} onChange={e => setNovoRegistro({...novoRegistro, tipo: e.target.value})}>
                      <option value="Sessão">Sessão Regular</option>
                      <option value="Anamnese">Anamnese / Inicial</option>
                      <option value="Avaliação">Avaliação</option>
                      <option value="Devolutiva">Devolutiva</option>
                      <option value="Laudo">Laudo / Documento</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Descrição</label>
                    <textarea className={`${inputClass} min-h-[200px] resize-none`} placeholder="Descreva a evolução..." value={novoRegistro.descricao} onChange={e => setNovoRegistro({...novoRegistro, descricao: e.target.value})} />
                  </div>
                  <div>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setArquivoSelecionado(e.target.files ? e.target.files[0] : null)} />
                    <Button type="button" variant="outline" className={`w-full border-dashed border-2 ${arquivoSelecionado ? 'border-green-500 text-green-700 bg-green-50' : 'border-gray-300 text-gray-500'}`} onClick={() => fileInputRef.current?.click()}>
                      {arquivoSelecionado ? <><FileText size={16} className="mr-2"/> {arquivoSelecionado.name}</> : <><Paperclip size={16} className="mr-2"/> Anexar Arquivo (PDF/Foto)</>}
                    </Button>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {modoEdicao && <Button onClick={cancelarEdicao} variant="ghost" className="flex-1">Cancelar</Button>}
                    <Button onClick={handleSalvarRegistro} className={`flex-[2] text-white font-bold ${modoEdicao ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}>
                      <Save size={18} className="mr-2"/> {modoEdicao ? 'Salvar Edição' : 'Salvar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* HISTÓRICO - VISÍVEL PARA TODOS (COM RESTRIÇÃO DE TEXTO PARA SECRETÁRIA) */}
          <div className={isSecretaria ? "lg:col-span-3" : "lg:col-span-2 space-y-4"}>
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg px-2">
              <History size={22} className="text-blue-600"/> Histórico ({registros.length})
            </h3>

            {registros.length === 0 ? (
              <div className="text-center py-10 bg-white rounded border border-dashed text-gray-400">Sem registros.</div>
            ) : (
              <div className="space-y-4">
                {registros.map((reg) => (
                  <div key={reg.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group">
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${reg.tipo_registro === 'Laudo' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                          {reg.tipo_registro}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                            <User size={12}/> {reg.profissional_nome || "Profissional"}
                          </span>
                          <span className="text-[10px] text-gray-400">{formatarDataSegura(reg.created_at)}</span>
                        </div>
                      </div>
                      {!isSecretaria && (
                        <button onClick={() => iniciarEdicao(reg)} className="text-gray-300 hover:text-blue-600 p-1"><Edit size={16} /></button>
                      )}
                    </div>

                    {/* BLOQUEIO DE VISUALIZAÇÃO PARA SECRETÁRIA (EXCETO LAUDO) */}
                    {isSecretaria && reg.tipo_registro !== 'Laudo' ? (
                      <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg text-gray-400 text-sm italic flex items-center gap-2 select-none mb-3">
                        <Shield size={16}/> Conteúdo protegido (Restrito ao corpo clínico)
                      </div>
                    ) : (
                      <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed mb-3">
                        {reg.descricao}
                      </div>
                    )}

                    {reg.arquivo_url && (
                      <div className="mb-3">
                        <a href={reg.arquivo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-md text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors">
                          <Download size={16} /> Baixar Anexo: {reg.arquivo_nome || "Arquivo"}
                        </a>
                      </div>
                    )}

                    {!isSecretaria && Array.isArray(reg.historico) && reg.historico.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <details className="group">
                          <summary className="flex items-center gap-2 text-xs font-semibold text-yellow-600 cursor-pointer select-none hover:text-yellow-700">
                            <AlertCircle size={12} /> Ver histórico de alterações ({reg.historico.length})
                          </summary>
                          <div className="mt-3 space-y-3 bg-yellow-50/50 p-3 rounded border border-yellow-100">
                            {reg.historico.map((h: any, index: number) => (
                              <div key={index} className="text-xs border-b border-yellow-200 pb-2 last:border-0 last:pb-0">
                                <div className="flex justify-between text-gray-500 mb-1">
                                  <span><User size={10} className="inline"/> {h.autor}</span>
                                  <span><Clock size={10} className="inline"/> {formatarDataSegura(h.data)}</span>
                                </div>
                                <p className="text-gray-500 italic line-through bg-white p-2 rounded border border-yellow-100 opacity-70 mb-1">{h.texto}</p>
                                {h.arquivo && <div className="text-[10px] text-gray-400 flex items-center gap-1"><Paperclip size={10}/> Tinha anexo: {h.arquivo}</div>}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}