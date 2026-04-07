import { useState } from 'react';
import { Send, MessageSquare, Radio, Clock, CheckCheck } from 'lucide-react';

const ACARS_TEMPLATES = [
  { id: 'pdc', label: 'Pre-Departure Clearance', content: 'PDC REQUEST: {flight} AT {origin}. ATIS INFO {atis}. REQ IFR CLEARANCE.' },
  { id: 'wx_update', label: 'Weather Update', content: 'WEATHER UPDATE: DEST {dest} METAR FOLLOWS — ADVISE CREW.' },
  { id: 'delay', label: 'Departure Delay', content: 'DELAY ADVISORY: {flight} DELAYED {minutes} MIN. NEW ETD {etd}Z. REASON: {reason}.' },
  { id: 'fuel', label: 'Fuel Advisory', content: 'FUEL ADVISORY: {flight} REVISED FOB {fuel} KLB. TANKERING {tankering}.' },
  { id: 'divert', label: 'Diversion Authorization', content: 'DIVERSION AUTH: {flight} APPROVED DIVERT TO {alt}. REASON: {reason}. CONTACT OCC ON ARRIVAL.' },
  { id: 'free', label: 'Free Text', content: '' },
];

function MessageBubble({ msg }) {
  const isOut = msg.direction === 'out';
  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-xl px-3 py-2 space-y-1 ${isOut ? 'bg-sky-900/60 border border-sky-700/40' : 'bg-slate-800 border border-slate-700'}`}>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[9px] font-bold uppercase text-slate-500">{isOut ? 'DISP → CREW' : 'CREW → DISP'}</span>
          <span className="text-[9px] text-slate-600">{msg.time}</span>
        </div>
        <p className="text-xs font-mono text-slate-200">{msg.content}</p>
        {isOut && <div className="flex items-center gap-1 justify-end"><CheckCheck className="w-3 h-3 text-sky-400" /><span className="text-[9px] text-sky-400">Delivered</span></div>}
      </div>
    </div>
  );
}

export default function ACARSCommunications({ flight }) {
  const [messages, setMessages] = useState([
    { id: 1, direction: 'out', content: `PDC ISSUED: ${flight.flightNumber} CLRD TO ${flight.destination} VIA ${(flight.route||'').split(' ').slice(0,3).join(' ')}... FL350 SQUAWK 4721`, time: '23:01Z' },
    { id: 2, direction: 'in',  content: `${flight.flightNumber} PDC RECEIVED. WILCO. ATIS INFO BRAVO OBTAINED.`, time: '23:04Z' },
    { id: 3, direction: 'out', content: `FUEL UPLIFT CONFIRMED: FOB ${flight.fuelPlan} KLBS. CREW COPY.`, time: '23:08Z' },
  ]);
  const [selected, setSelected] = useState('pdc');
  const [msgText, setMsgText] = useState('');
  const [atisCode, setAtisCode] = useState('B');

  const template = ACARS_TEMPLATES.find(t => t.id === selected);

  const fillTemplate = (tpl) => {
    return (tpl.content || '')
      .replace('{flight}', flight.flightNumber)
      .replace('{origin}', flight.origin)
      .replace('{dest}', flight.destination)
      .replace('{atis}', atisCode)
      .replace('{fuel}', flight.fuelPlan)
      .replace('{alt}', flight.alternate)
      .replace('{tankering}', 'NOT REQUIRED')
      .replace('{minutes}', '25')
      .replace('{etd}', flight.depTime)
      .replace('{reason}', 'ATC SLOT');
  };

  const handleSend = () => {
    const content = selected === 'free' ? msgText : fillTemplate(template);
    if (!content.trim()) return;
    const now = new Date().toISOString().slice(11,16) + 'Z';
    setMessages(prev => [...prev, { id: Date.now(), direction: 'out', content, time: now }]);
    setMsgText('');
  };

  return (
    <div className="space-y-4 mt-3">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-sky-700/40 bg-sky-950/20 px-4 py-3">
        <Radio className="w-5 h-5 text-sky-400" />
        <div>
          <p className="text-sm font-bold text-slate-100">ACARS / PDC Console</p>
          <p className="text-[11px] text-slate-400">{flight.flightNumber} · {flight.tail} · FAR 121.99 Communication Log</p>
        </div>
      </div>

      {/* Message thread */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 h-52 overflow-y-auto space-y-2">
        {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
      </div>

      {/* Compose */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
          {ACARS_TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setSelected(t.id)}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${selected === t.id ? 'bg-sky-700 text-white border-transparent' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {selected === 'pdc' && (
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-500">ATIS:</label>
            <input value={atisCode} onChange={e => setAtisCode(e.target.value.toUpperCase())} maxLength={1}
              className="w-10 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-200 font-mono text-center outline-none" />
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            value={selected === 'free' ? msgText : fillTemplate(template)}
            onChange={e => { if (selected === 'free') setMsgText(e.target.value); }}
            readOnly={selected !== 'free'}
            rows={3}
            className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-sky-500 resize-none"
          />
          <button onClick={handleSend}
            className="px-3 rounded-lg bg-sky-700 text-white hover:bg-sky-600 transition-colors flex flex-col items-center justify-center gap-1">
            <Send className="w-4 h-4" />
            <span className="text-[9px] font-bold">SEND</span>
          </button>
        </div>
      </div>

      {/* Crew notification log */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">Crew Notification Log — FAR 121.99</p>
        <div className="space-y-1.5">
          {messages.map(m => (
            <div key={m.id} className="flex items-start gap-2 text-[10px]">
              <Clock className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
              <span className="text-slate-600 font-mono">{m.time}</span>
              <span className={`font-bold ${m.direction === 'out' ? 'text-sky-400' : 'text-emerald-400'}`}>{m.direction === 'out' ? 'DISP' : 'CREW'}</span>
              <span className="text-slate-400 truncate">{m.content.slice(0, 60)}…</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}