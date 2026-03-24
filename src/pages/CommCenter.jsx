import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Radio, Megaphone, Send, RefreshCw,
  Plane, Zap, AlertTriangle, Users, Wrench, Plus, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { id: 'ops-general',   label: 'Ops General',   icon: Radio,         color: 'text-primary' },
  { id: 'dispatch',      label: 'Dispatch',       icon: Plane,         color: 'text-blue-400' },
  { id: 'maintenance',   label: 'Maintenance',    icon: Wrench,        color: 'text-orange-400' },
  { id: 'cabin-crew',    label: 'Cabin Crew',     icon: Users,         color: 'text-purple-400' },
  { id: 'flight-crew',   label: 'Flight Crew',    icon: Plane,         color: 'text-green-400' },
];

const ROLES = ['dispatcher', 'captain', 'first_officer', 'flight_attendant', 'maintenance', 'ops', 'admin'];

const ROLE_COLORS = {
  dispatcher:       'text-blue-400 bg-blue-500/15',
  captain:          'text-primary bg-primary/15',
  first_officer:    'text-yellow-400 bg-yellow-500/15',
  flight_attendant: 'text-purple-400 bg-purple-500/15',
  maintenance:      'text-orange-400 bg-orange-500/15',
  ops:              'text-green-400 bg-green-500/15',
  admin:            'text-red-400 bg-red-500/15',
};

const PRIORITY_CFG = {
  normal:    { color: 'text-muted-foreground', bg: '' },
  urgent:    { color: 'text-orange-400',       bg: 'bg-orange-500/10 border-l-2 border-orange-500' },
  emergency: { color: 'text-destructive',      bg: 'bg-destructive/10 border-l-2 border-destructive' },
};

const TABS = [
  { key: 'chat',      label: 'Channels',   icon: MessageSquare },
  { key: 'acars',     label: 'ACARS',      icon: Radio },
  { key: 'broadcast', label: 'Broadcast',  icon: Megaphone },
];

// ── Message Bubble ─────────────────────────────────────────────────────────
function MessageBubble({ msg, currentUser }) {
  const isMine = msg.sender_email === currentUser?.email;
  const pri = PRIORITY_CFG[msg.priority] || PRIORITY_CFG.normal;
  const ts = msg.created_date
    ? new Date(msg.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';

  return (
    <div className={cn('flex gap-2 mb-3', isMine ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5',
        ROLE_COLORS[msg.sender_role] || 'bg-muted text-muted-foreground')}>
        {msg.sender_name?.[0]?.toUpperCase() || '?'}
      </div>
      <div className={cn('max-w-[75%]', isMine ? 'items-end' : 'items-start', 'flex flex-col gap-0.5')}>
        {!isMine && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[10px] font-bold text-foreground">{msg.sender_name}</span>
            {msg.sender_role && (
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', ROLE_COLORS[msg.sender_role])}>
                {msg.sender_role.replace('_', ' ').toUpperCase()}
              </span>
            )}
          </div>
        )}
        <div className={cn(
          'rounded-2xl px-3 py-2 text-sm leading-relaxed',
          pri.bg,
          isMine ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border border-border rounded-tl-sm text-foreground'
        )}>
          {msg.flight_number && (
            <span className={cn('text-[10px] font-mono font-bold block mb-0.5', isMine ? 'text-primary-foreground/70' : 'text-primary')}>
              ✈ {msg.flight_number}
            </span>
          )}
          {msg.priority !== 'normal' && (
            <span className={cn('text-[10px] font-bold uppercase block mb-0.5', pri.color)}>
              {msg.priority === 'emergency' ? '🚨 EMERGENCY' : '⚠ URGENT'}
            </span>
          )}
          {msg.content}
        </div>
        <span className="text-[9px] text-muted-foreground px-1">{ts}</span>
      </div>
    </div>
  );
}

