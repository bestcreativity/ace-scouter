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

const stats = [
  { label: 'Leads discovered', value: '2,847', change: '+18.4%', meta: 'vs. last 7 days', icon: Target, tone: 'blue' },
  { label: 'Emails delivered', value: '1,924', change: '+12.8%', meta: 'vs. last 7 days', icon: Send, tone: 'green' },
  { label: 'Reply rate', value: '8.6%', change: '+2.1%', meta: 'vs. last 7 days', icon: Inbox, tone: 'orange' },
  { label: 'Active campaigns', value: '04', change: 'On track', meta: 'daily automation', icon: Zap, tone: 'violet' },
]

const activity = [
  { type: 'reply', title: 'New reply from', subject: 'Dr. Maya Patel · Austin Smile Co.', time: '8 min ago', color: 'green' },
  { type: 'lead', title: 'Lead enriched', subject: 'Summit Air & Mechanical · Phoenix, AZ', time: '21 min ago', color: 'blue' },
  { type: 'send', title: 'Sequence batch sent', subject: 'HVAC Contractors · 84 emails', time: '42 min ago', color: 'orange' },
  { type: 'lead', title: 'Lead enriched', subject: 'Northline Dental Group · Denver, CO', time: '1 hr ago', color: 'blue' },
]

const pipeline = [
  { label: 'Discovered', count: 128, color: 'blue' },
  { label: 'In sequence', count: 76, color: 'orange' },
  { label: 'Replied', count: 18, color: 'green' },
  { label: 'Meeting booked', count: 7, color: 'violet' },
]

