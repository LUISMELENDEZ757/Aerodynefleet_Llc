import { FileText, BookOpen, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DocumentsSection({ tailNumber, logEntries }) {
  const signedEntries = logEntries.filter(e => e.is_signed);
  const logPages = logEntries.filter(e => e.log_page);

  const docGroups = [
    {
      title: 'Logbook Pages',
      icon: BookOpen,
      docs: logPages.map(e => ({
        name: `Log Page ${e.log_page}`,
        type: e.entry_type,
        date: e.created_date,
        signed: e.is_signed,
        id: e.id,
      })),
    },
    {
      title: 'Signed Records',
      icon: ClipboardList,
      docs: signedEntries.map(e => ({
        name: e.description?.slice(0, 50) + (e.description?.length > 50 ? '…' : ''),
        type: 'signed',
        date: e.created_date,
        signed: true,
        id: e.id,
      })),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-extrabold text-foreground">Documents</h2>

      {logEntries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-base font-bold text-muted-foreground">No documents found</p>
        </div>
      ) : (
        <div className="space-y-5">
          {docGroups.map(group => (
            group.docs.length > 0 && (
              <div key={group.title}>
                <div className="flex items-center gap-2 mb-3">
                  <group.icon className="w-4 h-4 text-primary" />
                  <p className="text-sm font-extrabold text-foreground">{group.title} ({group.docs.length})</p>
                </div>
                <div className="space-y-2">
                  {group.docs.slice(0, 10).map(doc => (
                    <div key={doc.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(doc.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {doc.signed && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-600/30">
                            SIGNED
                          </span>
                        )}
                        <span className="text-[9px] text-muted-foreground uppercase">{doc.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}