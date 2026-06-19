import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft, Shield, Check, X, KeyRound, Clock } from "lucide-react";

export function Permissoes() {
  const navigate = useNavigate();
  const [equipe, setEquipe] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarEquipe = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('perfis').select('*').order('nome');
    if (!error && data) {
      setEquipe(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarEquipe();
  }, []);

  // Controla as chaves liga/desliga
  const togglePermissao = async (id: string, campo: string, valorAtual: boolean) => {
    const novoValor = !valorAtual;
    setEquipe(equipe.map(p => p.id === id ? { ...p, [campo]: novoValor } : p));
    
    const { error } = await supabase.from('perfis').update({ [campo]: novoValor }).eq('id', id);
    if (error) {
      toast.error("Erro ao atualizar permissão.");
      carregarEquipe(); 
    } else {
      toast.success("Permissão atualizada!");
    }
  };

  // Controla as mudanças de horários individuais e salva direto no banco
  const handleHorarioChange = async (id: string, campo: string, valor: string) => {
    const valorFormatado = valor + ':00'; // Garante o formato HH:MM:SS para o Postgres
    
    // Atualização otimista na tela
    setEquipe(equipe.map(p => p.id === id ? { ...p, [campo]: valorFormatado } : p));

    const { error } = await supabase
      .from('perfis')
      .update({ [campo]: valorFormatado })
      .eq('id', id);

    if (error) {
      toast.error("Erro ao salvar horário.");
      carregarEquipe();
    } else {
      toast.success("Horário de expediente atualizado!");
    }
  };

  const chaves = [
    { key: 'permissao_agendar', label: 'Agendar / Novo' },
    { key: 'permissao_financeiro', label: 'Financeiro Total' },
    { key: 'permissao_relatorios', label: 'Ver Relatórios' },
    { key: 'permissao_acessos', label: 'Gerir Acessos' },
    { key: 'permissao_confirmacao_amanha', label: 'Confirmar Amanhã' },
    { key: 'permissao_excluir', label: 'Editar/Excluir (Prontuário)' }
  ];

  const inputClass = "flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-black text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-left">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 pt-[calc(env(safe-area-inset-top,0px)+24px)] md:pt-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/sistema")} className="p-2 -ml-2 text-gray-400 hover:text-emerald-600 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
                <Shield className="text-emerald-600" size={24}/> Central de Chaves & Horários
              </h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gestão Completa de Perfis e Expedientes SerClin</p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-xs">Carregando equipe...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {equipe.map((prof) => (
              <div key={prof.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                {/* TOPO DO CARD */}
                <div className="p-6 bg-gray-900 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center font-black text-lg shadow-inner border border-gray-700">
                    {prof.nome?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="font-black text-white uppercase tracking-tight text-sm">
                      {prof.nome || "Usuário sem nome"}
                    </h3>
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                      {prof.role === 'admin' ? 'Acesso Gestor' : (prof.role || 'Colaborador')}
                    </p>
                  </div>
                </div>
                
                {/* CORPO DO CARD: PERMISSÕES */}
                <div className="p-6 flex-1 space-y-3 border-b border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-4 border-b pb-2">
                    <KeyRound size={12}/> Chaves de Acesso
                  </p>
                  
                  {chaves.map(chave => {
                    const estaLigado = prof[chave.key] === true;
                    return (
                      <div key={chave.key} className="flex items-center justify-between group">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider group-hover:text-gray-900 transition-colors">
                          {chave.label}
                        </span>
                        <button 
                          onClick={() => togglePermissao(prof.id, chave.key, estaLigado)}
                          className={`w-14 h-7 rounded-full relative transition-colors shadow-inner flex items-center px-1 ${estaLigado ? 'bg-emerald-500' : 'bg-gray-200'}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform flex items-center justify-center ${estaLigado ? 'translate-x-7' : 'translate-x-0'}`}>
                            {estaLigado ? <Check size={12} className="text-emerald-500"/> : <X size={12} className="text-gray-400"/>}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* BASE DO CARD: EXPEDIENTE DO PROFISSIONAL */}
                <div className="p-6 bg-gray-50/60 space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 border-b pb-2">
                    <Clock size={12} className="text-emerald-600"/> Limites da Agenda (Expediente)
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Início</label>
                      <input 
                        type="time" 
                        value={prof.hora_inicio ? prof.hora_inicio.substring(0,5) : "07:00"} 
                        onChange={(e) => handleHorarioChange(prof.id, 'hora_inicio', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Fim</label>
                      <input 
                        type="time" 
                        value={prof.hora_fim ? prof.hora_fim.substring(0,5) : "20:00"} 
                        onChange={(e) => handleHorarioChange(prof.id, 'hora_fim', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}