const leads = [
  { name: 'Austin Smile Co.', person: 'Dr. Maya Patel', location: 'Austin, TX', campaign: 'Dental clinics', status: 'Replied', score: 94, initials: 'AS', color: 'peach' },
  { name: 'Summit Air & Mechanical', person: 'Jordan Kim', location: 'Phoenix, AZ', campaign: 'HVAC contractors', status: 'Follow-up 2', score: 88, initials: 'SA', color: 'mint' },
  { name: 'Northline Dental Group', person: 'Elena Rodriguez', location: 'Denver, CO', campaign: 'Dental clinics', status: 'Primary sent', score: 81, initials: 'ND', color: 'lavender' },
  { name: 'Bluebird Electric', person: 'Marcus Lee', location: 'Raleigh, NC', campaign: 'Electrical services', status: 'Discovered', score: 76, initials: 'BE', color: 'sky' },
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

  const filteredLeads = useMemo(() => leads.filter((lead) =>
    `${lead.name} ${lead.person} ${lead.location}`.toLowerCase().includes(query.toLowerCase())
  ), [query])

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

          <section className="stats-grid">{stats.map(({ label, value, change, meta, icon: Icon, tone }) => <article className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div className="stat-label">{label}<span className="info-dot">i</span></div><div className="stat-value">{value}</div><div className="stat-footer"><strong className={change.includes('+') ? 'positive' : ''}>{change}</strong><span>{meta}</span></div></article>)}</section>

          <section className="dashboard-grid">
            <article className="panel chart-panel"><div className="panel-header"><div><h2>Outreach performance</h2><p>Activity across all active campaigns</p></div><button className="select-button">{range}<ChevronDown size={14} /></button></div><div className="chart-legend"><span><i className="legend-dot blue" /> Emails sent</span><span><i className="legend-dot orange" /> Replies</span></div><div className="chart-wrap"><div className="y-axis"><span>400</span><span>300</span><span>200</span><span>100</span><span>0</span></div><div className="chart"><div className="grid-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 600 190" preserveAspectRatio="none" aria-label="Outreach performance chart"><path className="chart-area" d="M0 151 C35 145 46 125 75 135 S115 130 140 110 S174 119 200 98 S228 93 252 103 S285 110 310 85 S345 82 367 91 S402 72 425 79 S458 52 480 65 S512 59 535 37 S565 46 600 21 L600 190 L0 190 Z" /><path className="chart-line blue-line" d="M0 151 C35 145 46 125 75 135 S115 130 140 110 S174 119 200 98 S228 93 252 103 S285 110 310 85 S345 82 367 91 S402 72 425 79 S458 52 480 65 S512 59 535 37 S565 46 600 21" /><path className="chart-line orange-line" d="M0 173 C38 168 53 164 75 170 S115 164 140 153 S174 160 200 145 S228 149 252 155 S285 151 310 139 S345 145 367 138 S402 129 425 133 S458 116 480 124 S512 111 535 105 S565 104 600 91" /></svg><div className="x-axis"><span>May 12</span><span>May 14</span><span>May 16</span><span>May 18</span><span>May 20</span><span>May 22</span><span>May 24</span></div></div></div></article>
            <article className="panel activity-panel"><div className="panel-header"><div><h2>Live activity</h2><p>Latest events from your workspace</p></div><button className="text-button" onClick={() => notify('Activity history opened.')}>View all <ArrowUpRight size={14} /></button></div><div className="activity-list">{activity.map((item) => <div className="activity-item" key={item.subject}><div className={`activity-icon ${item.color}`}>{item.type === 'reply' ? <Inbox size={15} /> : item.type === 'send' ? <Send size={15} /> : <Sparkles size={15} />}</div><div className="activity-copy"><span>{item.title}</span><strong>{item.subject}</strong><small>{item.time}</small></div></div>)}</div></article>
          </section>

          <section className="lower-grid"><article className="panel pipeline-panel"><div className="panel-header"><div><h2>Lead pipeline</h2><p>Current status across all campaigns</p></div><button className="text-button" onClick={() => setActiveNav('Lead CRM')}>Open CRM <ArrowUpRight size={14} /></button></div><div className="pipeline-list">{pipeline.map((item) => <div className="pipeline-row" key={item.label}><div className="pipeline-name"><i className={`pipeline-dot ${item.color}`} />{item.label}</div><strong>{item.count}</strong><div className="pipeline-bar"><span className={item.color} style={{ width: `${Math.max(18, item.count / 1.5)}%` }} /></div><span className="pipeline-percent">{Math.round(item.count / 2.29)}%</span></div>)}</div></article><article className="panel queue-panel"><div className="panel-header"><div><h2>Pitch queue</h2><p>AI drafts waiting for approval</p></div><button className="queue-count" onClick={() => setActiveNav('Pitch queue')}>12 <ChevronRight size={14} /></button></div><div className="queue-feature"><div className="sparkle-orbit"><Sparkles size={20} /></div><div><strong>Keep your voice in the loop</strong><p>Review AI-generated pitches before they send.</p></div></div><button className="outline-button" onClick={() => setActiveNav('Pitch queue')}><FileText size={15} /> Review pitches</button></article></section>

          <section className="panel leads-panel"><div className="panel-header leads-header"><div><h2>Priority leads</h2><p>Your highest-intent prospects, updated in real time</p></div><div className="lead-actions"><div className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads" /></div><button className="filter-button"><Filter size={15} /> Filters</button><button className="text-button" onClick={() => setActiveNav('Lead CRM')}>View all <ArrowUpRight size={14} /></button></div></div><div className="table-wrap"><table><thead><tr><th>Company</th><th>Campaign</th><th>Lead score</th><th>Status</th><th>Last activity</th><th /></tr></thead><tbody>{filteredLeads.map((lead, index) => <tr key={lead.name}><td><div className="company-cell"><div className={`company-avatar ${lead.color}`}>{lead.initials}</div><div><strong>{lead.name}</strong><span>{lead.person} · {lead.location}</span></div></div></td><td><span className="campaign-tag"><Building2 size={13} />{lead.campaign}</span></td><td><div className="score"><span className="score-ring" style={{ '--score': `${lead.score * 3.6}deg` }}>{lead.score}</span><span>{lead.score > 90 ? 'High intent' : lead.score > 80 ? 'Warm' : 'New'}</span></div></td><td><span className={`status-pill ${lead.status.toLowerCase().replace(' ', '-')}`}><i />{lead.status}</span></td><td><span className="last-activity">{index === 0 ? '8 min ago' : index === 1 ? '21 min ago' : index === 2 ? '1 hr ago' : '2 hrs ago'}</span></td><td><button className="row-menu" aria-label={`Open ${lead.name}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div></section>
        </> : <PlaceholderView activeNav={activeNav} onPrimary={() => setShowCampaign(true)} />}
      </main>
      {showCampaign && <CampaignModal onClose={() => setShowCampaign(false)} onCreate={() => { setShowCampaign(false); notify('Campaign created and queued for discovery.') }} />}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  )
}

