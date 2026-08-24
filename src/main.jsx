import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity, ArrowUpRight, BarChart3, Bell, Building2, Check, ChevronDown, ChevronRight,
  CircleHelp, Clock3, FileText, Filter, Globe2, Inbox, LayoutDashboard, Menu, MoreHorizontal,
  LockKeyhole, LogOut, PanelLeftClose, Plus, Search, Send, Settings, SlidersHorizontal,
  Sparkles, Target, Users, X, Zap
} from 'lucide-react'
import { supabase } from './lib/supabase'
import './styles.css'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Campaigns', icon: Target, badge: '4' },
  { label: 'Lead CRM', icon: Users },
  { label: 'Pitch queue', icon: Sparkles, badge: '12' },
  { label: 'Integrations', icon: Settings },
]

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return undefined

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (!supabase) return <AuthScreen configurationError="Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local .env file." />
  if (authLoading) return <div className="auth-shell"><div className="auth-loading">Loading your workspace...</div></div>
  if (!session) return <AuthScreen />

  return <Dashboard session={session} />
}

function AuthScreen({ configurationError }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!supabase) return
    setLoading(true)
    setMessage('')
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      : await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (result.error) setMessage(result.error.message)
    else if (mode === 'signup') setMessage('Check your email to confirm your account, then sign in.')
  }

  return <div className="auth-shell"><div className="auth-glow" /><main className="auth-card"><div className="auth-brand"><div className="brand-mark"><span>A</span></div><div className="brand-copy"><strong>ACE</strong><span>SCOUTER</span></div></div><div className="auth-icon"><LockKeyhole size={21} /></div><div className="eyebrow"><Sparkles size={13} /> Prospecting command center</div><h1>{mode === 'signin' ? 'Welcome back.' : 'Start scouting smarter.'}</h1><p className="auth-subtitle">{mode === 'signin' ? 'Sign in to continue to your workspace.' : 'Create your workspace and turn local demand into pipeline.'}</p>{configurationError && <div className="auth-message error">{configurationError}</div>}{!configurationError && <form onSubmit={submit}>{mode === 'signup' && <label>Full name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Jordan Davis" /></label>}<label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label><label>Password<input required minLength="6" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>{message && <div className={`auth-message ${message.startsWith('Check') ? 'success' : 'error'}`}>{message}</div>}<button className="primary-button auth-submit" disabled={loading}>{loading ? 'Connecting...' : mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowUpRight size={15} /></button></form>}<button className="auth-switch" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }}>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button></main></div>
}

function Dashboard({ session }) {
  const [activeNav, setActiveNav] = useState('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 760)
  const [showCampaign, setShowCampaign] = useState(false)
  const [range, setRange] = useState('Last 7 days')
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [campaigns, setCampaigns] = useState([])
  const [leads, setLeads] = useState([])
  const [emailLogs, setEmailLogs] = useState([])
  const [drafts, setDrafts] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState('')

  const loadData = async () => {
    setDataLoading(true)
    setDataError('')
    const [campaignResult, leadResult, emailResult, draftResult] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('*, campaigns(target_niche, location)').order('created_at', { ascending: false }),
      supabase.from('email_logs').select('*').order('sent_at', { ascending: false }),
      supabase.from('pitch_drafts').select('*, leads(business_name, decision_maker_name, decision_maker_email, campaigns(target_niche, location))').order('created_at', { ascending: false }),
    ])
    const draftTableMissing = draftResult.error?.code === '42P01'
    const failure = campaignResult.error || leadResult.error || emailResult.error || (!draftTableMissing && draftResult.error)
    if (failure) setDataError(failure.message)
    else {
      setCampaigns(campaignResult.data || [])
      setLeads(leadResult.data || [])
      setEmailLogs(emailResult.data || [])
      setDrafts(draftTableMissing ? [] : (draftResult.data || []))
    }
    setDataLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const liveStats = [
    { label: 'Leads discovered', value: leads.length.toLocaleString(), change: '', meta: 'all campaigns', icon: Target, tone: 'blue' },
    { label: 'Emails delivered', value: emailLogs.length.toLocaleString(), change: '', meta: 'tracked sends', icon: Send, tone: 'green' },
    { label: 'Reply rate', value: emailLogs.length ? `${Math.round((emailLogs.filter((log) => log.replied).length / emailLogs.length) * 100)}%` : '0%', change: '', meta: 'tracked replies', icon: Inbox, tone: 'orange' },
    { label: 'Active campaigns', value: campaigns.filter((campaign) => campaign.status === 'active').length.toString().padStart(2, '0'), change: '', meta: 'in this workspace', icon: Zap, tone: 'violet' },
  ]

  const livePipeline = ['discovered', 'primary_sent', 'followup_1', 'followup_2', 'followup_3', 'followup_4', 'followup_5', 'replied'].map((status) => ({
    label: status === 'primary_sent' ? 'Primary sent' : status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    count: leads.filter((lead) => lead.status === status).length,
    color: status === 'replied' ? 'green' : status === 'discovered' ? 'blue' : 'orange',
  }))

  const filteredLeads = useMemo(() => leads.filter((lead) =>
    `${lead.business_name} ${lead.decision_maker_name || ''} ${lead.campaigns?.location || ''}`.toLowerCase().includes(query.toLowerCase())
  ), [query])

  const createCampaign = async (campaign) => {
    const { data, error } = await supabase.from('campaigns').insert({ ...campaign, user_id: session.user.id }).select().single()
    if (error) throw error
    await loadData()
    return data
  }

  const scoutCampaign = async (campaign) => {
    const location = encodeURIComponent(campaign.location)
    const geocodeResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${location}`)
    if (!geocodeResponse.ok) throw new Error('The free map service could not find that location.')
    const [place] = await geocodeResponse.json()
    if (!place) throw new Error('Location not found. Try a city and region, such as Austin, TX.')
    const query = `[out:json][timeout:25];(nwr["name"](${place.boundingbox[0]},${place.boundingbox[2]},${place.boundingbox[1]},${place.boundingbox[3]}););out center tags;`
    const discoveryResponse = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
    if (!discoveryResponse.ok) throw new Error('The free scouting service is busy. Try again in a moment.')
    const discovery = await discoveryResponse.json()
    const results = (discovery.elements || []).filter((element) => element.tags?.name).slice(0, Math.min(campaign.daily_limit, 10))
    if (!results.length) return 0
    const rows = results.map((element) => ({
      campaign_id: campaign.id,
      business_name: element.tags.name,
      website: element.tags.website || element.tags['contact:website'] || null,
      status: 'discovered',
      lead_score: 50,
    }))
    const { error } = await supabase.from('leads').insert(rows)
    if (error) throw error
    await loadData()
    return rows.length
  }

  const generateDrafts = async () => {
    const freshLeads = leads.filter((lead) => lead.status === 'discovered' && !drafts.some((draft) => draft.lead_id === lead.id))
    if (!freshLeads.length) return 0
    const rows = freshLeads.map((lead) => ({ lead_id: lead.id, subject: `A quick idea for ${lead.business_name}`, body: `Hi${lead.decision_maker_name ? ` ${lead.decision_maker_name}` : ''},\n\nI found ${lead.business_name} while researching ${lead.campaigns?.target_niche || 'local businesses'} in ${lead.campaigns?.location || 'your area'}. I noticed an opportunity to help you turn more local interest into qualified conversations.\n\nWould it be useful to compare notes for 15 minutes next week?\n\nBest,\n${session.user.user_metadata?.full_name || 'Your name'}`, status: 'pending' }))
    const { error } = await supabase.from('pitch_drafts').insert(rows)
    if (error) throw error
    await loadData()
    return rows.length
  }

  const updateDraft = async (id, status) => {
    const { error } = await supabase.from('pitch_drafts').update({ status }).eq('id', id)
    if (error) throw error
    await loadData()
  }

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="brand-row">
          <div className="brand-mark"><span>A</span></div>
          {sidebarOpen && <div className="brand-copy"><strong>ACE</strong><span>SCOUTER</span></div>}
          {sidebarOpen && <button className="icon-button sidebar-toggle" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar"><PanelLeftClose size={17} /></button>}
        </div>
        {!sidebarOpen && <button className="icon-button expand-button" onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar"><Menu size={19} /></button>}
        <div className="workspace-switcher">
          <div className="workspace-avatar">AC</div>
          {sidebarOpen && <><div className="workspace-copy"><strong>Acme Growth</strong><span>Team workspace</span></div><ChevronDown size={15} /></>}
        </div>
        {sidebarOpen && <p className="nav-label">Workspace</p>}
        <nav className="main-nav">
          {navItems.map(({ label, icon: Icon, badge }) => (
            <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => setActiveNav(label)} title={label}>
              <Icon size={18} strokeWidth={activeNav === label ? 2.5 : 1.8} />
              {sidebarOpen && <span>{label}</span>}
              {sidebarOpen && badge && <small>{badge}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {sidebarOpen && <div className="usage-card"><div className="usage-top"><span>Monthly leads</span><strong>68%</strong></div><div className="progress"><span /></div><p>6,812 of 10,000 used</p><button onClick={() => notify('Upgrade flow is ready to connect.')}>Upgrade plan <ArrowUpRight size={13} /></button></div>}
          <button className="profile-row" onClick={() => supabase.auth.signOut()}><div className="profile-avatar">{(session.user.user_metadata?.full_name || session.user.email || 'U').slice(0, 2).toUpperCase()}</div>{sidebarOpen && <><div className="profile-copy"><strong>{session.user.user_metadata?.full_name || session.user.email}</strong><span>Sign out</span></div><LogOut size={15} /></>}</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>{activeNav}</span>{activeNav === 'Overview' && <><ChevronRight size={14} /><strong>Command center</strong></>}</div>
          <div className="topbar-actions"><button className="help-button"><CircleHelp size={17} /> Help center</button><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button><button className="mobile-menu icon-button" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={19} /></button></div>
        </header>

        {activeNav === 'Overview' ? <>
          <section className="hero-row"><div><div className="eyebrow"><Activity size={13} /> Live command center</div><h1>Good morning, Jordan<span>.</span></h1><p>Here’s what’s moving across your prospecting engine.</p></div><button className="primary-button" onClick={() => setShowCampaign(true)}><Plus size={17} /> New campaign</button></section>

          <section className="stats-grid">{liveStats.map(({ label, value, change, meta, icon: Icon, tone }) => <article className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div className="stat-label">{label}<span className="info-dot">i</span></div><div className="stat-value">{dataLoading ? '...' : value}</div><div className="stat-footer"><strong className={change.includes('+') ? 'positive' : ''}>{change || 'Live'}</strong><span>{meta}</span></div></article>)}</section>

          <section className="dashboard-grid">
            <article className="panel chart-panel"><div className="panel-header"><div><h2>Outreach performance</h2><p>Activity across all active campaigns</p></div><button className="select-button">{range}<ChevronDown size={14} /></button></div><div className="chart-legend"><span><i className="legend-dot blue" /> Emails sent</span><span><i className="legend-dot orange" /> Replies</span></div><div className="chart-wrap"><div className="y-axis"><span>400</span><span>300</span><span>200</span><span>100</span><span>0</span></div><div className="chart"><div className="grid-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 600 190" preserveAspectRatio="none" aria-label="Outreach performance chart"><path className="chart-area" d="M0 151 C35 145 46 125 75 135 S115 130 140 110 S174 119 200 98 S228 93 252 103 S285 110 310 85 S345 82 367 91 S402 72 425 79 S458 52 480 65 S512 59 535 37 S565 46 600 21 L600 190 L0 190 Z" /><path className="chart-line blue-line" d="M0 151 C35 145 46 125 75 135 S115 130 140 110 S174 119 200 98 S228 93 252 103 S285 110 310 85 S345 82 367 91 S402 72 425 79 S458 52 480 65 S512 59 535 37 S565 46 600 21" /><path className="chart-line orange-line" d="M0 173 C38 168 53 164 75 170 S115 164 140 153 S174 160 200 145 S228 149 252 155 S285 151 310 139 S345 145 367 138 S402 129 425 133 S458 116 480 124 S512 111 535 105 S565 104 600 91" /></svg><div className="x-axis"><span>May 12</span><span>May 14</span><span>May 16</span><span>May 18</span><span>May 20</span><span>May 22</span><span>May 24</span></div></div></div></article>
            <article className="panel activity-panel"><div className="panel-header"><div><h2>Live activity</h2><p>Latest events from your workspace</p></div></div><div className="empty-panel"><Activity size={18} /><strong>{dataLoading ? 'Loading activity...' : 'No activity yet'}</strong><span>{dataLoading ? 'Fetching your latest events.' : 'Launch a campaign to start seeing events here.'}</span></div></article>
          </section>

          <section className="lower-grid"><article className="panel pipeline-panel"><div className="panel-header"><div><h2>Lead pipeline</h2><p>Current status across all campaigns</p></div><button className="text-button" onClick={() => setActiveNav('Lead CRM')}>Open CRM <ArrowUpRight size={14} /></button></div><div className="pipeline-list">{livePipeline.map((item) => <div className="pipeline-row" key={item.label}><div className="pipeline-name"><i className={`pipeline-dot ${item.color}`} />{item.label}</div><strong>{dataLoading ? '...' : item.count}</strong><div className="pipeline-bar"><span className={item.color} style={{ width: `${Math.max(18, item.count / 1.5)}%` }} /></div><span className="pipeline-percent">{leads.length ? `${Math.round((item.count / leads.length) * 100)}%` : '0%'}</span></div>)}</div></article><article className="panel queue-panel"><div className="panel-header"><div><h2>Pitch queue</h2><p>AI drafts waiting for approval</p></div><button className="queue-count" onClick={() => setActiveNav('Pitch queue')}>0 <ChevronRight size={14} /></button></div><div className="queue-feature"><div className="sparkle-orbit"><Sparkles size={20} /></div><div><strong>No pitches waiting</strong><p>Approved campaigns will create drafts here.</p></div></div><button className="outline-button" onClick={() => setActiveNav('Pitch queue')}><FileText size={15} /> Open pitch queue</button></article></section>

          <section className="panel leads-panel"><div className="panel-header leads-header"><div><h2>Priority leads</h2><p>Your highest-intent prospects, updated in real time</p></div><div className="lead-actions"><div className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads" /></div><button className="filter-button"><Filter size={15} /> Filters</button><button className="text-button" onClick={() => setActiveNav('Lead CRM')}>View all <ArrowUpRight size={14} /></button></div></div><div className="table-wrap">{dataError ? <div className="empty-panel error-state"><X size={18} /><strong>Could not load workspace data</strong><span>{dataError}</span></div> : filteredLeads.length === 0 && !dataLoading ? <div className="empty-panel"><Users size={18} /><strong>No leads yet</strong><span>Create a campaign to begin discovering prospects.</span><button className="outline-button" onClick={() => setShowCampaign(true)}>Create your first campaign</button></div> : <table><thead><tr><th>Company</th><th>Campaign</th><th>Lead score</th><th>Status</th><th>Last activity</th><th /></tr></thead><tbody>{filteredLeads.map((lead, index) => { const name = lead.business_name; const person = lead.decision_maker_name || 'Decision-maker not enriched'; const location = lead.campaigns?.location || 'Location unavailable'; const campaign = lead.campaigns?.target_niche || 'Unassigned'; const status = lead.status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); const score = lead.lead_score || 0; return <tr key={lead.id}><td><div className="company-cell"><div className="company-avatar sky">{name.slice(0, 2).toUpperCase()}</div><div><strong>{name}</strong><span>{person} · {location}</span></div></div></td><td><span className="campaign-tag"><Building2 size={13} />{campaign}</span></td><td><div className="score"><span className="score-ring" style={{ '--score': `${score * 3.6}deg` }}>{score}</span><span>{score > 90 ? 'High intent' : score > 80 ? 'Warm' : 'New'}</span></div></td><td><span className={`status-pill ${lead.status.replace('_', '-')}`}><i />{status}</span></td><td><span className="last-activity">{index === 0 ? 'Latest' : 'Earlier'}</span></td><td><button className="row-menu" aria-label={`Open ${name}`}><MoreHorizontal size={17} /></button></td></tr> })}</tbody></table>}</div></section>
        </> : activeNav === 'Pitch queue' ? <PitchQueue drafts={drafts} onGenerate={async () => { try { const count = await generateDrafts(); notify(count ? `${count} pitch drafts created.` : 'No new leads need drafts.') } catch (error) { notify(`Could not create drafts: ${error.message}`) } }} onUpdate={async (id, status) => { try { await updateDraft(id, status); notify(`Draft ${status}.`) } catch (error) { notify(`Could not update draft: ${error.message}`) } }} /> : <PlaceholderView activeNav={activeNav} onPrimary={() => setShowCampaign(true)} />}
      </main>
      {showCampaign && <CampaignModal onClose={() => setShowCampaign(false)} onCreate={async (campaign) => { try { const savedCampaign = await createCampaign(campaign); setShowCampaign(false); notify('Campaign saved. Scouting nearby businesses...'); const count = await scoutCampaign(savedCampaign); notify(count ? `Scouting complete: ${count} leads added.` : 'Campaign saved, but no named businesses were found.') } catch (error) { notify(`Could not complete campaign: ${error.message}`); throw error } }} />}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  )
}

function PitchQueue({ drafts, onGenerate, onUpdate }) {
  return <section className="module-view"><div className="eyebrow"><Sparkles size={13} /> Human review</div><div className="module-heading"><div><h1>Pitch queue</h1><p>Review personalized drafts before anything can be sent.</p></div><button className="primary-button" onClick={onGenerate}><Sparkles size={15} /> Generate drafts</button></div>{drafts.length === 0 ? <div className="panel empty-module"><Sparkles size={20} /><strong>No drafts waiting</strong><span>Generate drafts from discovered leads when your pipeline has prospects.</span></div> : <div className="draft-list">{drafts.map((draft) => <article className="panel draft-card" key={draft.id}><div className="draft-meta"><span>{draft.leads?.business_name || 'Unknown business'}</span><small>{draft.leads?.decision_maker_email || 'Email not enriched'}</small></div><h2>{draft.subject}</h2><p>{draft.body}</p><div className="draft-footer"><span className={`draft-status ${draft.status}`}>{draft.status}</span>{draft.status === 'pending' && <div><button className="outline-button" onClick={() => onUpdate(draft.id, 'rejected')}>Reject</button><button className="primary-button" onClick={() => onUpdate(draft.id, 'approved')}><Check size={14} /> Approve</button></div>}</div></article>)}</div>}</section>
}

function PlaceholderView({ activeNav, onPrimary }) {
  const configs = { Campaigns: ['Campaign builder', 'Turn a target market into a living pipeline.', 'Build campaign'], 'Lead CRM': ['Lead CRM', 'Every prospect, signal, and next step in one place.', 'Import leads'], 'Pitch queue': ['Pitch queue', 'Your best AI drafts, ready for a human green light.', 'Review queue'], Integrations: ['Integrations', 'Connect the tools that power your prospecting engine.', 'Add integration'] }
  const [title, copy, action] = configs[activeNav] || configs.Campaigns
  return <section className="placeholder-view"><div className="placeholder-icon"><SlidersHorizontal size={25} /></div><div className="eyebrow"><Sparkles size={13} /> Workspace module</div><h1>{title}</h1><p>{copy}</p><button className="primary-button" onClick={onPrimary}><Plus size={17} /> {action}</button></section>
}

function CampaignModal({ onClose, onCreate }) {
  const [linkedin, setLinkedin] = useState(false)
  const [approval, setApproval] = useState(true)
  const [saving, setSaving] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    const form = new FormData(event.currentTarget)
    try {
      await onCreate({ target_niche: form.get('target_niche'), location: form.get('location'), daily_limit: Number(form.get('daily_limit')), status: 'active' })
    } catch (error) {
      setSaving(false)
    }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="campaign-modal" onSubmit={submit}><div className="modal-header"><div><div className="eyebrow"><Target size={13} /> New campaign</div><h2>Find your next best customers.</h2><p>Set a target and ACE will handle discovery, enrichment, and outreach.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div><div className="modal-body"><label>Target niche<input name="target_niche" required defaultValue="Dental clinics" /></label><label>Location / region<input name="location" required defaultValue="Austin, TX" /></label><div className="field-row"><label>Daily prospect limit<div className="number-input"><input name="daily_limit" type="number" min="1" max="10" defaultValue="10" required /><span>max 10 free</span></div></label><label>Sequence delay<select name="sequence_delay" defaultValue="3"><option value="3">3 days between steps</option><option value="5">5 days between steps</option><option value="7">7 days between steps</option></select></label></div><div className="modal-section-label">Discovery sources</div><Toggle label="OpenStreetMap local search" detail="Free named-business discovery" icon={<Globe2 size={17} />} enabled /><Toggle label="Website links" detail="Save public websites when available" icon={<Building2 size={17} />} enabled /><Toggle label="Decision-maker enrichment" detail="Connect a provider later" icon={<Users size={17} />} enabled={linkedin} onToggle={() => setLinkedin(!linkedin)} /><div className="modal-section-label">Launch preferences</div><Toggle label="Review AI pitches before sending" detail="Keep approval control over every first touch" icon={<Sparkles size={17} />} enabled={approval} onToggle={() => setApproval(!approval)} /></div><div className="modal-footer"><span><Clock3 size={14} /> Free scouting limit: 10 leads</span><button className="primary-button" disabled={saving}><Zap size={16} /> {saving ? 'Scouting...' : 'Launch campaign'}</button></div></form></div>
}

function Toggle({ label, detail, icon, enabled, onToggle }) { return <button className="toggle-row" onClick={onToggle}><div className="toggle-icon">{icon}</div><div className="toggle-copy"><strong>{label}</strong><span>{detail}</span></div><span className={`toggle ${enabled ? 'on' : ''}`}><i /></span></button> }

createRoot(document.getElementById('root')).render(<App />)
