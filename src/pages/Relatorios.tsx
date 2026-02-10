import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, BarChart3, TrendingUp, CheckCircle, XCircle, 
  Calendar, Download, DollarSign, Filter, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePerfil } from "@/hooks/usePerfil";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Relatorios() {
  const navigate = useNavigate();
  const { isAdmin } = usePerfil();
  const [loading, setLoading] = useState(true);
  
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  const [stats, setStats] = useState({
    totalAgendados: 0,
    presencas: 0,
    faltas: 0,
    justificadas: 0,
    faturamentoEstimado: 0,
  });

  const carregarRelatorios = async () => {
    try {
      setLoading(true);
      const dataInicio = startOfMonth(new Date(anoSelecionado, mesSelecionado)).toISOString();
      const dataFim = endOfMonth(new Date(anoSelecionado, mesSelecionado)).toISOString();

      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .gte("data_inicio", dataInicio)
        .lte("data_inicio", dataFim);
      
      if (error) throw error;

      if (data) {
        const presencas = data.filter(a => a.status === 'Presença').length;
        const faltas = data.filter(a => a.status === 'Falta').length;
        const justificadas = data.filter(a => a.status === 'Falta Justificada').length;
        const faturamento = presencas * 150; 

        setStats({
          totalAgendados: data.length,
          presencas,
          faltas,
          justificadas,
          faturamentoEstimado: faturamento
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarRelatorios();
  }, [mesSelecionado, anoSelecionado]);

  const calcularPorcentagem = (valor: number) => {
    return stats.totalAgendados > 0 ? (valor / stats.totalAgendados) * 100 : 0;
  };

  const handleExportarPDF = () => {
    window.print();
  };

  const inputClass = "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-gray-700 print:hidden";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
          .shadow-md, .shadow-sm { shadow: none !important; border: 1px solid #eee !important; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* NAVEGAÇÃO E EXPORTAÇÃO */}
        <div className="flex justify-between items-center print:hidden">
          <Button variant="ghost" onClick={() => navigate("/sistema")} className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600 text-gray-600 font-bold">
            <ArrowLeft size={18} /> VOLTAR AO PAINEL
          </Button>
          <Button onClick={handleExportarPDF} className="gap-2 bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg">
            <Download size={18} /> GERAR RELATÓRIO PDF
          </Button>
        </div>

        {/* CABEÇALHO DO RELATÓRIO */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="text-blue-600" /> Relatórios SerClin
            </h1>
            <p className="text-gray-500 text-sm font-medium">Período: {format(new Date(anoSelecionado, mesSelecionado), 'MMMM yyyy', { locale: ptBR })}</p>
          </div>
          
          <div className="flex gap-3 items-center print:hidden">
            <select className={inputClass} value={mesSelecionado} onChange={(e) => setMesSelecionado(Number(e.target.value))}>
              {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((mes, i) => (
                <option key={mes} value={i}>{mes}</option>
              ))}
            </select>
            <select className={inputClass} value={anoSelecionado} onChange={(e) => setAnoSelecionado(Number(e.target.value))}>
              {[2025, 2026].map(ano => <option key={ano} value={ano}>{ano}</option>)}
            </select>
          </div>
        </div>

        {/* RESUMO FINANCEIRO E PRESENÇA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Agendado</p>
              <h2 className="text-2xl font-black text-gray-800 mt-1">{stats.totalAgendados}</h2>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Presenças</p>
              <h2 className="text-2xl font-black text-green-600 mt-1">{stats.presencas}</h2>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Faltas</p>
              <h2 className="text-2xl font-black text-red-600 mt-1">{stats.faltas}</h2>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-blue-600">
            <CardContent className="p-6 text-white">
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Faturamento Est.</p>
              <h2 className="text-2xl font-black mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.faturamentoEstimado)}
              </h2>
            </CardContent>
          </Card>
        </div>

        {/* GRÁFICO DE BARRAS */}
        <Card className="border-none shadow-md overflow-hidden bg-white">
          <div className="bg-gray-800 px-6 py-4">
            <h3 className="text-white font-bold flex items-center gap-2 uppercase text-xs">
              <TrendingUp size={16}/> Distribuição de Atendimentos
            </h3>
          </div>
          <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Presenças</span>
                  <span>{stats.presencas} ({calcularPorcentagem(stats.presencas).toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${calcularPorcentagem(stats.presencas)}%` }}></div></div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-red-500 flex items-center gap-1"><XCircle size={14}/> Faltas</span>
                  <span>{stats.faltas} ({calcularPorcentagem(stats.faltas).toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${calcularPorcentagem(stats.faltas)}%` }}></div></div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-orange-500 flex items-center gap-1"><AlertCircle size={14}/> Justificadas</span>
                  <span>{stats.justificadas} ({calcularPorcentagem(stats.justificadas).toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-orange-400 h-full rounded-full transition-all" style={{ width: `${calcularPorcentagem(stats.justificadas)}%` }}></div></div>
              </div>
          </CardContent>
        </Card>

        {/* RODAPÉ DO RELATÓRIO (APARECE SÓ NO PDF) */}
        <div className="hidden print:block text-center text-[10px] text-gray-400 pt-10 border-t">
          Relatório gerado automaticamente pelo Sistema SerClin em {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
      </div>
    </div>
  );
}