function PlaceholderView({ activeNav, onPrimary }) {
  const configs = { Campaigns: ['Campaign builder', 'Turn a target market into a living pipeline.', 'Build campaign'], 'Lead CRM': ['Lead CRM', 'Every prospect, signal, and next step in one place.', 'Import leads'], 'Pitch queue': ['Pitch queue', 'Your best AI drafts, ready for a human green light.', 'Review queue'], Integrations: ['Integrations', 'Connect the tools that power your prospecting engine.', 'Add integration'] }
  const [title, copy, action] = configs[activeNav] || configs.Campaigns
  return <section className="placeholder-view"><div className="placeholder-icon"><SlidersHorizontal size={25} /></div><div className="eyebrow"><Sparkles size={13} /> Workspace module</div><h1>{title}</h1><p>{copy}</p><button className="primary-button" onClick={onPrimary}><Plus size={17} /> {action}</button></section>
}

function CampaignModal({ onClose, onCreate }) {
  const [linkedin, setLinkedin] = useState(false)
  const [approval, setApproval] = useState(true)
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="campaign-modal"><div className="modal-header"><div><div className="eyebrow"><Target size={13} /> New campaign</div><h2>Find your next best customers.</h2><p>Set a target and ACE will handle discovery, enrichment, and outreach.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div><div className="modal-body"><label>Target niche<input defaultValue="Dental clinics" /></label><label>Location / region<input defaultValue="Austin, TX" /></label><div className="field-row"><label>Daily prospect limit<div className="number-input"><input type="number" defaultValue="200" /><span>leads / day</span></div></label><label>Sequence delay<select defaultValue="3"><option value="3">3 days between steps</option><option value="5">5 days between steps</option><option value="7">7 days between steps</option></select></label></div><div className="modal-section-label">Discovery sources</div><Toggle label="Google Places / Local Search" detail="Find verified local businesses" icon={<Globe2 size={17} />} enabled /><Toggle label="Corporate registry & web crawler" detail="Enrich domains and company data" icon={<Building2 size={17} />} enabled /><Toggle label="LinkedIn profile enrichment" detail="Identify key decision-makers" icon={<Users size={17} />} enabled={linkedin} onToggle={() => setLinkedin(!linkedin)} /><div className="modal-section-label">Launch preferences</div><Toggle label="Review AI pitches before sending" detail="Keep approval control over every first touch" icon={<Sparkles size={17} />} enabled={approval} onToggle={() => setApproval(!approval)} /></div><div className="modal-footer"><span><Clock3 size={14} /> Estimated first scan: under 5 min</span><button className="primary-button" onClick={onCreate}><Zap size={16} /> Launch campaign</button></div></div></div>
}

function Toggle({ label, detail, icon, enabled, onToggle }) { return <button className="toggle-row" onClick={onToggle}><div className="toggle-icon">{icon}</div><div className="toggle-copy"><strong>{label}</strong><span>{detail}</span></div><span className={`toggle ${enabled ? 'on' : ''}`}><i /></span></button> }

createRoot(document.getElementById('root')).render(<App />)
