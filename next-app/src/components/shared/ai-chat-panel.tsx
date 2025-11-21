'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, X, Loader2, Image as ImageIcon, Mic } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
}

interface AIChatPanelProps {
  title: string;
  placeholder?: string;
  onSendMessage: (message: string) => Promise<{ content: string; data?: any }>;
  onAcceptSuggestion?: (data: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatPanel({
  title,
  placeholder = 'Type your message...',
  onSendMessage,
  onAcceptSuggestion,
  isOpen,
  onClose,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI assistant. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await onSendMessage(input.trim());
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.content,
        data: response.data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-background/95 backdrop-blur-sm border-l shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/80'
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                
                {message.data && onAcceptSuggestion && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onAcceptSuggestion(message.data)}
                      className="w-full text-xs h-8"
                    >
                      ✨ Use This Suggestion
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking Animation */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-muted/80 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background/50">
        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="icon" className="h-9 w-9" disabled>
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" disabled>
            <Mic className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isThinking}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            size="icon"
            className="h-10 w-10"
          >
            {isThinking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
