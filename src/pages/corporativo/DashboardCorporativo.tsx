import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Shield, Heart, Activity, Plus, LogOut, ArrowRight, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import logoSer2 from '@/assets/ser2.png';

export function DashboardCorporativo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

  // Estados dos dados dinâmicos
  const [empresaNome, setEmpresaNome] = useState("SUPERMERCADOS ARAÚJO S/A");
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  
  const [metricas, setMetricas] = useState({ saudeIndex: 88, afastamentosPrevenidos: 14, totalAtendidos: 42 });
  const [unidades, setUnidades] = useState([
    { nome: 'Loja Central', colaboradores: 140, risco: 'Baixo' },
    { nome: 'Loja Tangará', colaboradores: 95, risco: 'Médio' },
    { nome: 'CD', colaboradores: 210, risco: 'Baixo' },
  ]);

  // Form de Novo Encaminhamento (Nova Demanda)
  const [form, setForm] = useState({
    nome: "", tipo: "Colaborador", unidade: "Loja Central", telefone: "", observacao: ""
  });

  const fetchDadosCorporativos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      // Busca o vínculo corporativo do perfil logado
      const { data: perfil } = await supabase.from('perfis').select('escola_id, nome').eq('email', user.email).single();
      
      // MOCK LOCAL: Para testar localmente caso não queira configurar as colunas agora
      // Remova as linhas de mock abaixo quando as tabelas do Supabase estiverem populadas
      const mockCompanyId = "e3b0c442-98fc-4569-bdc0-mockcompanyid";
      setEmpresaId(mockCompanyId);

      // Aqui você faria as queries reais baseadas no company_id/empresaId:
      // Exemplo: const { data } = await supabase.from('pacientes').select('id').contains('convenio', [empresaNome])
      
    } catch (err) {
      console.error("Erro ao carregar dados corporativos:", err);
    }
  };

  useEffect(() => {
    fetchDadosCorporativos();
  }, []);

  const handleCadastrarDemanda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.telefone) return toast.error("Preencha os campos obrigatórios.");

    setLoading(true);
    try {
      // Insere diretamente na tabela de pacientes do SerClin integrada com o fluxo clínico
      const { error } = await supabase.from('pacientes').insert([{
        nome: form.nome.toUpperCase(),
        telefone: form.telefone,
        convenio: `Corporativo - ${form.tipo} (${empresaNome})`,
        observacoes: `[RH Araújo] Unidade: ${form.unidade}. Motivo: ${form.observacao}`
      }]);

      if (error) throw error;

      toast.success("Demanda homologada com sucesso!", {
        description: "O beneficiário foi inserido na esteira de agendamento prioritário do SerClin."
      });
      
      setIsReferralModalOpen(false);
      setForm({ nome: "", tipo: "Colaborador", unidade: "Loja Central", telefone: "", observacao: "" });
    } catch (err: any) {
      toast.error("Erro ao registrar demanda operacional.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-left flex flex-col font-sans">
      <header className="bg-white border-b px-4 md:px-8 py-4 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoSer2} className="w-12 h-12 object-contain" alt="SerClin" />
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight text-[#1e3a8a]">SerClin Corporativo</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-600">Proteção neurocognitiva para empresas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 font-bold uppercase text-[11px] h-10 rounded-xl">
              <Building size={16} className="mr-2" /> {empresaNome.split(' ')[0]}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-red-500 hover:bg-red-50 h-10 w-10 rounded-xl">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 w-full flex-1 overflow-y-auto no-scrollbar">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-[1.5rem] border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Índice de saúde</p>
                  <h2 className="text-3xl font-black text-emerald-600 mt-1">{metricas.saudeIndex}%</h2>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <Activity size={22} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Afastamentos prevenidos</p>
                  <h2 className="text-3xl font-black text-[#1e3a8a] mt-1">{metricas.afastamentosPrevenidos}</h2>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 text-[#1e3a8a]">
                  <Shield size={22} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vidas protegidas</p>
                  <h2 className="text-3xl font-black text-purple-600 mt-1">{metricas.totalAtendidos}</h2>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                  <Heart size={22} />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-[2rem] border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-black uppercase tracking-tight text-[#1e3a8a]">Acompanhamento por unidade</h3>
                <Button onClick={() => setIsReferralModalOpen(true)} className="bg-purple-600 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase h-10 px-4 shadow-md">
                  <Plus size={16} className="mr-2" /> Nova demanda
                </Button>
              </div>
              <div className="space-y-3">
                {unidades.map((item) => (
                  <div key={item.nome} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div>
                      <p className="font-black text-sm uppercase text-gray-800">{item.nome}</p>
                      <p className="text-[11px] font-bold uppercase text-gray-400">{item.colaboradores} colaboradores</p>
                    </div>
                    <div className="flex items-center gap-2 text-purple-600 font-black text-xs uppercase bg-purple-50/50 px-3 py-1 rounded-full border border-purple-100">
                      Risco {item.risco}
                      <ArrowRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <h3 className="text-md font-black uppercase tracking-tight text-[#1e3a8a] mb-4">Resumo operacional</h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div className="rounded-2xl bg-blue-50 p-4 border border-blue-100 text-left">
                  <p className="font-black uppercase text-[10px] tracking-widest text-blue-700">Triagem ativa</p>
                  <p className="mt-1 text-lg font-black text-[#1e3a8a]">12 solicitações em análise</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-left">
                  <p className="font-black uppercase text-[10px] tracking-widest text-emerald-700">Acompanhamento</p>
                  <p className="mt-1 text-lg font-black text-emerald-700">8 atendimentos confirmados</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100 text-left">
                  <p className="font-black uppercase text-[10px] tracking-widest text-amber-700">Alertas</p>
                  <p className="mt-1 text-lg font-black text-amber-700">3 casos com prioridade alta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* MODAL: REGISTRAR NOVA DEMANDA DO RH */}
      {isReferralModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[450px] overflow-hidden border border-gray-100">
            <div className="p-6 border-b flex justify-between items-center bg-purple-50/40 text-left">
              <div>
                <h3 className="font-black uppercase text-sm tracking-wider text-purple-950">Encaminhar Colaborador / Dependente</h3>
                <p className="text-[10px] font-bold text-purple-600 uppercase mt-0.5">Fluxo de Triagem e Salvaguarda Operacional</p>
              </div>
              <button onClick={() => setIsReferralModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={22}/></button>
            </div>
            
            <form onSubmit={handleCadastrarDemanda} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-400 uppercase">Vínculo</label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({...form, tipo: v})}>
                    <SelectTrigger className="bg-gray-50 border-none h-11 text-xs font-bold uppercase"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[120]">
                      <SelectItem value="Colaborador">Colaborador</SelectItem>
                      <SelectItem value="Dependente">Dependente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-400 uppercase">Unidade Operacional</label>
                  <Select value={form.unidade} onValueChange={(v) => setForm({...form, unidade: v})}>
                    <SelectTrigger className="bg-gray-50 border-none h-11 text-xs font-bold uppercase"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[120]">
                      {unidades.map((u, i) => <SelectItem key={i} value={u.nome} className="text-xs uppercase font-bold">{u.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-400 uppercase">Nome Completo</label>
                <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="EX: MAURÍCIO ALENCAR SOUZA" className="bg-gray-50 border-none h-11 text-xs font-bold uppercase" required />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-400 uppercase">WhatsApp para Contato</label>
                <Input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} placeholder="(68) 9 9999-0000" className="bg-gray-50 border-none h-11 text-xs font-bold" required />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-400 uppercase">Observações do RH (Produtividade / Sinais Clínicos)</label>
                <textarea value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})} placeholder="Sinalize os motivos internos ou alterações observadas na performance laboral..." className="w-full bg-gray-50 rounded-xl p-3 text-xs font-bold h-24 border-none outline-none text-gray-700 resize-none" />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-black text-white font-black uppercase text-xs h-12 rounded-xl mt-2">
                {loading ? <RefreshCw className="animate-spin" size={16}/> : 'Homologar Guia e Enviar'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}