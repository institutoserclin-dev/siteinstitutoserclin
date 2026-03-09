import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Trash2, ArrowLeft, RefreshCw, Search, Crown, 
  Stethoscope, FileText, Eye, EyeOff, Shuffle, KeyRound, Pencil, X, Save
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import logoSerClin from "@/assets/ser2.png";

export function Acessos() {
  const navigate = useNavigate();
  const [listaUsuarios, setListaUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  // Estados para Edição de Nome
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<any>(null);
  const [novoNome, setNovoNome] = useState("");

  const [novoColaborador, setNovoColaborador] = useState({ 
    nome: "", email: "", senha: "", role: "profissional", cor: "#1e3a8a" 
  });
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
      toast.error("Erro ao carregar equipe.");
    }
  };

  useEffect(() => { fetchEquipe(); }, []);

  const handleAbrirEdicao = (usuario: any) => {
    setUsuarioParaEditar(usuario);
    setNovoNome(usuario.nome || "");
    setIsEditModalOpen(true);
  };

  const handleSalvarNome = async () => {
    if (!novoNome.trim()) return toast.warning("O nome não pode ser vazio.");
    setLoading(true);
    try {
      const { error } = await supabase
        .from("perfis")
        .update({ nome: novoNome })
        .eq("id", usuarioParaEditar.id);

      if (error) throw error;

      toast.success("Nome atualizado!");
      setIsEditModalOpen(false);
      fetchEquipe();
    } catch (err) {
      toast.error("Erro ao atualizar nome.");
    } finally {
      setLoading(false);
    }
  };

  const gerarSenhaAleatoria = () => {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
    let senha = "";
    for (let i = 0; i < 8; i++) {
      senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    setNovoColaborador({ ...novoColaborador, senha });
    setMostrarSenha(true);
  };

  const handleCadastrarColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: novoColaborador.email,
        password: novoColaborador.senha,
        options: { data: { full_name: novoColaborador.nome, role: novoColaborador.role } }
      });

      if (authError) throw authError;

      if (authData.user) {
        await supabase.from("perfis").upsert({ 
          id: authData.user.id,
          nome: novoColaborador.nome, 
          email: novoColaborador.email,
          cor: novoColaborador.cor,
          role: novoColaborador.role 
        });
      }

      toast.success("Acesso criado!");
      setNovoColaborador({ nome: "", email: "", senha: "", role: "profissional", cor: "#1e3a8a" });
      fetchEquipe();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar acesso.");
    } finally {
      setLoading(false);
    }
  };

  const handleAlterarCor = async (userId: string, novaCor: string) => {
    await supabase.from("perfis").update({ cor: novaCor }).eq("id", userId);
    setListaUsuarios(current => current.map(u => u.id === userId ? { ...u, cor: novaCor } : u));
    toast.success("Cor atualizada!");
  };

  const handleAlterarRole = async (userId: string, newRole: string) => {
    await supabase.from("perfis").update({ role: newRole }).eq("id", userId);
    setListaUsuarios(current => current.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success("Cargo alterado!");
  };

  const handleRedefinirSenha = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) toast.error("Erro ao enviar e-mail.");
    else toast.success("E-mail de redefinição enviado!");
  };

  const handleRemover = async (id: string, nome: string) => {
    if (!confirm(`Remover acesso de ${nome}?`)) return;
    await supabase.from("perfis").delete().eq("id", id);
    toast.success("Removido.");
    fetchEquipe();
  };

  const listaFiltrada = listaUsuarios.filter(u => {
    const termo = filtro.toLowerCase();
    return (u.nome || "").toLowerCase().includes(termo) || (u.email || "").toLowerCase().includes(termo);
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col text-left">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center h-20 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sistema')} className="text-gray-400 hover:text-[#1e3a8a]"><ArrowLeft size={24} /></Button>
          <div className="flex items-center gap-3">
            <img src={logoSerClin} className="w-12 h-12 object-contain" alt="SerClin" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-black text-[#1e3a8a] uppercase leading-none">Gestão de Equipe</h1>
              <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">SerClin Digital</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchEquipe} className="text-gray-400"><RefreshCw size={18} /></Button>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-8">
        {/* CADASTRO RÁPIDO */}
        <div className="bg-[#1e3a8a] rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
          <form onSubmit={handleCadastrarColaborador} className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-blue-200 uppercase ml-1">Nome</label>
              <Input value={novoColaborador.nome} onChange={e => setNovoColaborador({...novoColaborador, nome: e.target.value})} className="bg-white/10 border-none text-white h-11" required />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-blue-200 uppercase ml-1">E-mail</label>
              <Input type="email" value={novoColaborador.email} onChange={e => setNovoColaborador({...novoColaborador, email: e.target.value})} className="bg-white/10 border-none text-white h-11" required />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-blue-200 uppercase ml-1 flex justify-between">Senha <button type="button" onClick={gerarSenhaAleatoria} className="text-amber-400 text-[9px]">GERAR</button></label>
              <div className="relative">
                <Input type={mostrarSenha ? "text" : "password"} value={novoColaborador.senha} onChange={e => setNovoColaborador({...novoColaborador, senha: e.target.value})} className="bg-white/10 border-none text-white h-11 pr-10" required />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300">{mostrarSenha ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
              </div>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-blue-200 uppercase ml-1">Cor</label>
              <Input type="color" value={novoColaborador.cor} onChange={e => setNovoColaborador({...novoColaborador, cor: e.target.value})} className="bg-white/10 border-none h-11 cursor-pointer" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black h-11 rounded-xl uppercase text-[10px]">CRIAR</Button>
            </div>
          </form>
        </div>

        {/* LISTAGEM COM EDIÇÃO DE NOME */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-[#1e3a8a] uppercase text-xs flex items-center gap-2"><Users size={16}/> Membros ({listaUsuarios.length})</h3>
            <Input placeholder="Buscar..." value={filtro} onChange={e => setFiltro(e.target.value)} className="h-9 w-64 bg-white text-xs rounded-full" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {listaFiltrada.map((u) => (
              <div key={u.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: u.cor || '#1e3a8a' }}>
                    {u.role === 'admin' ? <Crown size={18}/> : u.role === 'secretaria' ? <FileText size={18}/> : <Stethoscope size={18}/>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-gray-800 uppercase leading-none">{u.nome || "SEM NOME"}</p>
                      <button onClick={() => handleAbrirEdicao(u)} className="text-gray-300 hover:text-blue-600 transition-colors"><Pencil size={12}/></button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl">
                  <button onClick={() => handleAlterarRole(u.id, 'profissional')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase ${u.role === 'profissional' ? 'bg-[#1e3a8a] text-white' : 'text-gray-400'}`}>Profissional</button>
                  <button onClick={() => handleAlterarRole(u.id, 'secretaria')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase ${u.role === 'secretaria' ? 'bg-slate-600 text-white' : 'text-gray-400'}`}>Secretária</button>
                  <button onClick={() => handleAlterarRole(u.id, 'admin')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-amber-500 text-white' : 'text-gray-400'}`}>Admin</button>
                  <div className="w-px h-6 bg-gray-200 mx-1"></div>
                  <button onClick={() => handleRedefinirSenha(u.email)} className="text-gray-400 hover:text-blue-600 p-1.5"><KeyRound size={18} /></button>
                  <button onClick={() => handleRemover(u.id, u.nome)} className="text-gray-400 hover:text-red-500 p-1.5"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MODAL DE EDIÇÃO DE NOME - ACESSIBILIDADE RÁPIDA */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-[400px] rounded-[2rem] bg-white p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-[#1e3a8a] uppercase text-sm tracking-widest">Editar Nome</h3>
              <button onClick={() => setIsEditModalOpen(false)}><X size={20} className="text-gray-400"/></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nome do Colaborador</label>
                <Input value={novoNome} onChange={e => setNovoNome(e.target.value)} className="h-12 bg-gray-50 border-none font-bold text-gray-800 uppercase" placeholder="Novo nome..." />
              </div>
              <Button onClick={handleSalvarNome} disabled={loading} className="w-full bg-[#1e3a8a] hover:bg-black text-white font-black h-12 rounded-2xl shadow-xl transition-all gap-2">
                {loading ? <RefreshCw className="animate-spin" size={18}/> : <><Save size={18}/> SALVAR ALTERAÇÃO</>}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}