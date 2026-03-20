import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Zap, Send, Loader2, User, Bot, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = [
  'What is the best recovery plan for any delayed flight today?',
  'Are there any crew members at risk of timing out before their flight arrives?',
  'Which flights have no legal crew assigned?',
  'Recommend crew swaps for any violations detected today.',
  'What is the fastest way to fix any current operational issue?',
  'Predict delay impact if any flight is delayed by 2 hours.',
];

function buildContext(crew, flights) {
  const crewSummary = crew.map(c =>
    `${c.crew_name} (${c.role}) | Flight: ${c.flight_number || 'N/A'} | Status: ${c.legal_status || 'legal'} | Duty: ${c.duty_start || '?'}-${c.duty_end || '?'}Z | Rest prior: ${c.rest_hours_prior ?? '?'}h | Flt time today: ${c.total_flight_time_today ?? '?'}h`
  ).join('\n');

  const flightSummary = flights.map(f =>
    `${f.flight_number} | ${f.origin}→${f.destination} | Status: ${f.status} | STD: ${f.scheduled_departure}Z | STA: ${f.scheduled_arrival}Z | Delay: ${f.delay_minutes || 0}min`
  ).join('\n');

  return `You are an AI Dispatcher Assistant for Aerodyne Fleet LLC. You have expert knowledge of FAR Part 117, airline operations, and crew resource management. Answer concisely and operationally.

TODAY'S CREW ASSIGNMENTS:
${crewSummary || 'No crew data available'}

TODAY'S FLIGHTS:
${flightSummary || 'No flight data available'}

FAR 117 limits: Min rest 10h, Max FDP 9h (2-pilot crew), Max flight time 8h/duty, 60h/7-day, 190h/28-day, 1000h/365-day.`;
}

export default function AIDispatcherAssistant({ crew, flights }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "I'm your AI Dispatcher Assistant. I have full visibility of today's crew assignments and flight schedule. Ask me anything — crew legality, recovery plans, delay impact, or swap recommendations." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const context = buildContext(crew, flights);
    const history = messages.map(m => `${m.role === 'user' ? 'Dispatcher' : 'AI'}: ${m.content}`).join('\n');

    const reply = await base44.integrations.Core.InvokeLLM({
      prompt: `${context}\n\nCONVERSATION HISTORY:\n${history}\n\nDispatcher: ${userMsg}\n\nAI:`,
      model: 'claude_sonnet_4_6',
    });

    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Quick prompts */}
      <div className="rounded-xl bg-card border border-border p-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-primary" /> Quick Actions
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p, i) => (
            <button key={i} onClick={() => send(p)} disabled={loading}
              className="text-xs bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-lg border border-border transition-colors disabled:opacity-50">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="rounded-xl bg-card border border-border overflow-hidden flex flex-col" style={{ height: '480px' }}>
        <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">AI Dispatcher Assistant</p>
          </div>
          <button onClick={() => setMessages([{ role: 'assistant', content: "I'm your AI Dispatcher Assistant. I have full visibility of today's crew assignments and flight schedule. Ask me anything." }])}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <RefreshCw className="w-3 h-3" /> Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
              )}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-sm"
                    components={{
                      p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                      li: ({ children }) => <li className="my-0.5">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
                    }}
                  >{msg.content}</ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-secondary rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Analyzing operations…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about crew legality, recovery plans, delay impact…"
            disabled={loading}
            className="flex-1 h-9 bg-secondary border border-border rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">AI responses use Claude Sonnet and consume integration credits.</p>
    </div>
  );
}