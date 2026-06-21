import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Send, Bot, Sparkles, BookOpen, Wrench, FileText, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = [
  { icon: '📋', label: 'MEL Categories', prompt: 'Explain the four MEL categories (A, B, C, D) and their repair intervals.' },
  { icon: '🔩', label: 'CDL vs MEL', prompt: 'What is the difference between a CDL and a MEL? When would I use each?' },
  { icon: '📖', label: '14 CFR 43.9', prompt: 'What are the required elements of a maintenance record under 14 CFR 43.9?' },
  { icon: '🌍', label: 'ETOPS MEL', prompt: 'How does an ETOPS-critical MEL item affect dispatch authorization?' },
  { icon: '✈️', label: 'ATA Chapters', prompt: 'Give me a quick reference of the most common ATA chapters I should know as an AMT.' },
  { icon: '📜', label: 'CRS Basics', prompt: 'When is a Certificate of Release to Service required, and what must it include?' },
];

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-violet-400" />
        </div>
      )}
      <div className={cn('max-w-[85%]', isUser && 'flex flex-col items-end')}>
        {message.content && (
          <div className={cn(
            'rounded-2xl px-4 py-2.5',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-[#141922] border border-white/10 text-gray-100'
          )}>
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="text-primary font-bold">{children}</strong>,
                  code: ({ inline, children }) => inline
                    ? <code className="px-1.5 py-0.5 rounded bg-white/10 text-primary text-xs font-mono">{children}</code>
                    : <pre className="bg-[#0d1117] rounded-lg p-3 overflow-x-auto my-2 text-xs font-mono text-gray-300 border border-white/10">{children}</pre>,
                  h3: ({ children }) => <h3 className="text-sm font-extrabold text-white mt-3 mb-1">{children}</h3>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/50 pl-3 my-2 text-gray-400 italic">{children}</blockquote>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {/* Tool calls (loading state) */}
        {message.tool_calls?.length > 0 && message.tool_calls.some(t => t.status === 'running' || t.status === 'in_progress') && (
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-violet-400">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Thinking…
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcademyTutor({ onBack, initialPrompt }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Start conversation on mount
  useEffect(() => {
    async function start() {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: 'academy_tutor',
          metadata: { name: 'Academy Tutor Session' },
        });
        setConversation(conv);

        // Subscribe to real-time updates
        const unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
          setMessages(data.messages || []);
        });

        // If an initial prompt was passed (e.g. from quick prompt or scenario), send it
        if (initialPrompt) {
          await base44.agents.addMessage(conv, { role: 'user', content: initialPrompt });
        }

        setStarting(false);
        return unsub;
      } catch (e) {
        setStarting(false);
      }
    }
    const cleanup = start();
    return () => { cleanup.then(unsub => unsub?.())};
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isWaiting = messages.length > 0 && messages[messages.length - 1]?.role === 'user';

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || !conversation || loading) return;
    setInput('');
    setLoading(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-white">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 flex-shrink-0">
        <button onClick={onBack} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <Bot className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <p className="text-base font-extrabold">AI Tutor</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Part 147 · MEL · CDL · FAA Regulations</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/25">
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span className="text-[10px] font-bold text-violet-400">AI-Powered</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

        {/* Welcome state */}
        {messages.length === 0 && !starting && (
          <div className="space-y-6">
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-violet-400" />
              </div>
              <p className="text-lg font-extrabold text-white">Your Aviation Tutor</p>
              <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                Ask me anything about MEL/CDL workflows, ATA chapters, logbook requirements, or use a quick prompt below.
              </p>
            </div>

            {/* Quick prompts */}
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Quick Topics</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_PROMPTS.map(qp => (
                  <button key={qp.label} onClick={() => sendMessage(qp.prompt)}
                    className="flex items-center gap-3 bg-[#141922] border border-white/10 rounded-xl px-4 py-3 text-left hover:border-violet-500/40 hover:bg-violet-900/10 transition-all group">
                    <span className="text-xl flex-shrink-0">{qp.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">{qp.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{qp.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading/starting state */}
        {starting && (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* AI typing indicator */}
        {isWaiting && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="bg-[#141922] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-white/10 bg-[#0d1117] px-5 py-4">
        <div className="flex items-end gap-3 bg-[#141922] border border-white/15 rounded-2xl px-4 py-3 focus-within:border-violet-500/50 transition-colors">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about MEL categories, CDL procedures, ATA chapters…"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none resize-none max-h-32 leading-relaxed"
            style={{ fieldSizing: 'content' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading || !conversation}
            className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-gray-600 text-center mt-2">
          AI tutors can make mistakes — always verify with official AMM and regulatory references.
        </p>
      </div>
    </div>
  );
}