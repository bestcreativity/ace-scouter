import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) throw new Error('Authentication required')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const adminClient = createClient(supabaseUrl, serviceKey)
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) throw new Error('Authentication required')

    const { draftId } = await request.json()
    if (!draftId) throw new Error('draftId is required')
    const { data: draft, error: draftError } = await userClient
      .from('pitch_drafts')
      .select('id, subject, body, status, leads(id, business_name, decision_maker_email, email_verified, sequence_halted, campaigns(user_id))')
      .eq('id', draftId)
      .single()
    if (draftError || !draft) throw new Error('Draft not found')
    const lead = Array.isArray(draft.leads) ? draft.leads[0] : draft.leads
    const campaign = Array.isArray(lead?.campaigns) ? lead.campaigns[0] : lead?.campaigns
    if (campaign?.user_id !== user.id) throw new Error('Draft is not owned by this user')
    if (draft.status !== 'approved') throw new Error('Only approved drafts can be sent')
    if (!lead?.decision_maker_email || !lead.email_verified) throw new Error('A verified recipient email is required')
    if (lead.sequence_halted) throw new Error('This lead sequence is halted')

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('RESEND_FROM_EMAIL')
    if (!resendKey || !from) throw new Error('Email provider is not configured')
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [lead.decision_maker_email], subject: draft.subject, text: `${draft.body}\n\nTo stop future messages, reply with unsubscribe.` }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || 'Email provider rejected the message')
    await adminClient.from('email_logs').insert({ lead_id: lead.id, email_type: 'initial', provider_message_id: result.id, event_type: 'sent', sent_at: new Date().toISOString() })
    await adminClient.from('leads').update({ status: 'primary_sent' }).eq('id', lead.id)
    return new Response(JSON.stringify({ ok: true, providerMessageId: result.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
