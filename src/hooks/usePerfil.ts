import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function usePerfil() {
  const [perfil, setPerfil] = useState<{role: string, email: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getPerfil() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('perfis')
            .select('role, email')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            setPerfil({
              // Removemos espaços e acentos para a comparação ficar segura
              role: data.role?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || 'profissional',
              email: data.email?.toLowerCase() || user.email?.toLowerCase() || ''
            });
          } else {
            setPerfil({ role: 'profissional', email: user.email?.toLowerCase() || '' });
          }
        }
      } catch (err) {
        console.error("Erro SerClin Perfil:", err);
      } finally {
        setLoading(false);
      }
    }
    getPerfil();
  }, []);

  const role = perfil?.role || 'profissional';
  const email = perfil?.email || '';

  return { 
    role, 
    loading, 
    // AGORA ACEITA QUALQUER VARIAÇÃO DE ADMIN OU O SEU EMAIL
    isAdmin: role.includes('admin') || email === 'romulochaves77@gmail.com',
    // AGORA ACEITA "secretaria" OU "secretária" POIS LIMPAMOS O ACENTO ACIMA
    isSecretaria: role === 'secretaria',
    isProfissional: role === 'profissional'
  };
}