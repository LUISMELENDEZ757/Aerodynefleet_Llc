import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { QrCode, Camera, X, CheckCircle, Upload, Fuel, AlertTriangle, Wrench, Cloud, Calculator, FileText, Image, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Photo Upload Card ─────────────────────────────────────────────────────
function PhotoUploader({ label, icon: Icon, color, tag }) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotos(prev => [...prev, { url: file_url, name: file.name, tag }]);
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
      >
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
          {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Icon className="w-4 h-4 text-white" />}
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">Tap to capture or select photo</p>
        </div>
        <Upload className="w-4 h-4 text-muted-foreground" />
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handleFile} />
      {photos.length > 0 && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          {photos.map((p, i) => (
            <div key={i} className="relative group">
              <img src={p.url} alt={p.name} className="w-16 h-16 rounded-lg object-cover border border-border" />
              <button
                onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Aircraft Data Loaded View ─────────────────────────────────────────────
function AircraftLoadedView({ tailNumber, onClear }) {
  const { data: melItems = [], isLoading: melLoading } = useQuery({
    queryKey: ['qr-mel', tailNumber],
    queryFn: () => base44.entities.MELItem.filter({ aircraft_tail: tailNumber, status: 'open' }),
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['qr-aircraft', tailNumber],
    queryFn: () => base44.entities.Aircraft.filter({ tail_number: tailNumber }),
  });

  const ac = aircraft[0];
  const openMEL = melItems.filter(m => m.status === 'open' || m.status === 'expiring_soon');
  const expiredMEL = melItems.filter(m => m.status === 'expired');

  return (
    <div className="space-y-3">
      {/* Aircraft ID banner */}
      <div className="rounded-xl bg-primary/10 border border-primary/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-extrabold font-mono text-primary">{tailNumber}</p>
            {ac && <p className="text-xs text-muted-foreground">{ac.aircraft_type} · {ac.airline}</p>}
          </div>
        </div>
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> Clear
        </button>
      </div>

      {/* MEL/CDL */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-secondary/50 flex items-center gap-2">
          <Wrench className="w-3.5 h-3.5 text-orange-400" />
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">MEL / CDL Items</p>
          {openMEL.length > 0 && (
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400">
              {openMEL.length} open
            </span>
          )}
        </div>
        {melLoading ? (
          <p className="text-xs text-muted-foreground p-4">Loading MEL data…</p>
        ) : melItems.length === 0 ? (
          <div className="px-4 py-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <p className="text-sm text-green-400 font-semibold">No open MEL items</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {melItems.slice(0, 5).map(m => (
              <div key={m.id} className="px-4 py-2.5 flex items-start gap-3">
                <span className={cn('text-[10px] font-extrabold px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0',
                  m.category === 'A' ? 'bg-destructive/15 text-destructive' :
                  m.category === 'B' ? 'bg-orange-500/15 text-orange-400' :
                  m.category === 'C' ? 'bg-yellow-500/15 text-yellow-400' :
                  'bg-muted text-muted-foreground'
                )}>CAT {m.category}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{m.description}</p>
                  <p className="text-[10px] text-muted-foreground">ATA {m.ata_chapter} · Expires {m.expiry_date || '—'}</p>
                </div>
                {m.status === 'expired' && (
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                )}
              </div>
            ))}
            {melItems.length > 5 && (
              <p className="px-4 py-2 text-xs text-muted-foreground">+{melItems.length - 5} more items</p>
            )}
          </div>
        )}
      </div>

      {/* Quick links to loaded modules */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: Cloud,       label: 'Weather',      color: 'text-cyan-400',   tab: 'wx',   bg: 'bg-cyan-500/10 border-cyan-500/20' },
          { icon: Calculator,  label: 'Performance',  color: 'text-primary',    tab: 'perf', bg: 'bg-primary/10 border-primary/20' },
          { icon: FileText,    label: 'Flight Brief',  color: 'text-blue-400',  tab: 'brief',bg: 'bg-blue-500/10 border-blue-500/20' },
          { icon: Fuel,        label: 'Fuel Plan',    color: 'text-amber-400',  tab: 'fuel', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map(({ icon: Icon, label, color, bg }) => (
          <div key={label} className={cn('rounded-xl border px-3 py-3 flex items-center gap-2', bg)}>
            <Icon className={cn('w-4 h-4 flex-shrink-0', color)} />
            <p className="text-xs font-semibold text-foreground">{label}</p>
            <span className="ml-auto text-[9px] font-bold text-green-400 uppercase">Loaded</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main QR Panel ─────────────────────────────────────────────────────────
export default function QRScanPanel() {
  const [scannedTail, setScannedTail] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Use jsQR via dynamic import for QR scanning
  const startScan = async () => {
    setShowScanner(true);
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setShowScanner(false);
      setScanning(false);
      alert('Camera access denied. Please use manual entry.');
    }
  };

  const stopScan = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowScanner(false);
    setScanning(false);
  };

  // Capture frame and decode QR from canvas
  const captureFrame = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Dynamically load jsQR
    const { default: jsQR } = await import('https://esm.sh/jsqr@1.4.0');
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      const tail = code.data.trim().toUpperCase();
      setScannedTail(tail);
      stopScan();
    }
  };

  // Auto-scan frames
  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(captureFrame, 500);
    return () => clearInterval(interval);
  }, [scanning]);

  const loadManual = () => {
    const t = manualInput.trim().toUpperCase();
    if (t) { setScannedTail(t); setManualInput(''); }
  };

  return (
    <div className="space-y-4">
      {/* QR Scanner section */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/50 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-primary" />
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Aircraft QR Scanner</p>
          {scannedTail && (
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
              {scannedTail} loaded
            </span>
          )}
        </div>
        <div className="p-4 space-y-3">
          {/* Camera viewfinder */}
          {showScanner && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-primary rounded-xl relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary/60 animate-pulse" />
                </div>
              </div>
              <button onClick={stopScan} className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
              <p className="absolute bottom-3 inset-x-0 text-center text-xs text-white/70">Point at aircraft QR code</p>
            </div>
          )}

          {/* Scan button + manual entry */}
          {!showScanner && (
            <div className="flex gap-2">
              <button
                onClick={startScan}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4" /> Scan QR
              </button>
              <div className="flex flex-1 gap-2">
                <input
                  type="text" value={manualInput}
                  onChange={e => setManualInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && loadManual()}
                  placeholder="Manual tail # (e.g. N455GJ)"
                  className="flex-1 h-10 bg-secondary border border-border rounded-xl px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button onClick={loadManual}
                  className="px-3 h-10 bg-secondary border border-border rounded-xl text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors">
                  Load
                </button>
              </div>
            </div>
          )}

          {/* Loaded aircraft data */}
          {scannedTail && <AircraftLoadedView tailNumber={scannedTail} onClear={() => setScannedTail('')} />}
        </div>
      </div>

      {/* Photo Uploads */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/50 flex items-center gap-2">
          <Image className="w-4 h-4 text-primary" />
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Photo Uploads</p>
        </div>
        <div className="p-3 space-y-2">
          <PhotoUploader label="Fuel Slip" icon={Fuel} color="bg-amber-500" tag="fuel_slip" />
          <PhotoUploader label="Damage / Defect" icon={AlertTriangle} color="bg-destructive" tag="damage" />
          <PhotoUploader label="Cabin Irregularity" icon={Image} color="bg-purple-500" tag="cabin" />
        </div>
      </div>
    </div>
  );
}