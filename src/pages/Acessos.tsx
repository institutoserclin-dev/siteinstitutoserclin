import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, UserPlus, Shield, Trash2, 
  RefreshCw, CheckCircle2, UserCog, Mail, Palette, KeyRound
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
      toast.success("E-mail de redefinição enviado para o profissional!");
    } catch (err) {
      toast.error("Erro ao enviar e-mail de recuperação.");
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-left font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button
              onClick={() => navigate("/sistema")}
              className="flex items-center text-sm text-gray-500 hover:text-blue-600 mb-2 transition-colors font-bold uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Painel Principal
            </button>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
              <Shield className="text-purple-600" size={32} />
              Gestão de Acessos
            </h1>
          </div>

          <Button 
            onClick={() => navigate("/sistema/cadastro")}
            className="bg-blue-600 hover:bg-black text-white font-black rounded-xl px-6 h-12 shadow-lg transition-all flex items-center gap-2 uppercase text-xs"
          >
            <UserPlus size={18} />
            Novo Profissional
          </Button>
        </header>

        <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Profissional</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Cor da Agenda</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nível de Acesso</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center"><RefreshCw className="animate-spin mx-auto text-blue-600" size={32} /></td></tr>
                  ) : usuarios.map((user) => (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center font-black text-white uppercase text-xs shadow-sm border-2 border-white" style={{ backgroundColor: user.cor || '#3b82f6' }}>
                            {user.nome?.substring(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-gray-800 uppercase text-sm leading-tight">{user.nome}</span>
                            <span className="text-xs text-gray-400 font-medium">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-3">
                          <input 
                            type="color" 
                            value={user.cor || '#3b82f6'} 
                            onChange={(e) => handleMudarCor(user.id, e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border-2 border-gray-100 p-0 overflow-hidden bg-transparent"
                          />
                          <span className="text-[10px] font-bold text-gray-400 uppercase font-mono">{user.cor || '#3B82F6'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-44">
                          <Select 
                            disabled={atualizandoId === user.id}
                            value={user.role || 'profissional'} 
                            onValueChange={(val) => handleMudarRole(user.id, val)}
                          >
                            <SelectTrigger className="border-none h-9 font-black text-[10px] uppercase rounded-full px-4 bg-gray-100 group-hover:bg-white transition-all">
                              <UserCog size={14} className="mr-2 text-blue-600" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-2xl border-gray-100">
                              <SelectItem value="admin" className="font-black text-[10px] uppercase">Administrador</SelectItem>
                              <SelectItem value="secretaria" className="font-black text-[10px] uppercase">Secretária</SelectItem>
                              <SelectItem value="profissional" className="font-black text-[10px] uppercase">Profissional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleResetSenha(user.email)}
                            className="p-2.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all"
                            title="Enviar E-mail de Recuperação"
                          >
                            <KeyRound size={18} />
                          </button>
                          <button
                            onClick={() => handleExcluirUsuario(user.id, user.nome)}
                            className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="Remover Acesso"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}