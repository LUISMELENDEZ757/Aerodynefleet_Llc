import { useState } from 'react';
import { CheckCircle, FileText } from 'lucide-react';

export default function ShiftSignOff({ handoverData, onConfirm, isPending }) {
  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);
  const canvasRef = useState(null)[1];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!signature.trim() || !agreed) {
      alert('Please sign and acknowledge the handover');
      return;
    }
    onConfirm({ ...handoverData, signed_by: signature, shift_end_time: new Date().toISOString() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Review Section */}
      <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Handover Summary Review
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Technician</p>
            <p className="text-sm font-bold text-white">{handoverData.submitted_by}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Shift Period</p>
            <p className="text-sm font-bold text-white capitalize">{handoverData.shift_period}</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Progress Summary</p>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{handoverData.progress_summary}</p>
        </div>

        {handoverData.aircraft_worked_on.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Aircraft Worked On</p>
            <div className="flex flex-wrap gap-2">
              {handoverData.aircraft_worked_on.map(tail => (
                <span key={tail} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-bold">
                  {tail}
                </span>
              ))}
            </div>
          </div>
        )}

        {handoverData.pending_issues.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Pending Issues ({handoverData.pending_issues.length})</p>
            <div className="space-y-2">
              {handoverData.pending_issues.map((issue, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg px-3 py-2 border-l-2 border-orange-500">
                  <p className="text-sm font-bold text-white">{issue.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {issue.aircraft_tail && `${issue.aircraft_tail} • `}
                    <span className="font-bold capitalize text-orange-400">{issue.priority}</span>
                    {issue.assigned_to && ` → ${issue.assigned_to}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {handoverData.safety_critical_notes && (
          <div className="bg-red-900/20 border border-red-500/40 rounded-lg px-4 py-3">
            <p className="text-xs text-red-400 uppercase tracking-widest font-bold mb-1">⚠ Safety Critical Notes</p>
            <p className="text-sm text-red-300 whitespace-pre-wrap">{handoverData.safety_critical_notes}</p>
          </div>
        )}
      </div>

      {/* Sign-Off Section */}
      <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white">Sign-Off & Acknowledgment</h3>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Your Signature / Badge ID</label>
          <input value={signature} onChange={e => setSignature(e.target.value)}
            placeholder="Type your name or badge ID" required
            className="w-full bg-[#0a0d11] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/40"
          />
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg px-4 py-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-1" required />
            <div>
              <p className="text-sm font-bold text-white">I acknowledge that:</p>
              <ul className="text-xs text-gray-400 mt-2 space-y-1">
                <li>• All work completed is accurately documented</li>
                <li>• All pending issues are properly noted for the next shift</li>
                <li>• Safety-critical information has been communicated</li>
                <li>• Tools and parts consumed are correctly recorded</li>
                <li>• I am authorized to sign off on maintenance records per FAA 14 CFR 43</li>
              </ul>
            </div>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <button type="submit" disabled={isPending || !signature.trim() || !agreed}
          className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {isPending ? 'Signing Off...' : 'Sign Off & Complete Shift'}
        </button>
      </div>
    </form>
  );
}