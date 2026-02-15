import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ADICIONADO
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button"; // ADICIONADO
import { 
  DollarSign, Percent, TrendingUp, Building2, 
  UserCircle, Calculator, ArrowLeft // ADICIONADO ArrowLeft
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function Repasses() {
  const navigate = useNavigate(); // ADICIONADO
  const [equipe, setEquipe] = useState<any[]>([]);
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth().toString());
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());

  const fetchData = async () => {
    const { data: p } = await supabase.from('perfis').select('*').order('nome');
    const { data: a } = await supabase.from('agendamentos').select('*').eq('status', 'Presenca');
    if (p) setEquipe(p);
    if (a) setAtendimentos(a);
  };

  useEffect(() => { fetchData(); }, []);

  // Lógica de Cálculo por Profissional (MANTIDA)
  const calcularRelatorio = () => {
    return equipe.map(prof => {
      const atendimentosProf = atendimentos.filter(at => {
        const dataAt = new Date(at.data_inicio);
        return at.profissional_nome === prof.nome && 
               dataAt.getMonth().toString() === filtroMes &&
               dataAt.getFullYear().toString() === filtroAno;
      });

      const totalBruto = atendimentosProf.reduce((acc, at) => acc + (at.valor_atendimento || 0), 0);
      const impostoRetido = totalBruto * ((prof.imposto_retido || 0) / 100);
      const valorLiquido = totalBruto - impostoRetido;
      const parteProfissional = valorLiquido * ((prof.porcentagem_repasse || 50) / 100);
      const parteEmpresa = valorLiquido - parteProfissional;

      return {
        ...prof,
        totalBruto,
        impostoRetido,
        valorLiquido,
        parteProfissional,
        parteEmpresa,
        qtd: atendimentosProf.length
      };
    }).filter(p => p.qtd > 0);
  };

  const relatorio = calcularRelatorio();
  const totalClinica = relatorio.reduce((acc, p) => acc + p.parteEmpresa, 0);
  const totalPagamentos = relatorio.reduce((acc, p) => acc + p.parteProfissional, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans space-y-8 animate-in fade-in duration-700 text-left">
      
      {/* CABEÇALHO ATUALIZADO COM BOTÃO VOLTAR */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/sistema')} 
            className="rounded-full border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-black text-[#1e3a8a] uppercase flex items-center gap-3">
              <Calculator className="text-blue-600" size={28} /> Divisão de Lucros e Repasses
            </h1>
            <p className="text-gray-500 text-sm mt-1">Cálculo automatizado de comissões e impostos da SerClin.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={filtroMes} onValueChange={setFiltroMes}>
            <SelectTrigger className="w-40 bg-white font-bold"><SelectValue placeholder="Mês" /></SelectTrigger>
            <SelectContent>
              {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
                <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroAno} onValueChange={setFiltroAno}>
            <SelectTrigger className="w-32 bg-white font-bold"><SelectValue placeholder="Ano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* CARDS RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-600 text-white shadow-xl border-none">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase opacity-80 font-black">Total Bruto Atendido</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-black">R$ {(totalClinica + totalPagamentos).toLocaleString('pt-BR')}</p>
            <TrendingUp size={40} className="absolute right-4 bottom-4 opacity-20" />
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-100 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase text-emerald-600 font-black">Lucro Líquido SerClin</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-emerald-600">R$ {totalClinica.toLocaleString('pt-BR')}</p>
            <Building2 size={40} className="absolute right-4 bottom-4 text-emerald-100" />
          </CardContent>
        </Card>

        <Card className="bg-white border-blue-100 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase text-blue-600 font-black">Total Repasse Profissionais</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-blue-600">R$ {totalPagamentos.toLocaleString('pt-BR')}</p>
            <UserCircle size={40} className="absolute right-4 bottom-4 text-blue-50" />
          </CardContent>
        </Card>
      </div>

      {/* TABELA DETALHADA */}
      <Card className="shadow-sm border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-6 py-4">Profissional</th>
              <th className="px-6 py-4 text-center">Atendimentos</th>
              <th className="px-6 py-4">Faturamento Bruto</th>
              <th className="px-6 py-4">Impostos (-{">"})</th>
              <th className="px-6 py-4">Parte Profissional</th>
              <th className="px-6 py-4 bg-blue-50/50 text-blue-700">Lucro Clínica</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
            {relatorio.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 uppercase text-[#1e3a8a]">{p.nome} <span className="block text-[9px] text-gray-400 font-normal">{p.cargo} ({p.porcentagem_repasse || 50}%)</span></td>
                <td className="px-6 py-4 text-center">{p.qtd}</td>
                <td className="px-6 py-4">R$ {p.totalBruto.toLocaleString('pt-BR')}</td>
                <td className="px-6 py-4 text-red-500">- R$ {p.impostoRetido.toLocaleString('pt-BR')}</td>
                <td className="px-6 py-4 text-blue-600">R$ {p.parteProfissional.toLocaleString('pt-BR')}</td>
                <td className="px-6 py-4 bg-blue-50/30 text-emerald-600">R$ {p.parteEmpresa.toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}