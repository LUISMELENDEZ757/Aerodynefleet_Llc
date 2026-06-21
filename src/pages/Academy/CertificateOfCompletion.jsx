import { useRef } from 'react';
import { Download, X, Award, CheckCircle, Shield } from 'lucide-react';
import { ACADEMY_COURSES } from './academyData';

export default function CertificateOfCompletion({ completedCourses, avgScore, onClose, studentName = '' }) {
  const certRef = useRef(null);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const totalCourses = ACADEMY_COURSES.length;

  const handlePrint = () => {
    const content = certRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=1100,height=850');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Aerodyne Academy Certificate of Completion</title>
        <meta charset="UTF-8">
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        body { 
          font-family: 'Inter', sans-serif;
          background: #0a0e1a;
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh;
          padding: 20px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .cert-wrap { width: 960px; }
        .cert {
          width: 960px;
          min-height: 640px;
          background: linear-gradient(135deg, #0a0e1a 0%, #0f1829 40%, #0d1830 100%) !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          border: 3px solid #c9a227;
          border-radius: 0;
          padding: 52px 64px;
          color: white;
          position: relative;
          overflow: hidden;
        }
          .cert-corner {
            position: absolute;
            width: 120px; height: 120px;
            border-color: rgba(201,162,39,0.3);
            border-style: solid;
          }
          .cert-corner.tl { top: 16px; left: 16px; border-width: 2px 0 0 2px; }
          .cert-corner.tr { top: 16px; right: 16px; border-width: 2px 2px 0 0; }
          .cert-corner.bl { bottom: 16px; left: 16px; border-width: 0 0 2px 2px; }
          .cert-corner.br { bottom: 16px; right: 16px; border-width: 0 2px 2px 0; }
          .cert-bg-text {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
            font-size: 200px; font-weight: 900; color: rgba(201,162,39,0.03);
            white-space: nowrap; user-select: none; pointer-events: none;
            letter-spacing: -10px;
          }
          .header { text-align: center; margin-bottom: 28px; }
          .brand { 
            font-size: 11px; letter-spacing: 6px; text-transform: uppercase; 
            color: #c9a227; font-weight: 800; margin-bottom: 4px; 
          }
          .title { 
            font-family: 'Playfair Display', serif; 
            font-size: 44px; font-weight: 900; 
            background: linear-gradient(135deg, #f0c040 0%, #c9a227 50%, #e8b830 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            line-height: 1.1; margin-bottom: 2px;
          }
          .subtitle { font-size: 13px; color: rgba(255,255,255,0.8); letter-spacing: 3px; text-transform: uppercase; }
          .divider { 
            height: 1px; 
            background: linear-gradient(90deg, transparent, rgba(201,162,39,0.5), rgba(201,162,39,0.8), rgba(201,162,39,0.5), transparent); 
            margin: 22px 0;
          }
          .presented { text-align: center; font-size: 13px; color: rgba(255,255,255,0.85); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
          .student-name { 
            text-align: center; 
            font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 700;
            color: #ffffff; margin: 0 0 4px;
          }
          .completion-text { text-align: center; font-size: 13px; color: rgba(255,255,255,0.9); margin-bottom: 24px; line-height: 1.7; }
          .completion-text strong { color: rgba(255,255,255,0.9); }
          .courses-grid { 
            display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 16px 0; 
          }
          .course-item {
            background: rgba(201,162,39,0.08); border: 1px solid rgba(201,162,39,0.2);
            border-radius: 6px; padding: 8px 12px;
            display: flex; align-items: center; gap: 8px;
          }
          .course-dot { width: 6px; height: 6px; border-radius: 50%; background: #c9a227; flex-shrink: 0; }
          .course-name { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.95); }
          .course-score { font-size: 10px; color: #c9a227; font-weight: 800; margin-left: auto; }
          .footer-row { 
            display: flex; align-items: flex-end; justify-content: space-between; 
            margin-top: 28px; padding-top: 20px;
            border-top: 1px solid rgba(201,162,39,0.2);
          }
          .sig-block { text-align: center; }
          .sig-line { width: 180px; height: 1px; background: rgba(255,255,255,0.25); margin: 0 auto 4px; }
          .sig-label { font-size: 10px; color: rgba(255,255,255,0.75); letter-spacing: 1px; text-transform: uppercase; }
          .seal { 
            width: 90px; height: 90px; border-radius: 50%; 
            border: 2px solid rgba(201,162,39,0.5);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            background: rgba(201,162,39,0.08);
          }
          .seal-text { font-size: 7px; letter-spacing: 2px; color: #c9a227; text-transform: uppercase; text-align: center; font-weight: 800; }
          .seal-star { font-size: 20px; margin-bottom: 2px; }
          .score-badge {
            text-align: center;
            background: rgba(201,162,39,0.1); border: 1px solid rgba(201,162,39,0.3);
            border-radius: 8px; padding: 10px 18px;
          }
          .score-num { font-size: 32px; font-weight: 900; color: #c9a227; line-height: 1; }
          .score-label { font-size: 9px; letter-spacing: 2px; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-top: 2px; }
          .cert-id { font-size: 9px; color: rgba(255,255,255,0.55); text-align: center; margin-top: 16px; letter-spacing: 1px; }
          @media print {
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
            body { padding: 0; margin: 0; background: #0a0e1a !important; }
            .cert { border-radius: 0; background: linear-gradient(135deg, #0a0e1a 0%, #0f1829 40%, #0d1830 100%) !important; }
          }
        </style>
      </head>
      <body>
        <div class="cert-wrap">${content}</div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 500);
  };

  const courseRows = ACADEMY_COURSES.map(c => ({
    title: c.title,
    score: completedCourses[c.id]?.pct || 0,
    icon: c.icon,
  }));

  const certId = `ADAC-${Date.now().toString(36).toUpperCase().slice(-8)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl">

        {/* Controls */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Certificate Preview</p>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors">
              <Download className="w-4 h-4" /> Download / Print
            </button>
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Certificate */}
        <div ref={certRef}>
          <div className="cert" style={{
            background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1829 40%, #0d1830 100%)',
            border: '2px solid #c9a227',
            padding: '52px 64px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif",
          }}>
            {/* Background watermark */}
            <div className="cert-bg-text" style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              fontSize: '200px', fontWeight: 900, color: 'rgba(201,162,39,0.03)',
              whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none', letterSpacing: '-10px',
            }}>AERODYNE</div>

            {/* Corner decorations */}
            {['tl','tr','bl','br'].map(pos => (
              <div key={pos} className={`cert-corner ${pos}`} style={{
                position: 'absolute',
                width: 120, height: 120,
                borderColor: 'rgba(201,162,39,0.3)',
                borderStyle: 'solid',
                ...(pos === 'tl' ? { top: 16, left: 16, borderWidth: '2px 0 0 2px' } :
                    pos === 'tr' ? { top: 16, right: 16, borderWidth: '2px 2px 0 0' } :
                    pos === 'bl' ? { bottom: 16, left: 16, borderWidth: '0 0 2px 2px' } :
                                   { bottom: 16, right: 16, borderWidth: '0 2px 2px 0' }),
              }} />
            ))}

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 11, letterSpacing: 6, textTransform: 'uppercase', color: '#c9a227', fontWeight: 800, marginBottom: 4 }}>
                Aerodyne Fleet LLC
              </div>
              <div style={{
                fontSize: 44, fontWeight: 900, lineHeight: 1.1, marginBottom: 4,
                background: 'linear-gradient(135deg, #f0c040 0%, #c9a227 50%, #e8b830 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Certificate of Completion
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', letterSpacing: 3, textTransform: 'uppercase' }}>
                Aerodyne Academy · Part 147 Aligned Program
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.5), rgba(201,162,39,0.8), rgba(201,162,39,0.5), transparent)', margin: '22px 0' }} />

            {/* Student Name */}
            <div style={{ textAlign: 'center', marginBottom: 4, fontSize: 13, color: 'rgba(255,255,255,0.85)', letterSpacing: 2, textTransform: 'uppercase' }}>
              This certifies that
            </div>
            <div style={{ textAlign: 'center', fontSize: 42, fontWeight: 700, color: '#ffffff', marginBottom: 8, fontFamily: 'Georgia, serif' }}>
              {studentName || 'Academy Graduate'}
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.8, marginBottom: 24 }}>
              has successfully completed all <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{totalCourses} modules</strong> of the{' '}
              <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Aerodyne Fleet OS Training Program</strong><br />
              demonstrating proficiency in{' '}
              aviation maintenance operations,<br />
              MEL/NEF/CDL procedures, ETOPS compliance, and FAA Part 147 aligned knowledge areas.
            </div>

            {/* Courses Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, margin: '16px 0' }}>
              {courseRows.map(c => (
                <div key={c.title} style={{
                  background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)',
                  borderRadius: 6, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c9a227', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)', flex: 1 }}>{c.title}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(201,162,39,0.2)', margin: '24px 0 20px' }} />

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              {/* Signature 1 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 180, height: 1, background: 'rgba(255,255,255,0.25)', margin: '0 auto 4px' }} />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', letterSpacing: 1, textTransform: 'uppercase' }}>Chief Instructor</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 700, marginTop: 2 }}>Aerodyne Academy</div>
              </div>

              {/* Center Seal */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 96, height: 96, borderRadius: '50%',
                  border: '2px solid rgba(201,162,39,0.6)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(201,162,39,0.08)', margin: '0 auto',
                }}>
                  <div style={{ fontSize: 24 }}>✈️</div>
                  <div style={{ fontSize: 7, letterSpacing: 2, color: '#c9a227', textTransform: 'uppercase', fontWeight: 800, textAlign: 'center', marginTop: 2, lineHeight: 1.4 }}>
                    AERODYNE<br />CERTIFIED
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>{dateStr}</div>
              </div>

              {/* Signature 2 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 180, height: 1, background: 'rgba(255,255,255,0.25)', margin: '0 auto 4px' }} />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', letterSpacing: 1, textTransform: 'uppercase' }}>Director of Training</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 700, marginTop: 2 }}>Aerodyne Fleet LLC</div>
              </div>
            </div>

            {/* Cert ID */}
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 16, letterSpacing: 1 }}>
              Certificate ID: {certId} · Issued by Aerodyne Fleet LLC · {dateStr}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}