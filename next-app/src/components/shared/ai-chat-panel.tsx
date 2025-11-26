'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, X, Loader2, Image as ImageIcon, Mic, MicOff, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  imagePreview?: string;
}

interface AIChatPanelProps {
  title: string;
  placeholder?: string;
  onSendMessage: (message: string) => Promise<{ content: string; data?: any }>;
  onSendVoice?: (audioFile: File) => Promise<{ content: string; data?: any; transcribedText?: string }>;
  onSendImage?: (imageFile: File) => Promise<{ content: string; data?: any }>;
  onAcceptSuggestion?: (data: any) => void;
  isOpen: boolean;
  onClose: () => void;
  supportsVoice?: boolean;
  supportsImage?: boolean;
}

export function AIChatPanel({
  title,
  placeholder = 'Type your message...',
  onSendMessage,
  onSendVoice,
  onSendImage,
  onAcceptSuggestion,
  isOpen,
  onClose,
  supportsVoice = false,
  supportsImage = false,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI assistant. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isThinking) return;

    // Handle image upload
    if (selectedImage && onSendImage) {
      const userMessage: Message = {
        role: 'user',
        content: 'Analyzing image...',
        imagePreview: imagePreview || undefined,
      };

      setMessages((prev) => [...prev, userMessage]);
      setImagePreview(null);
      setIsThinking(true);

      try {
        const response = await onSendImage(selectedImage);
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.content,
          data: response.data,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, I had trouble processing that image. Please try again.',
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsThinking(false);
        setSelectedImage(null);
      }
      return;
    }

    // Handle text input
    if (!input.trim()) return;

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

  const handleVoiceRecording = async () => {
    if (!onSendVoice) return;

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      return;
    }

    // Start recording
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        alert('Audio recording is not supported in this browser');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice-recording.webm', { type: 'audio/webm' });

        const userMessage: Message = {
          role: 'user',
          content: '🎤 Voice message...',
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsThinking(true);

        try {
          const response = await onSendVoice(audioFile);
          
          let content = response.content;
          if (response.transcribedText) {
            content = `📝 Transcribed: "${response.transcribedText}"\n\n${content}`;
          }

          const assistantMessage: Message = {
            role: 'assistant',
            content,
            data: response.data,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
          const errorMessage: Message = {
            role: 'assistant',
            content: 'Sorry, I had trouble processing that voice message. Please try again or speak more clearly.',
          };
          setMessages((prev) => [...prev, errorMessage]);
        } finally {
          setIsThinking(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImagePreview = () => {
    setImagePreview(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img 
              src={imagePreview} 
              alt="Selected" 
              className="h-20 w-20 object-cover rounded-lg border"
            />
            <button
              onClick={clearImagePreview}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 h-5 w-5 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="mb-3 flex items-center gap-2 text-destructive">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm">Recording... Click mic to stop</span>
          </div>
        )}

        <div className="flex gap-2 mb-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9" 
            disabled={!supportsImage || isThinking || isRecording}
            onClick={() => fileInputRef.current?.click()}
            title={supportsImage ? "Upload image" : "Image upload not supported"}
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Button 
            variant={isRecording ? "destructive" : "outline"} 
            size="icon" 
            className="h-9 w-9" 
            disabled={!supportsVoice || isThinking}
            onClick={handleVoiceRecording}
            title={supportsVoice ? (isRecording ? "Stop recording" : "Start voice recording") : "Voice input not supported"}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isThinking || isRecording}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && !selectedImage) || isThinking || isRecording}
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
