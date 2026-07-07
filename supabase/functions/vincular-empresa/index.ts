import { withSupabase } from '@supabase/server'

export default {
  fetch: withSupabase({ auth: 'secret' }, async (req, ctx) => {
    // Trata a requisição de preflight do CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    try {
      // Recupera os dados enviados pelo formulário do seu App React
      const { email, password, company_id } = await req.json() as {
        email?: string
        password?: string
        company_id?: string
      }

      // Validações
      if (!email) {
        return Response.json(
          { erro: 'E-mail é obrigatório.' },
          { status: 400 }
        )
      }

      if (!company_id) {
        return Response.json(
          { erro: 'ID da empresa é obrigatório.' },
          { status: 400 }
        )
      }

      // Cria o usuário corporativo com e-mail já confirmado
      const { data: userData, error: userError } = await ctx.supabase.auth.admin.createUser({
        email,
        password: password || 'SerClinCorp2026@',
        email_confirm: true,
        app_metadata: { company_id },
      })

      if (userError) {
        const mensagem = userError.message === 'User already exists'
          ? 'Este e-mail já está registrado no sistema.'
          : `Erro ao criar usuário: ${userError.message}`
        
        return Response.json(
          { erro: mensagem },
          { status: 400 }
        )
      }

      return Response.json(
        {
          mensagem: 'Gestor corporativo criado e vinculado com sucesso!',
          usuario: userData.user,
        },
        { status: 200 }
      )
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro desconhecido ao processar requisição.'
      return Response.json(
        { erro: mensagem },
        { status: 500 }
      )
    }
  }),
}