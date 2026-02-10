import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import { 
  User, Plus, Search, FileText, Trash2, Edit, X, Save, ArrowLeft, 
  Camera, ImageIcon, Check, ZoomIn, MessageCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePerfil } from "@/hooks/usePerfil";

// --- UTILITÁRIOS PARA CORTE DE IMAGEM ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );
  return new Promise((resolve) => {
    canvas.toBlob((file) => resolve(file), 'image/jpeg', 0.9);
  });
}

const CONVENIOS = ["Particular", "SINODONTO", "SINPROAC", "SINTEAC", "COMUNIDADE", "IGREJAS"];

export function Pacientes() {
  const navigate = useNavigate();
  const { isAdmin } = usePerfil();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [fotoFinal, setFotoFinal] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: null, nome: "", cpf: "", data_nascimento: "", genero: "Feminino", endereco: "", telefone: "", convenio: "Particular", foto_url: ""
  });

  const fetchPacientes = async () => {
    setLoading(true);
    const { data } = await supabase.from("pacientes").select("*").order("nome", { ascending: true });
    setPacientes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPacientes(); }, []);

  const handleTelefone = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2 - $3");
    else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2 - $3");
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    else if (v.length > 0) v = v.replace(/^(\d*)/, "($1");
    setForm({ ...form, telefone: v });
  };

  const onFileChange = async (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setIsCropping(true);
        setZoom(1);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const confirmCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
    if (blob) {
      setFotoFinal(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setIsCropping(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let urlDaFoto = form.foto_url;
      if (fotoFinal) {
        const fileName = `${Date.now()}-perfil.jpg`;
        const { error: upErr } = await supabase.storage.from('fotos-perfil').upload(fileName, fotoFinal);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName);
        urlDaFoto = data.publicUrl;
      }
      const payload = { ...form, foto_url: urlDaFoto };
      if (form.id) { await supabase.from("pacientes").update(payload).eq("id", form.id); toast.success("Atualizado!"); }
      else { const { id, ...newPayload } = payload; await supabase.from("pacientes").insert([newPayload]); toast.success("Cadastrado!"); }
      limparModal(); fetchPacientes();
    } catch (error: any) { toast.error(error.message); }
  };

  const limparModal = () => {
    setIsModalOpen(false); setIsCropping(false); setFotoFinal(null); setPreviewUrl(null); setImageSrc(null);
  };

  const inputClass = "flex w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium";

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto bg-gray-50 min-h-screen font-sans text-left">
      <Button variant="ghost" onClick={() => navigate("/sistema")} className="gap-2 mb-6 font-bold uppercase text-sm text-gray-500 hover:bg-transparent">
        <ArrowLeft size={20} /> Voltar ao Painel
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 text-left">
        <div>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Pacientes</h1>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Instituto SerClin • Gestão Integrada</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input placeholder="Buscar por nome ou CPF..." className="bg-white border-none shadow-sm h-12 pl-10 text-base" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          {isAdmin && (
            <Button onClick={() => { setForm({id: null, nome: "", cpf: "", data_nascimento: "", genero: "Feminino", endereco: "", telefone: "", convenio: "Particular", foto_url: ""}); setIsModalOpen(true); }} className="bg-blue-600 font-bold uppercase text-sm h-12 px-8 rounded-full shadow-lg">
              <Plus size={20} className="mr-2"/> Novo
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pacientes.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()) || p.cpf?.includes(busca)).map((p) => (
          <Card key={p.id} className="border-none shadow-md bg-white overflow-hidden rounded-3xl hover:shadow-xl transition-all">
            <CardContent className="p-8">
              <div className="flex gap-5 items-start mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-2xl font-black uppercase shrink-0 overflow-hidden border-2 border-white shadow-md">
                  {p.foto_url ? <img src={p.foto_url} className="w-full h-full object-cover" /> : p.nome.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 uppercase text-lg leading-tight truncate mb-1">{p.nome}</h3>
                  <span className="inline-block text-[11px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase tracking-tighter mb-4">{p.convenio}</span>
                  
                  {p.telefone && (
                    <button 
                      onClick={() => window.open(`https://wa.me/55${p.telefone.replace(/\D/g, "")}`, "_blank")}
                      className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-bold border border-green-100 hover:bg-green-100 transition-all w-full md:w-auto"
                    >
                      <MessageCircle size={18} fill="currentColor" /> {p.telefone}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold uppercase text-xs border-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-sm" onClick={() => navigate(`/sistema/pacientes/${p.id}`)}>
                  <FileText size={18} className="mr-2"/> Abrir Prontuário
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => { setForm(p); setPreviewUrl(p.foto_url); setIsModalOpen(true); }}>
                    <Edit size={20}/>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {isCropping ? (
              <div className="h-full flex flex-col bg-gray-900">
                <div className="p-6 flex justify-between items-center text-white">
                  <h3 className="font-bold uppercase text-sm tracking-widest">Ajustar Foto de Perfil</h3>
                  <X className="cursor-pointer" onClick={() => setIsCropping(false)} />
                </div>
                <div className="relative flex-1 min-h-[400px]">
                  <Cropper image={imageSrc || ""} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
                </div>
                <div className="p-8 bg-white space-y-6">
                  <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <Button onClick={confirmCrop} className="w-full bg-blue-600 text-white font-bold uppercase tracking-widest h-14 rounded-2xl shadow-xl text-base">Confirmar Foto</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 px-8 py-6 flex justify-between items-center border-b">
                  <h3 className="font-black text-gray-800 uppercase text-base tracking-widest">{form.id ? "Editar Registro" : "Novo Cadastro de Paciente"}</h3>
                  <X className="text-gray-400 cursor-pointer hover:text-red-500" size={28} onClick={limparModal} />
                </div>
                <div className="overflow-y-auto p-8">
                  <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 flex flex-col items-center mb-6">
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        {previewUrl ? <img src={previewUrl} className="w-32 h-32 rounded-3xl object-cover border-4 border-blue-50 shadow-xl" /> : (
                          <div className="w-32 h-32 rounded-3xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-blue-400"><Camera className="text-gray-300" size={40}/></div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3 rounded-2xl shadow-lg"><ImageIcon size={18}/></div>
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} />
                      <span className="text-xs font-bold text-gray-400 uppercase mt-4 tracking-tighter">Clique acima para alterar foto</span>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nome Completo</label>
                      <input required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className={inputClass} placeholder="Nome do Paciente" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">CPF</label>
                      <input value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} className={inputClass} placeholder="000.000.000-00" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Telefone</label>
                      <input value={form.telefone} onChange={handleTelefone} className={inputClass} placeholder="(00) 00000 - 0000" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Data de Nascimento</label>
                      <input type="date" value={form.data_nascimento} onChange={e => setForm({...form, data_nascimento: e.target.value})} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Convênio</label>
                      <Select value={form.convenio} onValueChange={v => setForm({...form, convenio: v})}>
                        <SelectTrigger className="bg-white h-[50px] text-base"><SelectValue /></SelectTrigger>
                        <SelectContent>{CONVENIOS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2 pt-6 border-t flex gap-4 mt-4">
                      <Button type="button" variant="ghost" onClick={limparModal} className="flex-1 font-bold h-14 rounded-2xl text-base uppercase">CANCELAR</Button>
                      <Button type="submit" className="flex-[2] bg-blue-600 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-xl text-base">SALVAR DADOS</Button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}