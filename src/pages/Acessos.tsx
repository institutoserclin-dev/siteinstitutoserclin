import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Trash2, ArrowLeft, UserPlus, 
  RefreshCw, Search, Filter, Crown, Stethoscope, FileText, Check, Palette, Eye, EyeOff, Lock, Shuffle, KeyRound 
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
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  const [novoColaborador, setNovoColaborador] = useState({ 
    nome: "", 
    email: "", 
    senha: "", 
    role: "profissional", 
    cor: "#1e3a8a" 
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

  const gerarSenhaAleatoria = () => {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
    let senha = "";
    for (let i = 0; i < 8; i++) {
      senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    setNovoColaborador({ ...novoColaborador, senha });
    setMostrarSenha(true);
    toast.info("Senha gerada!");
  };

  const handleCadastrarColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novoColaborador.senha.length < 6) return toast.warning("Senha mínima: 6 caracteres.");
    
    setLoading(true);
    try {
      // 1. CRIAR NO AUTH (IMPORTANTE: persistSession: false impede que você seja deslogado)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: novoColaborador.email,
        password: novoColaborador.senha,
        options: {
          data: { full_name: novoColaborador.nome, role: novoColaborador.role },
          // Isso evita que o Supabase tente logar o novo usuário no seu navegador
        }
      });

      if (authError) throw authError;

      // 2. VINCULAR DADOS AO PERFIL (UPSERT garante que o registro exista com a cor)
      if (authData.user) {
        const { error: perfilError } = await supabase
          .from("perfis")
          .upsert({ 
            id: authData.user.id,
            nome: novoColaborador.nome, 
            email: novoColaborador.email,
            cor: novoColaborador.cor,
            role: novoColaborador.role 
          });
          
        if (perfilError) throw perfilError;
      }

      toast.success("Acesso criado! IMPORTANTE: Desative 'Confirm Email' no Supabase para login imediato.");
      setNovoColaborador({ nome: "", email: "", senha: "", role: "profissional", cor: "#1e3a8a" });
      setMostrarSenha(false);
      fetchEquipe();
    } catch (err: any) {
      toast.error(err.message || "Erro 422: Verifique se o e-mail já existe.");
    } finally {
      setLoading(false);
    }
  };

  // NOVA FUNÇÃO: Enviar e-mail de redefinição para o colega
  const handleRedefinirSenha = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) throw error;
      toast.success(`E-mail de recuperação enviado para ${email}`);
    } catch (err) {
      toast.error("Erro ao enviar recuperação.");
    }
  };

  const handleAlterarCor = async (userId: string, novaCor: string) => {
    setListaUsuarios(current => current.map(u => u.id === userId ? { ...u, cor: novaCor } : u));
    try {
      await supabase.from("perfis").update({ cor: novaCor }).eq("id", userId);
      toast.success("Cor atualizada!");
    } catch (err) { fetchEquipe(); }
  };

  const handleAlterarRole = async (userId: string, newRole: string) => {
    setListaUsuarios(current => current.map(u => u.id === userId ? { ...u, role: newRole } : u));
    try {
      await supabase.from("perfis").update({ role: newRole }).eq("id", userId);
      toast.success("Cargo alterado!");
    } catch (err) { fetchEquipe(); }
  };

  const handleRemover = async (id: string, nome: string) => {
    if (!confirm(`Remover acesso de ${nome}?`)) return;
    try {
      await supabase.from("perfis").delete().eq("id", id);
      toast.success("Removido.");
      fetchEquipe();
    } catch (err) { toast.error("Erro."); }
  };

  const listaFiltrada = listaUsuarios.filter(u => 
    u.nome.toLowerCase().includes(filtro.toLowerCase()) || 
    u.email.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-left">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center h-20 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sistema')} className="text-gray-400 hover:text-[#1e3a8a]">
            <ArrowLeft size={24} />
          </Button>
          <div className="flex items-center gap-3 text-left">
            <img src={logoSerClin} className="w-12 h-12 object-contain" alt="SerClin" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-black text-[#1e3a8a] uppercase leading-none">Gestão de Equipe</h1>
              <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">Instituto SerClin</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchEquipe} className="text-gray-400 hover:text-[#1e3a8a]"><RefreshCw size={18} /></Button>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-8">
        
        {/* CADASTRO CONSOLIDADO */}
        <div className="bg-[#1e3a8a] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          <form onSubmit={handleCadastrarColaborador} className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-blue-200 uppercase ml-1">Nome Completo</label>
              <Input value={novoColaborador.nome} onChange={e => setNovoColaborador({...novoColaborador, nome: e.target.value})} placeholder="Ex: Dr. Antônio" className="bg-white/10 border-blue-800/30 text-white placeholder:text-blue-300/50 h-11 focus:ring-amber-400" required />
            </div>
            
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-blue-200 uppercase ml-1">E-mail</label>
              <Input type="email" value={novoColaborador.email} onChange={e => setNovoColaborador({...novoColaborador, email: e.target.value})} placeholder="email@serclin.com" className="bg-white/10 border-blue-800/30 text-white placeholder:text-blue-300/50 h-11 focus:ring-amber-400" required />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-blue-200 uppercase ml-1 flex justify-between">
                Senha 
                <button type="button" onClick={gerarSenhaAleatoria} className="text-amber-400 hover:text-white flex items-center gap-1 text-[9px]"><Shuffle size={10}/> Gerar</button>
              </label>
              <div className="relative">
                <Input type={mostrarSenha ? "text" : "password"} value={novoColaborador.senha} onChange={e => setNovoColaborador({...novoColaborador, senha: e.target.value})} placeholder="******" className="bg-white/10 border-blue-800/30 text-white h-11 pr-10" required />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300">{mostrarSenha ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-1 text-left">
              <label className="text-[10px] font-bold text-blue-200 uppercase ml-1">Cor Agenda</label>
              <div className="flex items-center gap-2 bg-white/10 border border-blue-800/30 h-11 rounded-md px-3">
                <input type="color" value={novoColaborador.cor} onChange={e => setNovoColaborador({...novoColaborador, cor: e.target.value})} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none" />
                <span className="text-[9px] text-white font-mono uppercase">{novoColaborador.cor}</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black h-11 rounded-xl uppercase text-[10px] tracking-wide shadow-lg transition-all">
                {loading ? <RefreshCw className="animate-spin" /> : "Criar Acesso"}
              </Button>
            </div>
          </form>
        </div>

        {/* LISTA DE EQUIPE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-[#1e3a8a] uppercase text-xs flex items-center gap-2"><Users size={16}/> Equipe Ativa ({listaUsuarios.length})</h3>
            <div className="relative w-56 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1e3a8a]" size={14} />
              <Input placeholder="Buscar membro..." value={filtro} onChange={e => setFiltro(e.target.value)} className="h-9 pl-9 bg-gray-50 border-gray-200 text-xs rounded-full focus:bg-white transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {listaFiltrada.map((u) => (
              <div key={u.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
                <div className="flex items-center gap-4 pl-2 text-left">
                  <div className="relative group">
                    <input type="color" value={u.cor || "#1e3a8a"} onChange={(e) => handleAlterarCor(u.id, e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: u.cor || '#1e3a8a' }}>
                      {u.role === 'admin' ? <Crown size={18}/> : u.role === 'secretaria' ? <FileText size={18}/> : <Stethoscope size={18}/>}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-800 uppercase">{u.nome}</p>
                    <p className="text-[11px] text-gray-400">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                  <button onClick={() => handleAlterarRole(u.id, 'profissional')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${u.role === 'profissional' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-gray-400 hover:text-[#1e3a8a]'}`}>Profissional</button>
                  <button onClick={() => handleAlterarRole(u.id, 'secretaria')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${u.role === 'secretaria' ? 'bg-slate-600 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>Secretária</button>
                  <button onClick={() => handleAlterarRole(u.id, 'admin')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${u.role === 'admin' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-400 hover:text-amber-600'}`}>Admin</button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  {/* BOTÃO REDEFINIR SENHA INTEGRADO */}
                  <button onClick={() => handleRedefinirSenha(u.email)} className="text-gray-400 hover:text-blue-600 p-1.5 transition-colors" title="Enviar redefinição de senha"><KeyRound size={16} /></button>
                  <button onClick={() => handleRemover(u.id, u.nome)} className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}