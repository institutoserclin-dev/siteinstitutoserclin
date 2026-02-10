import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Link, useNavigate } from "react-router-dom"; // Adicionado useNavigate
import { toast } from "sonner";
import { 
  User, Plus, Search, FileText, MapPin, 
  Trash2, Edit, X, Save, ArrowLeft, Camera, ImageIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { usePerfil } from "@/hooks/usePerfil";

const CONVENIOS = [
  "Particular", "SINODONTO", "SINPROAC", "SINTEAC", "COMUNIDADE", "IGREJAS"
];

export function Pacientes() {
  const navigate = useNavigate(); // Hook para navegação
  const { isAdmin } = usePerfil();
  const fileInputRef = useRef<HTMLInputElement>(null); // Referência para input de foto

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fotoSelecionada, setFotoSelecionada] = useState<File | null>(null); // Estado da foto
  
  const [form, setForm] = useState({
    id: null, nome: "", cpf: "", data_nascimento: "", genero: "Feminino", endereco: "", telefone: "", convenio: "Particular", foto_url: ""
  });

  const calcularIdade = (dataNasc: string) => {
    if (!dataNasc) return "";
    try {
      const hoje = new Date();
      const nasc = new Date(dataNasc);
      let idade = hoje.getFullYear() - nasc.getFullYear();
      if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) {
        idade--;
      }
      return isNaN(idade) ? "" : idade + " anos";
    } catch (e) { return ""; }
  };

  const fetchPacientes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("pacientes").select("*").order("nome", { ascending: true });
    if (error) console.error(error); else setPacientes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPacientes(); }, []);

  const handleCpf = (e: any) => {
    let v = e.target.value.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setForm({ ...form, cpf: v });
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let urlDaFoto = form.foto_url;

      // 1. Se selecionou uma foto nova, faz o upload
      if (fotoSelecionada) {
        const fileExt = fotoSelecionada.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('fotos-perfil')
          .upload(filePath, fotoSelecionada);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('fotos-perfil')
          .getPublicUrl(filePath);
        
        urlDaFoto = publicUrl;
      }

      // 2. Salva os dados no banco
      const payload = { 
        ...form, 
        convenio: form.convenio || "Particular",
        foto_url: urlDaFoto 
      };

      if (form.id) {
        await supabase.from("pacientes").update(payload).eq("id", form.id);
        toast.success("Paciente atualizado!");
      } else {
        const { id, ...newPayload } = payload;
        await supabase.from("pacientes").insert([newPayload]);
        toast.success("Paciente cadastrado!");
      }

      setIsModalOpen(false);
      setFotoSelecionada(null); // Limpa seleção
      fetchPacientes();
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao salvar: " + error.message);
    }
  };

  const handleEditar = (p: any) => {
    setForm({ ...p, cpf: p.cpf || "", convenio: p.convenio || "Particular", foto_url: p.foto_url || "" });
    setFotoSelecionada(null);
    setIsModalOpen(true);
  };

  const handleNovo = () => {
    setForm({ id: null, nome: "", cpf: "", data_nascimento: "", genero: "Feminino", endereco: "", telefone: "", convenio: "Particular", foto_url: "" });
    setFotoSelecionada(null);
    setIsModalOpen(true);
  };

  const handleExcluir = async (id: number) => {
    if (!confirm("Tem certeza?")) return;
    await supabase.from("pacientes").delete().eq("id", id);
    toast.success("Paciente excluído.");
    fetchPacientes();
  };

  const pacientesFiltrados = pacientes.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()) || p.cpf?.includes(busca));
  const inputClass = "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans">
      
      {/* BOTÃO VOLTAR (NOVO) */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/sistema")} 
          className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600 text-gray-600"
        >
          <ArrowLeft size={18} /> Voltar para Dashboard
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-blue-600" /> Pacientes
          </h1>
          <p className="text-gray-500 text-sm">Gerencie cadastros, fotos e prontuários.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar..." className="pl-9 bg-white" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          {isAdmin && (
            <Button onClick={handleNovo} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus size={18} className="mr-2" /> Novo
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pacientesFiltrados.map((paciente) => (
          <Card key={paciente.id} className="hover:shadow-md transition-all bg-white border-gray-200">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-3 items-center">
                  
                  {/* FOTO DO PACIENTE (REDONDA) */}
                  {paciente.foto_url ? (
                    <img 
                      src={paciente.foto_url} 
                      alt={paciente.nome} 
                      className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <User size={24} />
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{paciente.nome}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {paciente.genero} • {calcularIdade(paciente.data_nascimento)}
                      </span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleEditar(paciente)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><Edit size={16}/></button>
                    <button onClick={() => handleExcluir(paciente.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                )}
              </div>
              
              <div className="pl-[60px]">
                <span className="text-xs border px-2 py-1 rounded text-blue-700 border-blue-100 bg-blue-50 font-semibold">
                  {paciente.convenio}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                <Link to={`/sistema/pacientes/${paciente.id}`} className="w-full">
                  <Button variant="outline" className="w-full text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50">
                    <FileText size={16} className="mr-2" /> Prontuário
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                {form.id ? "Editar Paciente" : "Novo Paciente"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
            </div>
            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* ÁREA DE UPLOAD DE FOTO */}
                <div className="md:col-span-2 flex justify-center mb-4">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {fotoSelecionada ? (
                      <img src={URL.createObjectURL(fotoSelecionada)} className="w-24 h-24 rounded-full object-cover border-4 border-blue-100" />
                    ) : form.foto_url ? (
                      <img src={form.foto_url} className="w-24 h-24 rounded-full object-cover border-4 border-blue-100" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-blue-400">
                        <Camera size={32} className="text-gray-400 group-hover:text-blue-500" />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-sm">
                      <ImageIcon size={14} />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => setFotoSelecionada(e.target.files ? e.target.files[0] : null)} 
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Nome Completo</label>
                  <input required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className={inputClass} placeholder="Ex: Maria da Silva" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Convênio</label>
                  <select className={inputClass} value={form.convenio} onChange={e => setForm({...form, convenio: e.target.value})}>
                    {CONVENIOS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Gênero</label>
                  <select className={inputClass} value={form.genero} onChange={e => setForm({...form, genero: e.target.value})}>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Data de Nascimento</label>
                  <input type="date" required value={form.data_nascimento} onChange={e => setForm({...form, data_nascimento: e.target.value})} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">CPF</label>
                  <input placeholder="000.000.000-00" maxLength={14} value={form.cpf} onChange={handleCpf} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Telefone</label>
                  <input placeholder="(00) 00000-0000" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} className={inputClass} />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Endereço</label>
                  <input placeholder="Endereço completo" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} className={inputClass} />
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Save size={18} className="mr-2"/> Salvar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}