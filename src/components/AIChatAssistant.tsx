import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';
import { useTools } from '@/hooks/useTools';
import { generateInsights } from '@/lib/ai-advisor';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wfbrmywecdrtidcbnxoe.supabase.co';
const CHAT_URL = import.meta.env.DEV 
  ? 'http://127.0.0.1:54321/functions/v1/vault-assistant'
  : `${SUPABASE_URL}/functions/v1/vault-assistant`;

export function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: "Hi! I'm your StackVault AI Advisor. Ask me about your tool stack, costs, or how to optimize your subscriptions." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { tools } = useTools();
  const { session } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    const insights = generateInsights(tools);
    const context = {
      tools: tools.map(t => ({ name: t.name, price: t.price, category: t.category, lastUsed: t.lastUsed, timesUsed: t.timesUsed })),
      usage_summary: `User has ${tools.length} tools. Total spend: $${tools.reduce((acc, t) => acc + Number(t.price || 0), 0)}.`,
      insights: insights
    };

    try {
      if (!session) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: "I'm currently running in **Local Mode**. For deep architectural analysis and cost optimization, please [sign in](/auth) to activate Cloud AI.\n\n" + getAssistantResponse(text, insights) 
        }]);
        setIsTyping(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: newMessages, context }),
      });

      if (!resp.ok) {
        throw new Error("AI request failed");
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      const upsert = (chunk: string) => {
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && last.id === 'stream') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { id: 'stream', role: 'assistant', content: assistantContent }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
      
      // Update ID to final once done to prevent overwriting next msg
      setMessages(prev => prev.map(m => m.id === 'stream' ? { ...m, id: Date.now().toString() } : m));
    } catch (error) {
      console.warn("AI Backend Error, falling back to local insights.", error);
      const fallbackResponse = getAssistantResponse(text, insights);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: fallbackResponse }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getAssistantResponse = (query: string, insights: string[]): string => {
    const q = query.toLowerCase();
    
    if (q.includes('wasted') || q.includes('cost') || q.includes('spend') || q.includes('money')) {
      const wasteInsight = insights.find(i => i.includes('wasting') || i.includes('unused'));
      return wasteInsight || "You don't have any wasted spend on unused tools right now. Great job!";
    }
    
    if (q.includes('best') || q.includes('top') || q.includes('value')) {
      const valueInsight = insights.find(i => i.includes('highest value'));
      return valueInsight || "You haven't used your tools enough to determine the highest value one yet.";
    }
    
    if (q.includes('optimiz') || q.includes('suggest') || q.includes('tip') || q.includes('remove') || q.includes('cancel')) {
      const removeInsights = insights.filter(i => i.includes('removing'));
      if (removeInsights.length > 0) {
        return "Here is what you should optimize:\n\n" + removeInsights.map(i => `• ${i}`).join('\n');
      }
      return "Your stack looks optimized right now! Keep using your tools to get the most value.";
    }
    
    if (insights.length > 0 && !insights[0].includes("well-balanced")) {
      return `Here's an insight for you: ${insights[0]}\n\nYou can ask me about wasted spend, best tools, or optimization tips.`;
    }

    return "I'm monitoring your stack. You can ask me to analyze your costs, identify your best tools, or give optimization tips!";
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg shadow-blue-500/20 bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 transition-all z-50 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 rounded-2xl shadow-2xl bg-background border border-border overflow-hidden z-50 flex flex-col h-[500px] max-h-[80vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-300" />
              <span className="font-semibold">AI Advisor</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-blue-600 text-white' : 'bg-primary text-primary-foreground'}`}>
                  {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-2xl max-w-[75%] shadow-sm ${msg.role === 'assistant' ? 'bg-secondary text-secondary-foreground rounded-tl-none' : 'bg-primary text-primary-foreground rounded-tr-none'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-secondary p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length < 3 && !isTyping && (
            <div className="px-4 py-2 flex flex-wrap gap-2 text-xs border-t border-border bg-background">
              <button onClick={() => handleSend("Wasted spend")} className="bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-full transition-colors border border-border">Wasted spend</button>
              <button onClick={() => handleSend("Best tools")} className="bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-full transition-colors border border-border">Best tools</button>
              <button onClick={() => handleSend("Optimization tips")} className="bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-full transition-colors border border-border">Optimization tips</button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-background border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex items-center gap-2 relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your tools..."
                className="flex-1 bg-secondary border border-border rounded-full pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-1 w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
