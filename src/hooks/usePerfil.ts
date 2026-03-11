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
            // Convertemos para minúsculo para evitar erro de digitação (Ex: Secretaria vs secretaria)
            setPerfil({
              role: data.role?.toLowerCase() || 'profissional',
              email: data.email?.toLowerCase() || user.email?.toLowerCase() || ''
            });
          } else {
            // Fallback caso o perfil não exista na tabela 'perfis' ainda
            setPerfil({ role: 'profissional', email: user.email?.toLowerCase() || '' });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    }
    getPerfil();
  }, []);

  // Definição das permissões
  const role = perfil?.role || 'profissional';
  const email = perfil?.email || '';

  return { 
    role, 
    loading, 
    // Admin se tiver o cargo OU se for o seu e-mail pessoal
    isAdmin: role === 'admin' || email === 'romulochaves77@gmail.com',
    isSecretaria: role === 'secretaria',
    isProfissional: role === 'profissional'
  };
}