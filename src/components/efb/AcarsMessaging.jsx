import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Send, Radio, Clock, Plane, MessageSquare } from 'lucide-react';

const TODAY = new Date().toISOString().split('T')[0];

// Simulated ACARS message types
const MSG_TYPES = {
  'OUT': { label: 'OUT', color: 'text-blue-400', bg: 'bg-blue-500/15', desc: 'Aircraft left gate' },
  'OFF': { label: 'OFF', color: 'text-green-400', bg: 'bg-green-500/15', desc: 'Wheels off runway' },
  'ON':  { label: 'ON',  color: 'text-primary',   bg: 'bg-primary/15',  desc: 'Wheels on runway' },
  'IN':  { label: 'IN',  color: 'text-purple-400', bg: 'bg-purple-500/15', desc: 'Aircraft at gate' },
  'DISP': { label: 'DISP', color: 'text-foreground', bg: 'bg-muted', desc: 'Dispatch message' },
  'ATC':  { label: 'ATC',  color: 'text-orange-400', bg: 'bg-orange-500/15', desc: 'ATC relay' },
  'LOAD': { label: 'LOAD', color: 'text-foreground', bg: 'bg-muted', desc: 'Load closeout' },
  'FUEL': { label: 'FUEL', color: 'text-foreground', bg: 'bg-muted', desc: 'Fuel final' },
};

function timestamp() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + 'Z';
}

export default function AcarsMessaging() {
  const { data: flights = [] } = useQuery({
    queryKey: ['efb-flights-acars', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
  });

  const [selectedFlight, setSelectedFlight] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, type: 'DISP', from: 'DISPATCH', to: 'CREW', text: 'DEPARTURE WEATHER KEWR UPDATED. METAR KEWR 201215Z 27012G18KT 10SM FEW025 BKN080 14/04 A2994. DEPARTURE ATIS INFO PAPA.', time: '12:15:04Z', direction: 'inbound' },
    { id: 2, type: 'ATC', from: 'OCC', to: 'CREW', text: 'EXPECT RUNWAY 22L FOR DEPARTURE. GATE HOLD IN EFFECT UNTIL 1245Z. CONFIRM FUEL FINAL.', time: '12:18:33Z', direction: 'inbound' },
    { id: 3, type: 'FUEL', from: 'CREW', to: 'DISPATCH', text: 'FUEL FINAL 11800 LBS. CREW READY. REQUESTING PUSHBACK.', time: '12:22:10Z', direction: 'outbound' },
    { id: 4, type: 'DISP', from: 'DISPATCH', to: 'CREW', text: 'RELEASE AMENDED. ALTERNATE CHANGED TO KPHL DUE WX AT KABE. UPDATED RELEASE FOLLOWS.', time: '12:25:45Z', direction: 'inbound' },
  ]);

  const [outTimes, setOutTimes] = useState({});
  const [input, setInput] = useState('');
  const [msgType, setMsgType] = useState('DISP');
  const msgEnd = useRef(null);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: msgType,
      from: 'CREW',
      to: 'DISPATCH',
      text: input.trim(),
      time: timestamp(),
      direction: 'outbound',
    }]);
    setInput('');
  };

  const logOooi = (type) => {
    const t = timestamp();
    setOutTimes(prev => ({ ...prev, [type]: t }));
    setMessages(prev => [...prev, {
      id: Date.now(),
      type,
      from: 'ACARS',
      to: 'OCC',
      text: `AUTOMATIC REPORT: ${MSG_TYPES[type].desc.toUpperCase()}. TIME: ${t} ${selectedFlight ? `FLIGHT: ${selectedFlight}` : ''}`,
      time: t,
      direction: 'outbound',
      auto: true,
    }]);
  };

  return (
    <div className="space-y-4">
      {/* Flight selector */}
      {flights.length > 0 && (
        <div className="rounded-xl bg-card border border-border p-3">
          <label className="text-xs text-muted-foreground block mb-2">Active Flight</label>
          <div className="flex gap-2 flex-wrap">
            {flights.map(f => (
              <button key={f.id} onClick={() => setSelectedFlight(f.flight_number)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border',
                  selectedFlight === f.flight_number ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
                )}>{f.flight_number}</button>
            ))}
          </div>
        </div>
      )}

      {/* OOOI timestamps */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">OUT / OFF / ON / IN (OOOI)</p>
        </div>
        <div className="p-3 grid grid-cols-4 gap-2">
          {['OUT', 'OFF', 'ON', 'IN'].map(t => {
            const cfg = MSG_TYPES[t];
            const logged = outTimes[t];
            return (
              <button key={t} onClick={() => !logged && logOooi(t)}
                className={cn('rounded-xl px-2 py-3 text-center border transition-all', cfg.bg,
                  logged ? 'border-transparent cursor-default' : 'border-border hover:border-primary cursor-pointer'
                )}>
                <p className={cn('text-sm font-extrabold font-mono', cfg.color)}>{t}</p>
                <p className="text-xs font-mono text-foreground mt-1">{logged || '--:--:--'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cfg.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message thread */}
      <div className="rounded-xl bg-card border border-border overflow-hidden flex flex-col" style={{ height: '400px' }}>
        <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" />
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">ACARS Datalink</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map(msg => {
            const cfg = MSG_TYPES[msg.type] || MSG_TYPES['DISP'];
            const isOut = msg.direction === 'outbound';
            return (
              <div key={msg.id} className={cn('flex', isOut ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[85%] rounded-xl px-3 py-2.5', isOut ? 'bg-primary/20' : 'bg-secondary')}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-mono font-bold px-1.5 py-0.5 rounded', cfg.bg, cfg.color)}>{msg.type}</span>
                    <span className="text-xs text-muted-foreground">{msg.from} → {msg.to}</span>
                    <span className="text-xs font-mono text-muted-foreground ml-auto">{msg.time}</span>
                  </div>
                  <p className="text-xs font-mono text-foreground leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={msgEnd} />
        </div>
        {/* Compose */}
        <div className="border-t border-border p-3 space-y-2">
          <div className="flex gap-2">
            <select value={msgType} onChange={e => setMsgType(e.target.value)}
              className="h-8 bg-secondary border border-border rounded-lg px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {['DISP', 'ATC', 'LOAD', 'FUEL'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Compose ACARS message…"
              className="flex-1 h-8 bg-secondary border border-border rounded-lg px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={sendMessage}
              className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}