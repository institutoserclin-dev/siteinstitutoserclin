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
            // Limpeza rigorosa: remove acentos e espaços
            const roleLimpa = data.role?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || 'profissional';
            setPerfil({
              role: roleLimpa,
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

  // Definições claras de poder
  const isAdmin = role.includes('admin') || email === 'romulochaves77@gmail.com';
  const isSecretaria = role.includes('secretaria') || role.includes('recep');
  
  return { 
    role, 
    loading, 
    isAdmin,
    isSecretaria,
    isProfissional: !isAdmin && !isSecretaria,
    // Ver tudo: Se for admin OU secretaria
    podeVerTudo: isAdmin || isSecretaria 
  };
}