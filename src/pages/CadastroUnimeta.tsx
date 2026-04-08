import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User, Mail, Lock, ArrowLeft, RefreshCw, GraduationCap, CheckCircle2 } from 'lucide-react';
import logoSer2 from '@/assets/ser2.png';

export function CadastroUnimeta() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', password: '' });

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const emailLower = form.email.toLowerCase();
    const isDominioEstacio = emailLower.endsWith('@alunos.estacio.br') || 
                             emailLower.endsWith('@professores.estacio.br') || 
                             emailLower.endsWith('@estacio.br');

    if (!isDominioEstacio) {
      const confirmar = window.confirm("Atenção: Este e-mail não pertence ao domínio da Estácio. Se continuar, não terá acesso automático à Triagem Unimeta. Deseja prosseguir?");
      if (!confirmar) {
        setLoading(false);
        return;
      }
    }

    try {
      // 1. Criar o usuário no Auth do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nome: form.nome,
          }
        }
      });

      if (authError) {
        // Trata erro de e-mail já cadastrado
        if (authError.status === 400 || authError.message.includes("already registered")) {
          toast.info('Este e-mail já possui cadastro. Redirecionando para o login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        throw authError;
      }

      // 2. Se o usuário foi criado com sucesso, criamos o perfil manualmente
      // Isso evita o Erro 500 do gatilho (Trigger) do banco de dados
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('perfis')
          .insert([
            {
              id: authData.user.id,
              email: form.email,
              nome: form.nome,
              role: 'profissional',
              permissao_unimeta: true, // Já libera o acesso do aluno aqui
              cor: '#1e3a8a',
              // Definimos valores padrão para evitar erros de colunas obrigatórias
              porcentagem_repasse: '50.00',
              imposto_retido: '0.00',
              comissao_porcentagem: '50',
              hora_inicio: '07:00:00',
              hora_fim: '20:00:00'
            }
          ]);

        if (profileError) {
          // Se der erro no perfil, apenas avisamos no console
          // O aluno já foi criado no Auth, então ele não fica travado
          console.warn("Usuário criado, mas perfil precisará de ajuste manual:", profileError);
        }
      }

      toast.success('Conta criada com sucesso!', {
        description: 'Você já pode acessar o sistema.',
        icon: <CheckCircle2 className="text-green-500" />
      });
      
      navigate('/login');

    } catch (error: any) {
      console.error("Erro detalhado no cadastro:", error);
      toast.error(error.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans text-left">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8">
        
        <div className="flex flex-col items-center mb-8 text-center">
          <img src={logoSer2} alt="SerClin" className="h-16 mb-4 object-contain" />
          <h1 className="text-2xl font-black text-[#1e3a8a] uppercase tracking-tighter">Portal Unimeta</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Crie a sua conta de acesso
          </p>
        </div>

        <form onSubmit={handleCadastro} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1">
              <User size={12} className="text-blue-600"/> Nome Completo
            </label>
            <Input 
              required 
              type="text" 
              placeholder="Ex: João Silva" 
              className="bg-gray-50 border-none font-bold text-sm h-12 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm" 
              value={form.nome} 
              onChange={e => setForm({...form, nome: e.target.value})} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1">
              <Mail size={12} className="text-blue-600"/> E-mail Acadêmico
            </label>
            <Input 
              required 
              type="email" 
              placeholder="nome@alunos.estacio.br" 
              className="bg-gray-50 border-none font-bold text-sm h-12 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
            />
            <p className="text-[9px] text-emerald-600 font-bold uppercase mt-1 flex items-center gap-1">
              <GraduationCap size={10} /> Use o seu e-mail institucional
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1">
              <Lock size={12} className="text-blue-600"/> Senha de Acesso
            </label>
            <Input 
              required 
              type="password" 
              placeholder="Mínimo 6 caracteres" 
              minLength={6} 
              className="bg-gray-50 border-none font-bold text-sm h-12 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm" 
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
            />
          </div>

          <Button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-[#1e3a8a] hover:bg-black text-white font-black h-14 rounded-xl uppercase text-xs shadow-lg transition-all mt-6"
          >
            {loading ? <RefreshCw className="animate-spin" /> : 'Finalizar Cadastro'}
          </Button>

          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => navigate('/login')} 
            className="w-full text-gray-500 font-bold uppercase text-[10px] h-12 mt-2 hover:bg-transparent hover:text-[#1e3a8a]"
          >
            <ArrowLeft size={14} className="mr-2" /> Já tenho conta / Voltar
          </Button>
        </form>
      </div>
    </div>
  );
}