import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Trash2, ArrowLeft, UserPlus, 
  RefreshCw, Search, Filter, Crown, Stethoscope, FileText, Check 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase';
import logoSerClin from "@/assets/logo-serclin.png";

export function Acessos() {
  const navigate = useNavigate();
  const [listaUsuarios, setListaUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [novoColaborador, setNovoColaborador] = useState({ nome: "", email: "", role: "profissional" });
  const [filtro, setFiltro] = useState("");

  const fetchEquipe = async () => {
    try {
      const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .order("role", { ascending: true }) 
        .order("nome");
      
      if (error) throw error;
      setListaUsuarios(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar lista. Verifique o SQL.");
    }
  };

  useEffect(() => { fetchEquipe(); }, []);

  const handleCadastrarColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: existente } = await supabase.from("perfis").select("*").eq("email", novoColaborador.email).single();
      if (existente) {
        toast.error("Este e-mail já está na equipe.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("perfis").insert([novoColaborador]);
      if (error) throw error;

      toast.success("Membro adicionado!");
      setNovoColaborador({ nome: "", email: "", role: "profissional" });
      fetchEquipe();
    } catch (err) {
      toast.error("Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleAlterarRole = async (userId: string, newRole: string) => {
    // Atualização Otimista (Muda na tela antes do banco para parecer instantâneo)
    setListaUsuarios(current => 
      current.map(u => u.id === userId ? { ...u, role: newRole } : u)
    );

    try {
      const { error } = await supabase.from("perfis").update({ role: newRole }).eq("id", userId);
      if (error) throw error;
      toast.success(`Nível alterado para ${newRole.toUpperCase()}`);
    } catch (err) {
      toast.error("Erro ao salvar no banco.");
      fetchEquipe(); // Reverte se der erro
    }
  };

  const handleRemover = async (id: string, nome: string) => {
    if (!confirm(`Remover acesso de ${nome}?`)) return;
    try {
      const { error } = await supabase.from("perfis").delete().eq("id", id);
      if (error) throw error;
      toast.success("Acesso removido.");
      fetchEquipe();
    } catch (err) {
      toast.error("Erro ao remover.");
    }
  };

  const listaFiltrada = listaUsuarios.filter(u => 
    u.nome.toLowerCase().includes(filtro.toLowerCase()) || 
    u.email.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center h-20 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sistema')} className="text-gray-400 hover:text-[#1e3a8a]">
            <ArrowLeft size={24} />
          </Button>
          <div className="flex items-center gap-3">
            <img src={logoSerClin} className="w-12 h-12 object-contain" alt="SerClin" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-[#1e3a8a] uppercase leading-none">Gestão de Acessos</h1>
              <p className="text-[10px] text-amber-600 font-bold uppercase mt-1 tracking-widest">Instituto SerClin</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchEquipe} className="text-gray-400 hover:text-[#1e3a8a]">
          <RefreshCw size={18} />
        </Button>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8">
        
        {/* CADASTRO RÁPIDO */}
        <div className="bg-[#1e3a8a] rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-1">
              <label className="text-[10px] font-bold text-blue-200 uppercase ml-1">Nome Completo</label>
              <Input 
                value={novoColaborador.nome} 
                onChange={e => setNovoColaborador({...novoColaborador, nome: e.target.value})} 
                placeholder="Ex: Dr. Rômulo" 
                className="bg-white/10 border-blue-800/30 text-white placeholder:text-blue-300/50 h-11 focus:ring-amber-400 font-medium"
              />
            </div>
            <div className="flex-1 w-full space-y-1">
              <label className="text-[10px] font-bold text-blue-200 uppercase ml-1">E-mail</label>
              <Input 
                value={novoColaborador.email} 
                onChange={e => setNovoColaborador({...novoColaborador, email: e.target.value})} 
                placeholder="email@serclin.com" 
                className="bg-white/10 border-blue-800/30 text-white placeholder:text-blue-300/50 h-11 focus:ring-amber-400"
              />
            </div>
            <Button onClick={handleCadastrarColaborador} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white font-black h-11 px-8 rounded-xl uppercase text-[10px] tracking-wide shadow-lg border border-amber-400/20">
              {loading ? "..." : "Adicionar"}
            </Button>
          </div>
        </div>

        {/* LISTA DE MEMBROS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-[#1e3a8a] uppercase text-xs flex items-center gap-2">
              <Users size={16}/> Equipe ({listaUsuarios.length})
            </h3>
            <div className="relative w-56 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1e3a8a]" size={14} />
              <Input 
                placeholder="Buscar..." 
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                className="h-9 pl-9 bg-gray-50 border-gray-200 text-xs rounded-full focus:bg-white focus:border-amber-400 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {listaFiltrada.map((u) => (
              <div key={u.id} className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
                
                {/* Info */}
                <div className="flex items-center gap-4 pl-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${u.role === 'admin' ? 'bg-amber-500' : u.role === 'secretaria' ? 'bg-slate-500' : 'bg-[#1e3a8a]'}`}>
                    {u.role === 'admin' ? <Crown size={18}/> : u.role === 'secretaria' ? <FileText size={18}/> : <Stethoscope size={18}/>}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-800 uppercase">{u.nome}</p>
                    <p className="text-[11px] text-gray-400">{u.email}</p>
                  </div>
                </div>

                {/* CONTROLES DE NÍVEL (CAIXAS DE SELEÇÃO) */}
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                  
                  {/* Botão Profissional */}
                  <button 
                    onClick={() => handleAlterarRole(u.id, 'profissional')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      u.role === 'profissional' 
                      ? 'bg-[#1e3a8a] text-white shadow-md' 
                      : 'text-gray-400 hover:bg-white hover:text-[#1e3a8a]'
                    }`}
                  >
                    <Stethoscope size={12} /> Profissional
                  </button>

                  {/* Botão Secretária */}
                  <button 
                    onClick={() => handleAlterarRole(u.id, 'secretaria')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      u.role === 'secretaria' 
                      ? 'bg-slate-600 text-white shadow-md' 
                      : 'text-gray-400 hover:bg-white hover:text-slate-600'
                    }`}
                  >
                    <FileText size={12} /> Secretária
                  </button>

                  {/* Botão Admin */}
                  <button 
                    onClick={() => handleAlterarRole(u.id, 'admin')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      u.role === 'admin' 
                      ? 'bg-amber-500 text-white shadow-md' 
                      : 'text-gray-400 hover:bg-white hover:text-amber-600'
                    }`}
                  >
                    <Crown size={12} /> Admin
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-1"></div>

                  <button 
                    onClick={() => handleRemover(u.id, u.nome)}
                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            ))}

            {listaFiltrada.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                <Filter className="mx-auto mb-2 opacity-50" size={32}/>
                Nenhum membro encontrado.
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}