import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function usePerfil() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('perfis')
          .select('role')
          .eq('id', user.id)
          .single();
        setRole(data?.role || 'profissional');
      }
      setLoading(false);
    }
    getPerfil();
  }, []);

  return { 
    role, 
    loading, 
    isAdmin: role === 'admin',
    isSecretaria: role === 'secretaria',
    isProfissional: role === 'profissional'
  };
}