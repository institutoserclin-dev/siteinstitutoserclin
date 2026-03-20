import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, CheckCircle2, AlertCircle, ShieldCheck, Palette } from "lucide-react";

export function CadastroUsuario() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [role, setRole] = useState("profissional");
  const [cor, setCor] = useState("#3b82f6"); // Cor padrão: Azul SerClin
  const [loading, setLoading] = useState(false);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabaseTemp = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );

      // 1. Criar o usuário no Auth
      const { data, error } = await supabaseTemp.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nome,
            role: role,
          },
        },
      });

      if (error) throw error;

      // 2. Inserir na tabela 'perfis' com ROLE e COR
      if (data.user) {
        const { error: perfilError } = await supabaseTemp
          .from('perfis')
          .insert([
            { 
              id: data.user.id, 
              nome: nome, 
              email: email, 
              role: role,
              cor: cor // Injeta a cor escolhida para o calendário
            }
          ]);

        if (perfilError) throw perfilError;

        toast.success(`Usuário ${nome} criado como ${role.toUpperCase()}!`, {
          icon: <CheckCircle2 className="text-green-500" />,
        });
        
        // Limpar formulário
        setEmail("");
        setPassword("");
        setNome("");
        setRole("profissional");
        setCor("#3b82f6");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao cadastrar usuário", {
        description: error.message || "Verifique os dados e tente novamente.",
        icon: <AlertCircle className="text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-left">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/sistema/acessos")}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Acessos
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tighter">Configurar Novo Perfil</h1>
                <p className="text-sm text-gray-500">Defina o acesso e a identidade visual do profissional.</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleCadastro} className="space-y-5">
              
              <div className="space-y-2">
                <label htmlFor="nome" className="text-xs font-black text-gray-400 uppercase tracking-widest">Nome Completo</label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Ex: Dra. Helenara Chaves"
                  className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-black text-gray-400 uppercase tracking-widest">E-mail de Acesso</label>
                <input
                  id="email"
                  type="email"
                  placeholder="nome@institutoserclin.com"
                  className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="role" className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> Nível de Permissão
                  </label>
                  <select
                    id="role"
                    className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer appearance-none transition-all"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="profissional">PROFISSIONAL</option>
                    <option value="secretaria">SECRETÁRIA</option>
                    <option value="admin">ADMINISTRADOR</option>
                  </select>
                </div>

                {/* --- SELETOR DE COR REPLICADO AQUI --- */}
                <div className="space-y-2">
                  <label htmlFor="cor" className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Palette className="w-4 h-4 text-blue-600" /> Cor na Agenda
                  </label>
                  <div className="flex items-center gap-3 h-11 px-3 border border-gray-300 rounded-md">
                    <input
                      id="cor"
                      type="color"
                      className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                      value={cor}
                      onChange={(e) => setCor(e.target.value)}
                    />
                    <span className="text-xs font-mono font-bold text-gray-500 uppercase">{cor}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-black text-gray-400 uppercase tracking-widest">Senha Provisória</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-4 text-xs font-black text-white hover:bg-black transition-all shadow-xl uppercase tracking-widest disabled:opacity-50"
                >
                  {loading ? "Processando..." : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Finalizar Cadastro
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}