import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BookMarked, Tag, ExternalLink } from 'lucide-react';
import { CAT_CFG } from './navConfig';

export default function ManualDocCard({ doc }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = CAT_CFG[doc.category] || CAT_CFG.other;

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden backdrop-blur-xl">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left"
      >
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
          <BookMarked className={cn('w-4 h-4', cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0', cfg.bg, cfg.color)}>
              {cfg.label}
            </span>
            {doc.document_number && (
              <span className="text-[10px] font-mono text-muted-foreground">{doc.document_number}</span>
            )}
            {doc.revision && <span className="text-[10px] text-muted-foreground">Rev {doc.revision}</span>}
          </div>
          <p className="text-sm font-semibold text-foreground truncate">{doc.title}</p>
          {doc.summary && <p className="text-xs text-muted-foreground line-clamp-1">{doc.summary}</p>}
        </div>
        {doc.effective_date && (
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{doc.effective_date}</span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-white/5 p-4 space-y-3 bg-white/[0.02]">
          {doc.summary && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Summary</p>
              <p className="text-sm text-foreground">{doc.summary}</p>
            </div>
          )}
          {doc.content && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Content</p>
              <p className="text-xs text-foreground bg-black/20 rounded-lg px-3 py-2 whitespace-pre-wrap max-h-44 overflow-y-auto">
                {doc.content}
              </p>
            </div>
          )}
          {doc.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {doc.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground flex items-center gap-1"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
          {doc.file_url && (
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Document
            </a>
          )}
        </div>
      )}
    </div>
  );
}