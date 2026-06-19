import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, UserPlus, Shield, Trash2, 
  RefreshCw, KeyRound, Edit2, Check
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Acessos() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);
  
  // Estados para controlar quem está sendo editado e o texto novo
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState("");

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('perfis').select('*').order('nome');
      if (error) throw error;
      setUsuarios(data || []);
    } catch (err) {
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // 🌟 NOVA FUNÇÃO: Atualiza o nome do profissional no Supabase
  const handleSalvarNome = async (id: string) => {
    if (!novoNome.trim()) {
      toast.error("O nome não pode ficar vazio");
      return;
    }
    if (!id) {
      toast.error("ID do usuário não encontrado");
      return;
    }
    
    setAtualizandoId(id);
    try {
      const { error } = await supabase
        .from('perfis')
        .update({ nome: novoNome.trim() })
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Nome atualizado com sucesso!");
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, nome: novoNome.trim() } : u));
      setEditandoId(null);
    } catch (err: any) {
      console.error("Erro detalhado do Supabase:", err);
      toast.error(`Falha ao salvar: ${err.message || 'Erro 400'}`);
    } finally {
      setAtualizandoId(null);
    }
  };

  const handleMudarRole = async (id: string, novoRole: string) => {
    setAtualizandoId(id);
    try {
      const { error } = await supabase.from('perfis').update({ role: novoRole }).eq('id', id);
      if (error) throw error;
      toast.success("Nível de acesso atualizado!");
      fetchUsuarios();
    } catch (err) {
      toast.error("Erro ao atualizar nível");
    } finally {
      setAtualizandoId(null);
    }
  };

  const handleMudarCor = async (id: string, novaCor: string) => {
    try {
      const { error } = await supabase.from('perfis').update({ cor: novaCor }).eq('id', id);
      if (error) throw error;
      toast.success("Cor da agenda atualizada!");
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, cor: novaCor } : u));
    } catch (err) {
      toast.error("Erro ao mudar cor");
    }
  };

  const handleResetSenha = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) throw error;
      toast.success("E-mail de redefinição enviado!");
    } catch (err) {
      toast.error("Erro ao enviar e-mail.");
    }
  };

  const handleExcluirUsuario = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente remover o acesso de ${nome}?`)) return;
    try {
      const { error } = await supabase.from('perfis').delete().eq('id', id);
      if (error) throw error;
      toast.success("Usuário removido");
      fetchUsuarios();
    } catch (err) {
      toast.error("Erro ao remover usuário");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-8 text-left font-sans pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
          <div>
            <button
              onClick={() => navigate("/sistema")}
              className="flex items-center text-[10px] text-gray-500 hover:text-blue-600 mb-2 transition-colors font-black uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Painel
            </button>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
              <Shield className="text-purple-600" size={28} />
              Gestão de Acessos
            </h1>
          </div>

          <Button 
            onClick={() => navigate("/sistema/usuarios/novo")}
            className="w-full md:w-auto bg-blue-600 hover:bg-black text-white font-black rounded-xl px-6 h-12 shadow-lg transition-all flex items-center justify-center gap-2 uppercase text-xs"
          >
            <UserPlus size={18} />
            Novo Profissional
          </Button>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <Card className="border-none shadow-xl rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-white">
              <CardContent className="p-0">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Profissional</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Cor</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nível</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {usuarios.map((user) => (
                        <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full flex items-center justify-center font-black text-white uppercase text-xs border-2 border-white shadow-sm" style={{ backgroundColor: user.cor || '#3b82f6' }}>
                                {user.nome?.substring(0, 2)}
                              </div>
                              
                              {/* Campo de nome condicional para Desktop */}
                              {editandoId === user.id ? (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="text" 
                                    value={novoNome} 
                                    onChange={(e) => setNovoNome(e.target.value)}
                                    className="border border-blue-300 rounded-lg px-2 py-1 text-sm font-bold bg-white text-gray-800 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <button 
                                    onClick={() => handleSalvarNome(user.id)}
                                    disabled={atualizandoId === user.id}
                                    className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                                  >
                                    <Check size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col text-left group/name flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-gray-800 uppercase text-sm">{user.nome}</span>
                                    <button 
                                      onClick={() => { setEditandoId(user.id); setNovoNome(user.nome || ""); }}
                                      className="opacity-0 group-hover/name:opacity-100 text-gray-400 hover:text-blue-600 transition-all p-1"
                                      title="Editar Nome"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                  </div>
                                  <span className="text-xs text-gray-400">{user.email}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center items-center gap-2">
                              <input type="color" value={user.cor || '#3b82f6'} onChange={(e) => handleMudarCor(user.id, e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 overflow-hidden bg-transparent" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Select disabled={atualizandoId === user.id} value={user.role || 'profissional'} onValueChange={(val) => handleMudarRole(user.id, val)}>
                              <SelectTrigger className="border-none h-9 font-black text-[10px] uppercase rounded-full px-4 bg-gray-100"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="admin">Administrador</SelectItem><SelectItem value="secretaria">Secretária</SelectItem><SelectItem value="profissional">Profissional</SelectItem></SelectContent>
                            </Select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => handleResetSenha(user.email)} className="p-2 text-gray-300 hover:text-orange-500"><KeyRound size={18} /></button>
                              <button onClick={() => handleExcluirUsuario(user.id, user.nome)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* VISUALIZAÇÃO MOBILE (CARDS) */}
                <div className="md:hidden divide-y divide-gray-100">
                  {usuarios.map((user) => (
                    <div key={user.id} className="p-5 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl flex items-center justify-center font-black text-white uppercase text-sm shadow-md" style={{ backgroundColor: user.cor || '#3b82f6' }}>
                          {user.nome?.substring(0, 2)}
                        </div>
                        
                        {/* Campo de nome condicional para Mobile */}
                        {editandoId === user.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input 
                              type="text" 
                              value={novoNome} 
                              onChange={(e) => setNovoNome(e.target.value)}
                              className="border border-blue-300 rounded-lg px-2 py-1 text-xs font-bold bg-white text-gray-800 uppercase outline-none w-full"
                            />
                            <button 
                              onClick={() => handleSalvarNome(user.id)}
                              disabled={atualizandoId === user.id}
                              className="p-2 bg-emerald-500 text-white rounded-lg"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col text-left flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-gray-800 uppercase text-sm truncate">{user.nome}</span>
                              <button 
                                onClick={() => { setEditandoId(user.id); setNovoNome(user.nome || ""); }}
                                className="text-gray-400 p-1"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                            <span className="text-[10px] text-gray-400 truncate">{user.email}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-xl flex flex-col gap-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase">Cor da Agenda</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={user.cor || '#3b82f6'} onChange={(e) => handleMudarCor(user.id, e.target.value)} className="w-6 h-6 rounded-md border-none" />
                            <span className="text-[9px] font-mono font-bold text-gray-500">{user.cor || '#3B82F6'}</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl flex flex-col gap-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase">Nível</label>
                          <Select disabled={atualizandoId === user.id} value={user.role || 'profissional'} onValueChange={(val) => handleMudarRole(user.id, val)}>
                            <SelectTrigger className="border-none h-6 p-0 bg-transparent font-black text-[10px] uppercase shadow-none"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="secretaria">Secretária</SelectItem><SelectItem value="profissional">Profissional</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => handleResetSenha(user.email)} variant="outline" className="flex-1 h-10 rounded-xl text-[9px] font-black uppercase border-orange-100 text-orange-600">
                          <KeyRound size={14} className="mr-2"/> Reset Senha
                        </Button>
                        <Button onClick={() => handleExcluirUsuario(user.id, user.nome)} variant="outline" className="h-10 w-12 rounded-xl border-red-100 text-red-500">
                          <Trash2 size={16}/>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}