// ── Chat Tab ───────────────────────────────────────────────────────────────
function ChatTab({ currentUser }) {
  const [channel, setChannel] = useState('ops-general');
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState('normal');
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['comm-chat', channel],
    queryFn: () => base44.entities.CommMessage.filter({ channel, message_type: 'chat' }, '-created_date', 60),
    refetchInterval: 5000,
  });

  const sorted = [...messages].reverse();

  useEffect(() => {
    // Subscribe to real-time updates
    const unsub = base44.entities.CommMessage.subscribe((event) => {
      if (event.data?.channel === channel && event.data?.message_type === 'chat') {
        queryClient.invalidateQueries({ queryKey: ['comm-chat', channel] });
      }
    });
    return unsub;
  }, [channel, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sorted.length]);

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.CommMessage.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comm-chat', channel] }),
  });

  const send = () => {
    if (!input.trim()) return;
    sendMutation.mutate({
      channel,
      message_type: 'chat',
      sender_name: currentUser?.full_name || 'Unknown',
      sender_email: currentUser?.email || '',
      sender_role: currentUser?.role || 'ops',
      content: input.trim(),
      priority,
    });
    setInput('');
    setPriority('normal');
  };

  const activeCh = CHANNELS.find(c => c.id === channel);

  return (
    <div className="flex h-full">
      {/* Channel sidebar */}
      <div className="w-36 flex-shrink-0 border-r border-border bg-card flex flex-col py-2">
        <p className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2">Channels</p>
        {CHANNELS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setChannel(id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all text-left',
              channel === id ? 'bg-primary/15 text-primary border-r-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', channel === id ? 'text-primary' : color)} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-2.5 border-b border-border bg-secondary/30 flex items-center gap-2">
          {activeCh && <activeCh.icon className={cn('w-4 h-4', activeCh.color)} />}
          <p className="text-xs font-bold text-foreground"># {activeCh?.label}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {sorted.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-8">No messages yet in #{activeCh?.label}</p>
          )}
          {sorted.map(msg => <MessageBubble key={msg.id} msg={msg} currentUser={currentUser} />)}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 bg-card space-y-2">
          <div className="flex gap-1">
            {['normal', 'urgent', 'emergency'].map(p => (
              <button key={p} onClick={() => setPriority(p)}
                className={cn('text-[10px] font-bold px-2 py-1 rounded-lg transition-all capitalize',
                  priority === p
                    ? p === 'emergency' ? 'bg-destructive text-white' : p === 'urgent' ? 'bg-orange-500 text-white' : 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}>{p}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={`Message #${activeCh?.label}…`}
              className="flex-1 h-9 bg-secondary border border-border rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={send} disabled={!input.trim()}
              className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ACARS Tab ──────────────────────────────────────────────────────────────
function AcarsTab({ currentUser }) {
  const [flightFilter, setFlightFilter] = useState('');
  const [input, setInput] = useState('');
  const [flightNum, setFlightNum] = useState('');
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['comm-acars'],
    queryFn: () => base44.entities.CommMessage.filter({ message_type: 'acars' }, '-created_date', 100),
    refetchInterval: 5000,
  });

  useEffect(() => {
    const unsub = base44.entities.CommMessage.subscribe((event) => {
      if (event.data?.message_type === 'acars') {
        queryClient.invalidateQueries({ queryKey: ['comm-acars'] });
      }
    });
    return unsub;
  }, [queryClient]);

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.CommMessage.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['comm-acars'] }); setInput(''); },
  });

  const filtered = flightFilter
    ? messages.filter(m => m.flight_number?.toLowerCase().includes(flightFilter.toLowerCase()))
    : messages;

  return (
    <div className="flex flex-col h-full">
      {/* Compose */}
      <div className="p-4 border-b border-border bg-card space-y-2">
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Send ACARS Message</p>
        <div className="flex gap-2">
          <input type="text" value={flightNum} onChange={e => setFlightNum(e.target.value.toUpperCase())}
            placeholder="Flight # (e.g. AAL4474)"
            className="w-32 h-9 bg-secondary border border-border rounded-xl px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && flightNum && input.trim() && sendMutation.mutate({ channel: 'acars', message_type: 'acars', sender_name: currentUser?.full_name || 'Dispatch', sender_email: currentUser?.email || '', sender_role: currentUser?.role || 'dispatcher', content: input.trim(), flight_number: flightNum, priority: 'normal' })}
            placeholder="ACARS message text…"
            className="flex-1 h-9 bg-secondary border border-border rounded-xl px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          <button
            onClick={() => flightNum && input.trim() && sendMutation.mutate({ channel: 'acars', message_type: 'acars', sender_name: currentUser?.full_name || 'Dispatch', sender_email: currentUser?.email || '', sender_role: currentUser?.role || 'dispatcher', content: input.trim(), flight_number: flightNum, priority: 'normal' })}
            className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="px-4 py-2 border-b border-border">
        <input type="text" value={flightFilter} onChange={e => setFlightFilter(e.target.value.toUpperCase())}
          placeholder="Filter by flight number…"
          className="w-full h-8 bg-secondary border border-border rounded-lg px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center mt-8">No ACARS messages</p>
        ) : filtered.map(msg => (
          <div key={msg.id} className="rounded-xl bg-card border border-border px-4 py-3 font-mono">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">✈ {msg.flight_number || '---'}</span>
                <span className="text-xs text-muted-foreground">FROM: {msg.sender_name}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {msg.created_date ? new Date(msg.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Broadcast Tab ──────────────────────────────────────────────────────────
function BroadcastTab({ currentUser }) {
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [targetRoles, setTargetRoles] = useState([]);
  const queryClient = useQueryClient();

  const { data: broadcasts = [] } = useQuery({
    queryKey: ['comm-broadcast'],
    queryFn: () => base44.entities.CommMessage.filter({ message_type: 'broadcast' }, '-created_date', 50),
    refetchInterval: 10000,
  });

  useEffect(() => {
    const unsub = base44.entities.CommMessage.subscribe((event) => {
      if (event.data?.message_type === 'broadcast') {
        queryClient.invalidateQueries({ queryKey: ['comm-broadcast'] });
      }
    });
    return unsub;
  }, [queryClient]);

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.CommMessage.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['comm-broadcast'] }); setContent(''); setTargetRoles([]); setPriority('normal'); },
  });

  const toggleRole = (r) => setTargetRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const send = () => {
    if (!content.trim()) return;
    sendMutation.mutate({
      channel: 'broadcast',
      message_type: 'broadcast',
      sender_name: currentUser?.full_name || 'Ops Center',
      sender_email: currentUser?.email || '',
      sender_role: currentUser?.role || 'ops',
      content: content.trim(),
      priority,
      target_roles: targetRoles.length > 0 ? targetRoles : ['all'],
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Compose */}
      <div className="p-4 border-b border-border bg-card space-y-3">
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Compose Broadcast</p>

        {/* Target roles */}
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Target Roles (leave empty = all)</p>
          <div className="flex flex-wrap gap-1.5">
            {ROLES.map(r => (
              <button key={r} onClick={() => toggleRole(r)}
                className={cn('text-[10px] font-bold px-2 py-1 rounded-lg transition-all capitalize',
                  targetRoles.includes(r) ? (ROLE_COLORS[r] || 'bg-primary/15 text-primary') + ' ring-1 ring-current' : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}>{r.replace('_', ' ')}</button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className="flex gap-1">
          {['normal', 'urgent', 'emergency'].map(p => (
            <button key={p} onClick={() => setPriority(p)}
              className={cn('text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all capitalize',
                priority === p
                  ? p === 'emergency' ? 'bg-destructive text-white' : p === 'urgent' ? 'bg-orange-500 text-white' : 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}>{p}</button>
          ))}
        </div>

        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Broadcast message to all crews…"
          rows={3}
          className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
        <button onClick={send} disabled={!content.trim()}
          className="w-full h-9 bg-primary text-primary-foreground text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary/90 transition-colors">
          <Megaphone className="w-4 h-4" /> Send Broadcast
        </button>
      </div>

      {/* Broadcast history */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-2">
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">Broadcast History</p>
        {broadcasts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center mt-4">No broadcasts sent yet</p>
        ) : broadcasts.map(msg => {
          const pri = PRIORITY_CFG[msg.priority] || PRIORITY_CFG.normal;
          return (
            <div key={msg.id} className={cn('rounded-xl border border-border bg-card px-4 py-3', pri.bg)}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {msg.priority !== 'normal' && (
                    <span className={cn('text-[10px] font-bold uppercase', pri.color)}>
                      {msg.priority === 'emergency' ? '🚨 EMERGENCY' : '⚠ URGENT'}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-foreground">{msg.sender_name}</span>
                  {msg.target_roles?.map(r => (
                    <span key={r} className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', ROLE_COLORS[r] || 'bg-muted text-muted-foreground')}>
                      {r === 'all' ? 'ALL' : r.replace('_', ' ').toUpperCase()}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {msg.created_date ? new Date(msg.created_date).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                </span>
              </div>
              <p className="text-sm text-foreground">{msg.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function CommCenter() {
  const [activeTab, setActiveTab] = useState('chat');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="flex flex-col bg-background" style={{ height: '100vh' }}>
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <MessageSquare className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">COMM CENTER</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Channels · ACARS · Broadcast</p>
            </div>
          </div>
          <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                activeTab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat'      && <ChatTab currentUser={currentUser} />}
        {activeTab === 'acars'     && <AcarsTab currentUser={currentUser} />}
        {activeTab === 'broadcast' && <BroadcastTab currentUser={currentUser} />}
      </div>
    </div>
  );
}