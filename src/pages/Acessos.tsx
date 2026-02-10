import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Shield, User, Check, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Acessos() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarUsuarios = async () => {
    setLoading(true);
    // Busca todos os perfis
    const { data, error } = await supabase.from('perfis').select('*').order('email');
    if (error) {
      console.error(error);
      toast.error("Erro ao carregar equipe");
    } else {
      setUsuarios(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { carregarUsuarios(); }, []);

  const alterarPermissao = async (id: string, novaRole: string) => {
    const { error } = await supabase.from('perfis').update({ role: novaRole }).eq('id', id);
    if (error) {
      toast.error("Erro ao atualizar permissão.");
    } else {
      toast.success("Permissão atualizada!");
      carregarUsuarios(); // Recarrega a lista para confirmar visualmente
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50 font-sans">
      
      {/* Botão de Voltar */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/sistema")} 
          className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600 text-gray-600"
        >
          <ArrowLeft size={18} /> Voltar para o Dashboard
        </Button>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
        <Shield className="text-blue-600" /> Gestão de Acessos e Perfis
      </h1>

      <div className="grid gap-4">
        {usuarios.map((user) => (
          <Card key={user.id} className="border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="bg-blue-100 p-3 rounded-full text-blue-700">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{user.email || "Sem e-mail"}</h3>
                  <p className="text-sm text-gray-500">
                    Perfil Atual: <span className={`font-bold uppercase ${
                      user.role === 'admin' ? 'text-blue-600' : 
                      user.role === 'secretaria' ? 'text-purple-600' : 'text-green-600'
                    }`}>{user.role || 'profissional'}</span>
                  </p>
                </div>
              </div>

              {/* Área de Seleção Visual (Caixas para marcar) */}
              <div className="flex flex-wrap gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-100 w-full md:w-auto justify-center">
                
                <button
                  onClick={() => alterarPermissao(user.id, 'admin')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                    user.role === 'admin' 
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200' 
                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }`}
                >
                  {user.role === 'admin' && <Check size={14}/>} Admin
                </button>

                <button
                  onClick={() => alterarPermissao(user.id, 'profissional')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                    user.role === 'profissional' 
                    ? 'bg-white text-green-700 shadow-sm ring-1 ring-gray-200' 
                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }`}
                >
                  {user.role === 'profissional' && <Check size={14}/>} Profissional
                </button>

                <button
                  onClick={() => alterarPermissao(user.id, 'secretaria')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                    user.role === 'secretaria' 
                    ? 'bg-white text-purple-700 shadow-sm ring-1 ring-gray-200' 
                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }`}
                >
                  {user.role === 'secretaria' && <Check size={14}/>} Secretária
                </button>

              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}