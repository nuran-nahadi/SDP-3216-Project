'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, StopCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ConversationMessage, DailyUpdateSession } from '@/lib/types/daily-update';
import { cn } from '@/lib/utils/cn';

interface DailyUpdateChatProps {
  session: DailyUpdateSession | null;
  messages: ConversationMessage[];
  isLoading: boolean;
  isSending: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onStartSession: () => Promise<void>;
  onEndSession: () => Promise<void>;
  pendingCount: number;
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const isAssistant = message.role === 'assistant';
  
  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isAssistant
            ? "bg-primary/10 text-primary"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {isAssistant ? (
          <Bot className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isAssistant
            ? "bg-muted rounded-tl-sm"
            : "bg-primary text-primary-foreground rounded-tr-sm"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {message.timestamp && (
          <p
            className={cn(
              "text-xs mt-1",
              isAssistant ? "text-muted-foreground" : "text-primary-foreground/70"
            )}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
}

export function DailyUpdateChat({
  session,
  messages,
  isLoading,
  isSending,
  onSendMessage,
  onStartSession,
  onEndSession,
  pendingCount,
}: DailyUpdateChatProps) {
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const message = inputValue.trim();
    setInputValue('');
    await onSendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // No active session - show start button
  if (!session) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Daily Update Assistant</CardTitle>
          <p className="text-muted-foreground mt-2">
            Start a conversation to quickly capture your tasks, expenses, events, and journal entries.
            Your AI assistant will help organize everything for you.
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <Button
            size="lg"
            onClick={onStartSession}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Bot className="h-5 w-5" />
                Start Daily Update
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Daily Update Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">
                Session started {new Date(session.started_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="secondary">
                {pendingCount} pending
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onEndSession}
              disabled={isLoading}
            >
              <StopCircle className="h-4 w-4 mr-1" />
              End Session
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p className="text-center">
              Your conversation will appear here.<br />
              The assistant is ready to help!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            {isSending && (
              <div className="flex gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      <CardFooter className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me about your day... (Press Enter to send, Shift+Enter for new line)"
            disabled={isSending}
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isSending}
            className="flex-shrink-0 h-11 w-11"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

export default DailyUpdateChat;
