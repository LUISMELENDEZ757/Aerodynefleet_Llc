import { useState, useEffect } from 'react';

export default function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = t.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });

  return (
    <div className="text-right flex-shrink-0">
      <p className="text-[9px] font-extrabold text-cyan-400 tracking-widest uppercase">Aerodyne Fleet</p>
      <p className="text-lg font-black text-white font-mono tracking-wider leading-tight">{timeStr}</p>
    </div>
  );
}