import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, CheckCircle, Download } from 'lucide-react';

export default function ToolQRSetup({ tool, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>QR Code - ${tool.tool_number}</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: monospace; }
            .card { border: 2px solid #000; border-radius: 12px; padding: 24px; text-align: center; display: inline-block; }
            .tool-num { font-size: 18px; font-weight: bold; margin-top: 12px; }
            .tool-name { font-size: 13px; color: #555; margin-top: 4px; }
            .label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 8px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#141922] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-green-900/30">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="font-extrabold text-white text-sm">Tool Registered!</p>
              <p className="text-xs text-green-400">QR code generated — ready to print</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code display */}
        <div className="p-6 flex flex-col items-center gap-4">
          <div ref={printRef}>
            <div className="card bg-white rounded-2xl p-6 flex flex-col items-center shadow-lg">
              <p className="label text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Aerodyne Fleet LLC · Tool ID</p>
              <QRCodeSVG
                value={tool.tool_number}
                size={160}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={true}
              />
              <p className="tool-num text-lg font-extrabold text-black mt-3 font-mono">{tool.tool_number}</p>
              <p className="tool-name text-sm text-gray-600 mt-1 text-center max-w-[180px]">{tool.name}</p>
              {tool.manufacturer && <p className="text-xs text-gray-400 mt-0.5">{tool.manufacturer}</p>}
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400">Scan this code for instant check-out / check-in</p>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{tool.tool_number}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-colors"
            >
              <Printer className="w-4 h-4" /> Print QR Label
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}