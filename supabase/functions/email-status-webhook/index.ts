import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const configuredSecret = Deno.env.get('EMAIL_WEBHOOK_SECRET')
  if (!configuredSecret || request.headers.get('x-webhook-secret') !== configuredSecret) return new Response('Unauthorized', { status: 401 })
  const payload = await request.json()
  const event = payload.type || payload.event
  const providerMessageId = payload.data?.email_id || payload.data?.id || payload.email_id
  const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  if (!providerMessageId) return new Response(JSON.stringify({ ignored: true }), { headers: { 'Content-Type': 'application/json' } })

  const haltedEvents = ['email.replied', 'email.bounced', 'email.complained', 'email.unsubscribed', 'replied', 'bounced', 'complained', 'unsubscribed']
  const { data: log } = await adminClient.from('email_logs').select('lead_id').eq('provider_message_id', providerMessageId).maybeSingle()
  if (!log) return new Response(JSON.stringify({ ignored: true }), { headers: { 'Content-Type': 'application/json' } })
  await adminClient.from('email_logs').update({ event_type: event, event_at: new Date().toISOString(), replied: event.includes('reply') }).eq('provider_message_id', providerMessageId)
  if (haltedEvents.includes(event)) {
    await adminClient.from('leads').update({ sequence_halted: true, status: event.includes('unsubscribe') ? 'unsubscribed' : event.includes('reply') ? 'replied' : 'discovered', unsubscribed_at: event.includes('unsubscribe') ? new Date().toISOString() : null }).eq('id', log.lead_id)
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
})
