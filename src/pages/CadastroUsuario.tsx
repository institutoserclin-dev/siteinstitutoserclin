import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";

// Componentes visuais (usando classes do Tailwind direto para garantir que funcione mesmo sem componentes isolados)
// Se você já tiver os componentes do shadcn/ui configurados, pode substituir depois.

export function CadastroUsuario() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Criar um cliente Supabase TEMPORÁRIO
      // Isso é CRUCIAL: impede que o Supabase deslogue você (Admin) ao criar outro usuário
      const supabaseTemp = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false, // Não salva a sessão do novo usuário
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );

      // 2. Tenta criar o usuário
      const { data, error } = await supabaseTemp.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nome, // Salva o nome nos metadados
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success(`Usuário ${nome} criado com sucesso!`, {
          icon: <CheckCircle2 className="text-green-500" />,
        });
        
        // Limpar formulário
        setEmail("");
        setPassword("");
        setNome("");
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Botão Voltar */}
        <button
          onClick={() => navigate("/sistema")}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para o Painel
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Cadastrar Profissional</h1>
                <p className="text-sm text-gray-500">Crie uma conta para médicos ou secretárias.</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleCadastro} className="space-y-5">
              
              {/* Campo Nome */}
              <div className="space-y-2">
                <label htmlFor="nome" className="text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Ex: Dra. Helenara Chaves"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              {/* Campo Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  E-mail de Acesso
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="nome@institutoserclin.com"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha Provisória
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500">
                  O usuário poderá alterar essa senha depois (se você implementar a função de recuperar senha).
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
                >
                  {loading ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Criar Usuário
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