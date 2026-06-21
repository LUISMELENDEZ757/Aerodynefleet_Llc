import { useRef } from 'react';
import { Download, X } from 'lucide-react';
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh;
          padding: 20px;
        }
        .cert-wrap { width: 960px; }
        .cert {
          width: 960px;
          min-height: 640px;
          background: #ffffff;
          border: 4px solid #b8922a;
          padding: 52px 64px;
          color: #1a1a2e;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 0 0 8px #fff, inset 0 0 0 10px rgba(184,146,42,0.25);
        }
        .cert-corner {
          position: absolute;
          width: 100px; height: 100px;
          border-color: #b8922a;
          border-style: solid;
        }
        .cert-corner.tl { top: 18px; left: 18px; border-width: 2px 0 0 2px; }
        .cert-corner.tr { top: 18px; right: 18px; border-width: 2px 2px 0 0; }
        .cert-corner.bl { bottom: 18px; left: 18px; border-width: 0 0 2px 2px; }
        .cert-corner.br { bottom: 18px; right: 18px; border-width: 0 2px 2px 0; }
        .cert-bg-text {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          font-size: 180px; font-weight: 900; color: rgba(184,146,42,0.05);
          white-space: nowrap; user-select: none; pointer-events: none;
          letter-spacing: -10px;
        }
        .brand {
          text-align: center;
          font-size: 11px; letter-spacing: 7px; text-transform: uppercase;
          color: #b8922a; font-weight: 900; margin-bottom: 6px;
        }
        .title {
          text-align: center;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 46px; font-weight: 900;
          color: #1a1a2e;
          line-height: 1.1; margin-bottom: 4px;
        }
        .subtitle {
          text-align: center;
          font-size: 11px; color: #555; letter-spacing: 4px; text-transform: uppercase;
        }
        .divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, #b8922a, transparent);
          margin: 24px 0;
        }
        .presented {
          text-align: center; font-size: 12px; color: #666;
          letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px;
        }
        .student-name {
          text-align: center;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 48px; font-weight: 700;
          color: #0d1117; margin: 0 0 6px;
          border-bottom: 2px solid rgba(184,146,42,0.4);
          padding-bottom: 10px; display: inline-block; width: 100%;
        }
        .completion-text {
          text-align: center; font-size: 13px; color: #333;
          margin-bottom: 20px; line-height: 1.8;
        }
        .completion-text strong { color: #0d1117; font-weight: 800; }
        .courses-grid {
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 16px 0;
        }
        .course-item {
          background: #fdf8ee; border: 1px solid #d4aa50;
          border-radius: 4px; padding: 8px 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .course-dot { width: 6px; height: 6px; border-radius: 50%; background: #b8922a; flex-shrink: 0; }
        .course-name { font-size: 10px; font-weight: 700; color: #1a1a2e; }
        .footer-row {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-top: 24px; padding-top: 20px;
          border-top: 1px solid #d4aa50;
        }
        .sig-line { width: 180px; height: 1px; background: #999; margin: 0 auto 4px; }
        .sig-label { font-size: 10px; color: #666; letter-spacing: 1px; text-transform: uppercase; text-align: center; }
        .sig-name { font-size: 11px; color: #1a1a2e; font-weight: 700; text-align: center; margin-top: 2px; }
        .seal {
          width: 96px; height: 96px; border-radius: 50%;
          border: 3px solid #b8922a;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: #fdf8ee; margin: 0 auto;
        }
        .seal-label { font-size: 7px; letter-spacing: 2px; color: #b8922a; text-transform: uppercase; font-weight: 900; text-align: center; margin-top: 2px; line-height: 1.4; }
        .date-text { font-size: 10px; color: #555; text-align: center; margin-top: 8px; }
        .cert-id { font-size: 9px; color: #999; text-align: center; margin-top: 16px; letter-spacing: 1px; }
        @media print {
          body { padding: 0; margin: 0; }
          .cert { box-shadow: none; }
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

  const courseRows = ACADEMY_COURSES.map(c => ({ title: c.title }));
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
            background: '#ffffff',
            border: '4px solid #b8922a',
            boxShadow: 'inset 0 0 0 8px #fff, inset 0 0 0 10px rgba(184,146,42,0.25)',
            padding: '52px 64px',
            color: '#1a1a2e',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif",
          }}>
            {/* Watermark */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              fontSize: 180, fontWeight: 900, color: 'rgba(184,146,42,0.05)',
              whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none', letterSpacing: -10,
            }}>AERODYNE</div>

            {/* Corner decorations */}
            {['tl','tr','bl','br'].map(pos => (
              <div key={pos} style={{
                position: 'absolute', width: 100, height: 100,
                borderColor: '#b8922a', borderStyle: 'solid',
                ...(pos === 'tl' ? { top: 18, left: 18, borderWidth: '2px 0 0 2px' } :
                    pos === 'tr' ? { top: 18, right: 18, borderWidth: '2px 2px 0 0' } :
                    pos === 'bl' ? { bottom: 18, left: 18, borderWidth: '0 0 2px 2px' } :
                                   { bottom: 18, right: 18, borderWidth: '0 2px 2px 0' }),
              }} />
            ))}

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: 7, textTransform: 'uppercase', color: '#b8922a', fontWeight: 900, marginBottom: 8 }}>
                Aerodyne Fleet LLC
              </div>
              <div style={{ fontSize: 46, fontWeight: 900, lineHeight: 1.1, marginBottom: 6, color: '#0d1117', fontFamily: 'Georgia, serif' }}>
                Certificate of Completion
              </div>
              <div style={{ fontSize: 11, color: '#666', letterSpacing: 4, textTransform: 'uppercase' }}>
                Aerodyne Academy · Part 147 Aligned Program
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #b8922a, transparent)', margin: '20px 0' }} />

            {/* Student Name */}
            <div style={{ textAlign: 'center', fontSize: 12, color: '#666', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
              This certifies that
            </div>
            <div style={{ textAlign: 'center', fontSize: 48, fontWeight: 700, color: '#0d1117', marginBottom: 4, fontFamily: 'Georgia, serif', borderBottom: '2px solid rgba(184,146,42,0.4)', paddingBottom: 10 }}>
              {studentName || 'Academy Graduate'}
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, color: '#333', lineHeight: 1.8, marginTop: 16, marginBottom: 20 }}>
              has successfully completed all{' '}
              <strong style={{ color: '#0d1117', fontWeight: 800 }}>{totalCourses} modules</strong> of the{' '}
              <strong style={{ color: '#0d1117', fontWeight: 800 }}>Aerodyne Fleet OS Training Program</strong><br />
              demonstrating proficiency in aviation maintenance operations,<br />
              MEL/NEF/CDL procedures, ETOPS compliance, and FAA Part 147 aligned knowledge areas.
            </div>

            {/* Courses Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, margin: '16px 0' }}>
              {courseRows.map(c => (
                <div key={c.title} style={{
                  background: '#fdf8ee', border: '1px solid #d4aa50',
                  borderRadius: 4, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#b8922a', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#1a1a2e' }}>{c.title}</span>
                </div>
              ))}
            </div>

            {/* Footer divider */}
            <div style={{ height: 1, background: '#d4aa50', margin: '24px 0 20px' }} />

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              {/* Sig 1 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 180, height: 1, background: '#999', margin: '0 auto 4px' }} />
                <div style={{ fontSize: 10, color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>Chief Instructor</div>
                <div style={{ fontSize: 11, color: '#0d1117', fontWeight: 700, marginTop: 2 }}>Aerodyne Academy</div>
              </div>

              {/* Seal */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 96, height: 96, borderRadius: '50%',
                  border: '3px solid #b8922a',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: '#fdf8ee', margin: '0 auto',
                }}>
                  <div style={{ fontSize: 24 }}>✈️</div>
                  <div style={{ fontSize: 7, letterSpacing: 2, color: '#b8922a', textTransform: 'uppercase', fontWeight: 900, textAlign: 'center', marginTop: 2, lineHeight: 1.4 }}>
                    AERODYNE<br />CERTIFIED
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#555', textAlign: 'center', marginTop: 8 }}>{dateStr}</div>
              </div>

              {/* Sig 2 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 180, height: 1, background: '#999', margin: '0 auto 4px' }} />
                <div style={{ fontSize: 10, color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>Director of Training</div>
                <div style={{ fontSize: 11, color: '#0d1117', fontWeight: 700, marginTop: 2 }}>Aerodyne Fleet LLC</div>
              </div>
            </div>

            {/* Cert ID */}
            <div style={{ fontSize: 9, color: '#999', textAlign: 'center', marginTop: 16, letterSpacing: 1 }}>
              Certificate ID: {certId} · Issued by Aerodyne Fleet LLC · {dateStr}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}