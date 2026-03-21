import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  CheckCircle, Search, Clock, ArrowRight, User, 
  CalendarDays, FileText, ShoppingBag, History, Camera, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, startOfDay, endOfDay, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoSer2 from "@/assets/ser2.png";

export function Checkin() {
  const [identificacao, setIdentificacao] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 0 = Login, 1 = Portal Aberto
  const [telaAtiva, setTelaAtiva] = useState<0 | 1>(0);
  const [abaAtiva, setAbaAtiva] = useState<'inicio' | 'historico' | 'servicos' | 'perfil'>('inicio');
  
  const [paciente, setPaciente] = useState<any>(null);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [consultaHoje, setConsultaHoje] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Máscara de CPF
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 9) v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    else if (v.length > 6) v = v.replace(/^(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (v.length > 3) v = v.replace(/^(\d{3})(\d{1,3})/, "$1.$2");
    setIdentificacao(v);
  };

  const entrarNoPortal = async (e: React.FormEvent) => {
    e.preventDefault();
    const limpo = identificacao.replace(/\D/g, "");
    if (limpo.length < 10) return toast.error("Digite todos os números.");

    setLoading(true);
    try {
      // 1. Busca o Paciente
      const { data: todosPacientes, error: errPac } = await supabase
        .from('pacientes')
        .select('*');

      if (errPac || !todosPacientes) throw errPac;

      const pEncontrado = todosPacientes.find(p => {
        const cpf = (p.cpf || "").replace(/\D/g, "");
        const resp = (p.responsavel_cpf || "").replace(/\D/g, "");
        const tel = (p.telefone || "").replace(/\D/g, "");
        return cpf === limpo || resp === limpo || tel === limpo || tel.includes(limpo);
      });

      if (!pEncontrado) {
        toast.error("Cadastro não encontrado. Fale com a recepção.");
        setLoading(false);
        return;
      }

      setPaciente(pEncontrado);

      // 2. Busca TODOS os agendamentos desse paciente
      const { data: meusAgendamentos, error: errAg } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('paciente_id', pEncontrado.id)
        .order('data_inicio', { ascending: false });

      if (!errAg && meusAgendamentos) {
        setAgendamentos(meusAgendamentos);
        
        // Separa a consulta de HOJE para o Check-in
        const hojeInicio = startOfDay(new Date());
        const hojeFim = endOfDay(new Date());
        
        const hoje = meusAgendamentos.find((ag: any) => {
          const d = new Date(ag.data_inicio);
          return d >= hojeInicio && d <= hojeFim;
        });
        
        setConsultaHoje(hoje || null);
      }

      setTelaAtiva(1);
    } catch (error) {
      toast.error("Erro no sistema.");
    } finally {
      setLoading(false);
    }
  };

  const confirmarChegada = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('agendamentos').update({ status: 'Presenca' }).eq('id', consultaHoje.id);
      if (error) throw error;
      
      setConsultaHoje({ ...consultaHoje, status: 'Presenca' });
      toast.success("Recepção notificada com sucesso!");
    } catch (error) {
      toast.error("Erro ao confirmar presença.");
    } finally {
      setLoading(false);
    }
  };

  // Upload de Foto via Base64
  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setLoading(true);
      try {
        const { error } = await supabase.from('pacientes').update({ foto_url: base64String }).eq('id', paciente.id);
        if (error) throw error;
        setPaciente({ ...paciente, foto_url: base64String });
        toast.success("Foto de perfil atualizada!");
      } catch (err) {
        toast.error("Erro ao salvar foto.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const sair = () => {
    setPaciente(null);
    setIdentificacao("");
    setTelaAtiva(0);
    setAbaAtiva('inicio');
  };

  // Separação de datas para as abas
  const consultasFuturas = agendamentos.filter(ag => isAfter(new Date(ag.data_inicio), endOfDay(new Date())));
  const consultasPassadas = agendamentos.filter(ag => isBefore(new Date(ag.data_inicio), startOfDay(new Date())));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-blue-100 relative overflow-hidden text-left">
      {/* Decoração de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      {/* --- TELA 0: LOGIN --- */}
      {telaAtiva === 0 && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 relative z-10 border border-gray-100 text-center">
            <div className="flex flex-col items-center mb-8">
              <img src={logoSer2} alt="SerClin" className="w-20 h-20 object-contain mb-4" />
              <h1 className="text-xl font-black text-[#1e3a8a] uppercase tracking-tighter">Portal do Paciente</h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Seu Espaço SerClin</p>
            </div>

            <form onSubmit={entrarNoPortal} className="space-y-6">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefone, CPF DO PACIENTE ou CPF DO RESPONSÁVEL CADASTRADO</label>
                <div className="relative">
                  <Search className="absolute left-4 top-4 h-5 w-5 text-gray-300" />
                  <Input type="tel" required placeholder="000.000.000-00" value={identificacao} onChange={handleInput} className="bg-gray-50 border-none h-14 pl-12 text-sm font-bold rounded-2xl text-gray-700 w-full" />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-[#1e3a8a] hover:bg-black text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2">
                {loading ? "Acessando..." : <>Entrar no Portal <ArrowRight size={18} /></>}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* --- TELA 1: PORTAL INTERNO --- */}
      {telaAtiva === 1 && paciente && (
        <div className="flex-1 flex flex-col z-10 w-full max-w-md mx-auto bg-white shadow-2xl min-h-screen relative pb-20">
          
          {/* Cabeçalho do Portal */}
          <div className="bg-[#1e3a8a] px-6 pt-12 pb-6 text-white rounded-b-[2rem] shadow-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center overflow-hidden">
                  {paciente.foto_url ? <img src={paciente.foto_url} alt="Perfil" className="w-full h-full object-cover" /> : <User size={24} className="text-white" />}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Bem-vindo(a),</p>
                <h2 className="text-lg font-black uppercase leading-tight text-white">{paciente.nome.split(' ')[0]}</h2>
              </div>
            </div>
            <button onClick={sair} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
              <LogOut size={18} className="text-white" />
            </button>
          </div>

          {/* Área de Conteúdo Scrollável */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* ABA: INÍCIO (Check-in e Futuro) */}
            {abaAtiva === 'inicio' && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="font-black text-gray-800 uppercase text-sm tracking-widest">Consulta de Hoje</h3>
                
                {consultaHoje ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="text-blue-500" size={20} />
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Horário</p>
                        <p className="text-base font-black text-[#1e3a8a]">{format(new Date(consultaHoje.data_inicio), "HH:mm", { locale: ptBR })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <User className="text-blue-500" size={20} />
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Profissional</p>
                        <p className="text-sm font-bold text-[#1e3a8a]">{consultaHoje.profissional_nome}</p>
                      </div>
                    </div>

                    {consultaHoje.status === 'Presenca' || consultaHoje.status === 'Presença' ? (
                      <div className="bg-emerald-100 text-emerald-700 font-black uppercase tracking-widest h-12 rounded-xl flex items-center justify-center gap-2 text-[11px]">
                        <CheckCircle size={18} /> Recepção Avisada
                      </div>
                    ) : (
                      <Button onClick={confirmarChegada} disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest h-14 rounded-xl shadow-md flex items-center justify-center gap-2">
                        {loading ? "Avisando..." : "Cheguei na Clínica"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 text-center">
                    <CalendarDays size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-xs font-bold text-gray-400 uppercase">Você não tem consultas agendadas para hoje.</p>
                  </div>
                )}

                {consultasFuturas.length > 0 && (
                  <div className="pt-4">
                    <h3 className="font-black text-gray-800 uppercase text-sm tracking-widest mb-4">Próximos Agendamentos</h3>
                    <div className="space-y-3">
                      {consultasFuturas.map(ag => (
                        <div key={ag.id} className="bg-white border rounded-2xl p-4 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-[10px] font-black text-blue-500 uppercase">{format(new Date(ag.data_inicio), "dd/MM/yyyy")}</p>
                            <p className="text-sm font-bold text-gray-700">{ag.profissional_nome}</p>
                          </div>
                          <span className="font-black text-gray-800">{format(new Date(ag.data_inicio), "HH:mm")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ABA: HISTÓRICO E LAUDOS */}
            {abaAtiva === 'historico' && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-black text-gray-800 uppercase text-sm tracking-widest mb-4">Meu Histórico Clínico</h3>
                {consultasPassadas.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-10 font-bold uppercase">Nenhum histórico encontrado.</p>
                ) : (
                  consultasPassadas.map(ag => {
                    const isFalta = ag.status === 'Falta';
                    return (
                      <div key={ag.id} className={`bg-white border rounded-2xl p-4 shadow-sm ${isFalta ? 'opacity-60' : ''}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">{format(new Date(ag.data_inicio), "dd/MM/yyyy 'às' HH:mm")}</p>
                            <p className="text-sm font-bold text-gray-800 uppercase">{ag.profissional_nome}</p>
                          </div>
                          <span className={`text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-widest ${isFalta ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {isFalta ? 'Falta' : 'Concluído'}
                          </span>
                        </div>
                        <Button variant="outline" className="w-full h-10 text-[10px] font-black uppercase text-blue-600 border-blue-100 bg-blue-50/50 flex gap-2 rounded-xl">
                          <FileText size={14} /> Ver Laudo / Evolução
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ABA: SERVIÇOS (Vitrine SerClin) */}
            {abaAtiva === 'servicos' && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="font-black text-gray-800 uppercase text-sm tracking-widest">Nossos Serviços</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
                    <ShoppingBag size={80} className="absolute -right-4 -bottom-4 text-white/20" />
                    <h4 className="font-black uppercase text-lg mb-1">Oficina das Emoções</h4>
                    <p className="text-[10px] font-bold text-orange-100 uppercase mb-4 w-3/4">Desenvolvimento infantil através da ludoterapia.</p>
                    <Button className="bg-white text-orange-600 font-black text-[10px] uppercase h-8 rounded-full">Saber Mais</Button>
                  </div>

                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
                    <FileText size={80} className="absolute -right-4 -bottom-4 text-white/20" />
                    <h4 className="font-black uppercase text-lg mb-1">E-books SerClin</h4>
                    <p className="text-[10px] font-bold text-blue-100 uppercase mb-4 w-3/4">Materiais exclusivos criados pela nossa equipe.</p>
                    <Button className="bg-white text-blue-600 font-black text-[10px] uppercase h-8 rounded-full">Acessar Loja</Button>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
                    <h4 className="font-black text-gray-800 uppercase text-md mb-1">Planos de Cuidados</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-4">Informações sobre convênios e planos de longo prazo.</p>
                    <Button variant="outline" className="w-full border-gray-200 text-gray-600 font-black text-[10px] uppercase h-10 rounded-xl">Ver Tabela de Valores</Button>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: PERFIL (Upload de Foto) */}
            {abaAtiva === 'perfil' && (
              <div className="space-y-6 animate-in fade-in text-center">
                <h3 className="font-black text-gray-800 uppercase text-sm tracking-widest text-left mb-6">Meu Cadastro</h3>
                
                <div className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                  <div className="relative mb-4 group">
                    <div className="w-28 h-28 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                      {paciente.foto_url ? <img src={paciente.foto_url} alt="Perfil" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-300" />}
                    </div>
                    {/* Input de arquivo invisível */}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFotoUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-black transition-colors">
                      <Camera size={18} />
                    </button>
                  </div>
                  <h2 className="text-lg font-black uppercase text-gray-800">{paciente.nome}</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Clique na câmera para alterar a foto</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Telefone / WhatsApp</p>
                    <p className="text-sm font-bold text-gray-700">
                      {paciente.telefone 
                        ? paciente.telefone.replace(/\D/g, "").length === 11 
                          ? paciente.telefone.replace(/\D/g, "").replace(/(\d{2})(\d)(\d{4})(\d{4})/, "($1) $2 $3-$4")
                          : paciente.telefone.replace(/\D/g, "").replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
                        : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Convênio</p>
                    <p className="text-sm font-bold text-gray-700">{paciente.convenio || 'Particular'}</p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Menu Fixo na Base (Bottom Navigation) */}
          <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2 px-4 flex justify-between z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <button onClick={() => setAbaAtiva('inicio')} className={`flex flex-col items-center p-2 w-16 transition-colors ${abaAtiva === 'inicio' ? 'text-blue-600' : 'text-gray-400'}`}>
              <CalendarDays size={22} className="mb-1" />
              <span className="text-[9px] font-black uppercase tracking-widest">Início</span>
            </button>
            <button onClick={() => setAbaAtiva('historico')} className={`flex flex-col items-center p-2 w-16 transition-colors ${abaAtiva === 'historico' ? 'text-blue-600' : 'text-gray-400'}`}>
              <History size={22} className="mb-1" />
              <span className="text-[9px] font-black uppercase tracking-widest">Histórico</span>
            </button>
            <button onClick={() => setAbaAtiva('servicos')} className={`flex flex-col items-center p-2 w-16 transition-colors ${abaAtiva === 'servicos' ? 'text-blue-600' : 'text-gray-400'}`}>
              <ShoppingBag size={22} className="mb-1" />
              <span className="text-[9px] font-black uppercase tracking-widest">Serviços</span>
            </button>
            <button onClick={() => setAbaAtiva('perfil')} className={`flex flex-col items-center p-2 w-16 transition-colors ${abaAtiva === 'perfil' ? 'text-blue-600' : 'text-gray-400'}`}>
              <User size={22} className="mb-1" />
              <span className="text-[9px] font-black uppercase tracking-widest">Perfil</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}