import { useEffect, useRef, useState } from 'react';
import jsQR from 'https://esm.sh/jsqr@1.4.0';
import { X, QrCode, Camera, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AircraftQRScanner({ aircraft = [], onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('scanning'); // scanning | found | error
  const [foundTail, setFoundTail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        videoRef.current.onloadedmetadata = () => scanLoop();
      }
    } catch (e) {
      setError('Camera access denied or unavailable');
      setStatus('error');
    }
  };

  const stopCamera = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      const raw = code.data.trim().toUpperCase();
      // Try to match against known aircraft tails or use value directly
      const match = aircraft.find(a => a.tail_number.toUpperCase() === raw) || aircraft.find(a => raw.includes(a.tail_number.toUpperCase()));
      const tail = match ? match.tail_number : raw;
      stopCamera();
      setFoundTail(tail);
      setStatus('found');
    } else {
      animRef.current = requestAnimationFrame(scanLoop);
    }
  };

  const handleConfirm = () => {
    onScan(foundTail);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4" style={{ paddingTop: '1in' }}>
      <div className="w-full max-w-sm bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" />
            <p className="text-sm font-extrabold text-white">Scan Aircraft QR</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black aspect-square">
          {status === 'scanning' && (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-52 h-52 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  {/* Scan line */}
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary/70 animate-pulse" />
                </div>
              </div>
              <p className="absolute bottom-3 inset-x-0 text-center text-xs text-white/60">Point camera at aircraft QR code</p>
            </>
          )}

          {status === 'found' && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
              <CheckCircle className="w-16 h-16 text-green-400" />
              <div className="text-center">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Aircraft Detected</p>
                <p className="text-4xl font-black text-white font-mono">{foundTail}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6">
              <Camera className="w-12 h-12 text-gray-600" />
              <p className="text-sm text-red-400 font-semibold text-center">{error}</p>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 space-y-2">
          {status === 'found' && (
            <button
              onClick={handleConfirm}
              className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors"
            >
              Load {foundTail} Logbook
            </button>
          )}
          {status === 'scanning' && (
            <p className="text-xs text-center text-gray-600">QR codes can encode the tail number (e.g. N101AB)</p>
          )}
          <button onClick={onClose} className="w-full py-2 text-gray-500 text-xs font-semibold hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}