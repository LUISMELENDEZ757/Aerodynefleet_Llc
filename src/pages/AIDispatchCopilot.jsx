import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Brain, Send, Loader2, Plane, AlertTriangle, CloudRain, Fuel, Users, Zap, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = [
  { label: '🌩 Weather Risk', prompt: 'Analyze current weather risks for our active flights and recommend any action needed.' },
  { label: '⛽ Fuel Variance', prompt: 'Check if any active flights have fuel variance concerns and advise on tankering or alternate options.' },
  { label: '👥 Crew Legality', prompt: 'Review crew duty time across current assignments and flag any approaching FAR 117 limits.' },
  { label: '🔧 MEL Impact', prompt: 'Analyze open MEL items and assess their impact on dispatch operations today.' },
  { label: '🚨 AOG Risk', prompt: 'Which aircraft are at highest risk of going AOG in the next 24 hours based on fault trends?' },
  { label: '📋 Release Review', prompt: 'Review any pending dispatch releases and flag items that need attention before signing.' },
];

export default function AIDispatchCopilot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '**AI Dispatch Co-Pilot** ready.\n\nI have real-time access to your flights, aircraft status, crew assignments, MEL items, and weather data. Ask me anything or use a quick prompt below.\n\n*Remember: I assist the dispatcher — final authority always rests with the certificated dispatcher.*' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const { data: flights = [] } = useQuery({ queryKey: ['adc-flights'], queryFn: () => base44.entities.Flight.list('-flight_date', 100) });
  const { data: aircraft = [] } = useQuery({ queryKey: ['adc-aircraft'], queryFn: () => base44.entities.Aircraft.list('tail_number', 200) });
  const { data: crew = [] } = useQuery({ queryKey: ['adc-crew'], queryFn: () => base44.entities.CrewAssignment.list('-flight_date', 100) });
  const { data: mel = [] } = useQuery({ queryKey: ['adc-mel'], queryFn: () => base44.entities.MELItem.list('-deferred_date', 100) });
  const { data: faults = [] } = useQuery({ queryKey: ['adc-faults'], queryFn: () => base44.entities.FaultMessage.filter({ status: 'active' }) });
  const { data: releases = [] } = useQuery({ queryKey: ['adc-releases'], queryFn: () => base44.entities.DispatchRelease.list('-flight_date', 50) });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];
    const activeFlights = flights.filter(f => f.flight_date === today || f.status === 'airborne' || f.status === 'departed');
    const openMEL = mel.filter(m => m.status === 'open' || m.status === 'expiring_soon');
    const oosAircraft = aircraft.filter(a => a.status === 'oos' || a.status === 'maintenance');
    const pendingReleases = releases.filter(r => r.release_status === 'draft' || r.release_status === 'pending_signature');

    const context = `
You are an expert FAA-certificated aircraft dispatcher AI co-pilot for Aerodyne Fleet LLC. You assist dispatchers with real-time operational decisions.

CURRENT OPERATIONAL SNAPSHOT (${new Date().toUTCString()}):
- Active flights today: ${activeFlights.length}
- Aircraft in fleet: ${aircraft.length} (${oosAircraft.length} OOS/maintenance)
- Open MEL items: ${openMEL.length}
- Active faults: ${faults.length}
- Pending releases: ${pendingReleases.length}
- Crew assignments today: ${crew.filter(c => c.flight_date === today).length}

FLIGHT DATA (sample):
${JSON.stringify(activeFlights.slice(0, 8).map(f => ({ fn: f.flight_number, route: `${f.origin}-${f.destination}`, status: f.status, delay: f.delay_minutes, tail: f.aircraft_tail })), null, 2)}

MEL ITEMS (open, sample):
${JSON.stringify(openMEL.slice(0, 6).map(m => ({ tail: m.aircraft_tail, cat: m.category, ata: m.ata_chapter, desc: m.description?.substring(0, 60) })), null, 2)}

OOS AIRCRAFT:
${JSON.stringify(oosAircraft.slice(0, 5).map(a => ({ tail: a.tail_number, type: a.aircraft_type, status: a.status })), null, 2)}

ACTIVE FAULTS (sample):
${JSON.stringify(faults.slice(0, 6).map(f => ({ tail: f.aircraft_tail, code: f.fault_code, system: f.system, severity: f.severity })), null, 2)}

Dispatcher's question: ${userMsg}

Respond concisely and operationally. Use **bold** for critical items. Use bullet points for lists. Flag any items requiring immediate action with ⚠️. Always remind dispatcher that final authority rests with them.`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt: context, model: 'claude_sonnet_4_6' });
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-foreground">AI DISPATCH CO-PILOT</h1>
          <p className="text-xs font-mono text-violet-400 tracking-widest">Powered by Claude · Real-time Fleet Context</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> LIVE DATA
        </div>
      </div>

      {/* Context Pills */}
      <div className="border-b border-border bg-card/50 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
        {[
          { icon: Plane, label: `${flights.filter(f => f.flight_date === new Date().toISOString().split('T')[0]).length} flights today`, color: 'text-primary' },
          { icon: AlertTriangle, label: `${faults.length} active faults`, color: 'text-red-400' },
          { icon: Users, label: `${mel.filter(m => m.status === 'open').length} open MEL`, color: 'text-amber-400' },
          { icon: Zap, label: `${aircraft.filter(a => a.status === 'oos').length} OOS`, color: 'text-orange-400' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-lg flex-shrink-0">
            <Icon className={cn('w-3 h-3', color)} />
            <span className="text-[10px] font-bold text-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                <Brain className="w-4 h-4 text-violet-400" />
              </div>
            )}
            <div className={cn('max-w-[85%] rounded-2xl px-4 py-3', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border')}>
              {msg.role === 'user' ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-violet-400 animate-pulse" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
              <span className="text-sm text-muted-foreground">Analyzing operational data…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      <div className="border-t border-border bg-card/50 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
        {QUICK_PROMPTS.map(qp => (
          <button key={qp.label} onClick={() => sendMessage(qp.prompt)} disabled={loading}
            className="flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground hover:border-violet-500/50 transition-colors disabled:opacity-50">
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4 flex-shrink-0">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about flights, weather, MEL, crew legality, fuel…"
            disabled={loading}
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center hover:bg-violet-500 disabled:opacity-40 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">AI assists only — dispatcher retains full legal authority under 14 CFR Part 121</p>
      </div>
    </div>
  );
}