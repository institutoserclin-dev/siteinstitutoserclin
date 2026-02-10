import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Clock, Save, User, Check, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Dias da semana (0 = Domingo no JS, mas vamos ajustar para lógica visual)
const DIAS = [
  { id: 1, label: "Segunda" },
  { id: 2, label: "Terça" },
  { id: 3, label: "Quarta" },
  { id: 4, label: "Quinta" },
  { id: 5, label: "Sexta" },
  { id: 6, label: "Sábado" },
  { id: 0, label: "Domingo" },
];

export function Horarios() {
  const navigate = useNavigate();
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para novo profissional
  const [novoNome, setNovoNome] = useState("");
  const [novaCor, setNovaCor] = useState("#3b82f6");

  const carregar = async () => {
    setLoading(true);
    const { data } = await supabase.from('profissionais').select('*').order('nome');
    setProfissionais(data || []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  // Atualiza o JSON de horário localmente
  const handleChangeHorario = (profId: number, diaId: number, campo: 'inicio' | 'fim' | 'ativo', valor: any) => {
    setProfissionais(prev => prev.map(p => {
      if (p.id !== profId) return p;
      
      const horariosAntigos = p.horarios || {};
      const diaAntigo = horariosAntigos[diaId] || { ativo: false, inicio: "08:00", fim: "18:00" };

      let novoDia;
      if (campo === 'ativo') {
        novoDia = { ...diaAntigo, ativo: valor };
      } else {
        novoDia = { ...diaAntigo, [campo]: valor };
      }

      return { ...p, horarios: { ...horariosAntigos, [diaId]: novoDia } };
    }));
  };

  // Salva no Banco
  const salvarProfissional = async (prof: any) => {
    const { error } = await supabase
      .from('profissionais')
      .update({ horarios: prof.horarios, nome: prof.nome, cor: prof.cor })
      .eq('id', prof.id);
    
    if (error) toast.error("Erro ao salvar.");
    else toast.success("Horários de " + prof.nome + " atualizados!");
  };

  const criarProfissional = async () => {
    if (!novoNome) return toast.warning("Digite um nome.");
    const { error } = await supabase.from('profissionais').insert([{ nome: novoNome, cor: novaCor }]);
    if (error) toast.error("Erro ao criar.");
    else {
      toast.success("Profissional adicionado!");
      setNovoNome("");
      carregar();
    }
  };

  const excluirProfissional = async (id: number) => {
    if (!confirm("Tem certeza? Isso não apaga os agendamentos passados, mas remove o profissional.")) return;
    await supabase.from('profissionais').delete().eq('id', id);
    carregar();
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50 font-sans">
      
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/sistema")} className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600 text-gray-600">
          <ArrowLeft size={18} /> Voltar para Agenda
        </Button>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
        <Clock className="text-blue-600" /> Gestão de Horários e Profissionais
      </h1>

      {/* CRIAR NOVO */}
      <Card className="mb-8 border-dashed border-2 bg-blue-50/50">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1 w-full">
            <label className="text-sm font-semibold">Novo Profissional</label>
            <Input placeholder="Nome do Doutor(a)" value={novoNome} onChange={e => setNovoNome(e.target.value)} className="bg-white" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Cor na Agenda</label>
            <div className="flex items-center gap-2 h-10 px-3 bg-white border rounded-md">
              <input type="color" value={novaCor} onChange={e => setNovaCor(e.target.value)} className="w-8 h-8 cursor-pointer bg-transparent border-none" />
            </div>
          </div>
          <Button onClick={criarProfissional} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus size={18} /> Adicionar
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {profissionais.map((prof) => (
          <Card key={prof.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: prof.cor }}>
            <div className="bg-gray-100 px-6 py-3 flex justify-between items-center border-b">
              <div className="flex items-center gap-3">
                <User size={20} style={{ color: prof.cor }} />
                <span className="font-bold text-lg text-gray-800">{prof.nome}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => excluirProfissional(prof.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 size={16}/>
                </Button>
                <Button size="sm" onClick={() => salvarProfissional(prof)} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Save size={16}/> Salvar Horários
                </Button>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {DIAS.map((dia) => {
                  const config = prof.horarios?.[dia.id] || { ativo: false, inicio: "08:00", fim: "18:00" };
                  return (
                    <div key={dia.id} className={`border rounded-lg p-3 transition-colors ${config.ativo ? 'bg-white border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-gray-700">{dia.label}</span>
                        <input 
                          type="checkbox" 
                          checked={config.ativo} 
                          onChange={(e) => handleChangeHorario(prof.id, dia.id, 'ativo', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <input 
                          type="time" 
                          disabled={!config.ativo}
                          value={config.inicio}
                          onChange={(e) => handleChangeHorario(prof.id, dia.id, 'inicio', e.target.value)}
                          className="w-full text-xs border rounded px-1 py-1"
                        />
                        <span className="text-gray-400">-</span>
                        <input 
                          type="time" 
                          disabled={!config.ativo}
                          value={config.fim}
                          onChange={(e) => handleChangeHorario(prof.id, dia.id, 'fim', e.target.value)}
                          className="w-full text-xs border rounded px-1 py-1"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}