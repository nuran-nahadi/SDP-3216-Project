'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseText, parseVoice } from '@/lib/api/tasks';
import { toast } from 'sonner';
import { Loader2, FileText, Mic } from 'lucide-react';
import { TaskForm } from './task-form';
import { Task, TaskPriority, TaskStatus } from '@/lib/types/task';

type AIMode = 'text' | 'voice';

interface ParsedTaskData {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  estimated_duration?: number | null;
  tags?: string[];
  confidence?: number;
}

export function TaskAICopilot() {
  const [mode, setMode] = useState<AIMode>('text');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTaskData | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Text mode state
  const [textInput, setTextInput] = useState('');

  // Voice mode state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [transcription, setTranscription] = useState('');

  const handleTextParse = async () => {
    if (!textInput.trim()) {
      toast.error('Please enter some text');
      return;
    }

    try {
      setLoading(true);
      const response = await parseText(textInput);
      const parsed = response.data;
      setParsedData({
        title: parsed.title,
        description: parsed.description,
        due_date: parsed.due_date,
        priority: parsed.priority,
        status: parsed.status,
        estimated_duration: parsed.estimated_duration,
        tags: parsed.tags,
        confidence: parsed.confidence,
      });
      toast.success('Text parsed successfully');
    } catch (error) {
      console.error('Error parsing text:', error);
      toast.error('Failed to parse text');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        
        // Parse voice
        try {
          setLoading(true);
          const response = await parseVoice(audioFile);
          const parsed = response.data;
          setParsedData({
            title: parsed.title,
            description: parsed.description,
            due_date: parsed.due_date,
            priority: parsed.priority,
            status: parsed.status,
            estimated_duration: parsed.estimated_duration,
            tags: parsed.tags,
            confidence: parsed.confidence,
          });
          setTranscription(parsed.description || '');
          toast.success('Voice parsed successfully');
        } catch (error) {
          console.error('Error parsing voice:', error);
          toast.error('Failed to parse voice');
        } finally {
          setLoading(false);
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleReviewAndEdit = () => {
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setParsedData(null);
    setTextInput('');
    setTranscription('');
    toast.success('Task saved successfully');
  };

  if (showForm && parsedData) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Review and Edit Task</h3>
          <p className="text-sm text-muted-foreground">
            AI Confidence: {((parsedData.confidence || 0) * 100).toFixed(0)}%
          </p>
        </div>
        <TaskForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
          initialData={{
            title: parsedData.title || '',
            description: parsedData.description || '',
            due_date: parsedData.due_date || '',
            priority: parsedData.priority || TaskPriority.MEDIUM,
            estimated_duration: parsedData.estimated_duration || undefined,
            tags: parsedData.tags || [],
          }}
        />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">AI Task Assistant</h3>
        <p className="text-sm text-muted-foreground">
          Add tasks using natural language or voice
        </p>
      </div>

      <Tabs value={mode} onValueChange={(value) => setMode(value as AIMode)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">
            <FileText className="h-4 w-4 mr-2" />
            Text
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Mic className="h-4 w-4 mr-2" />
            Voice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div>
            <Textarea
              placeholder="e.g., Finish project report by Friday, high priority, should take about 2 hours"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="mt-2 min-h-[100px]"
            />
          </div>
          <Button onClick={handleTextParse} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Parsing...
              </>
            ) : (
              'Parse Text'
            )}
          </Button>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <div className="text-center space-y-4">
            {!isRecording ? (
              <Button onClick={startRecording} size="lg" className="w-full">
                <Mic className="mr-2 h-5 w-5" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" size="lg" className="w-full">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-white animate-pulse mr-2" />
                  Stop Recording
                </div>
              </Button>
            )}
            {transcription && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Transcription:</p>
                <p className="text-sm">{transcription}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {parsedData && !showForm && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Parsed Data</h4>
              <Badge variant={parsedData.confidence && parsedData.confidence > 0.7 ? 'default' : 'secondary'}>
                {((parsedData.confidence || 0) * 100).toFixed(0)}% confidence
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {parsedData.title && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Title:</span>{' '}
                  <span className="font-medium">{parsedData.title}</span>
                </div>
              )}
              {parsedData.priority && (
                <div>
                  <span className="text-muted-foreground">Priority:</span>{' '}
                  <span className="font-medium capitalize">{parsedData.priority}</span>
                </div>
              )}
              {parsedData.due_date && (
                <div>
                  <span className="text-muted-foreground">Due Date:</span>{' '}
                  <span className="font-medium">{parsedData.due_date}</span>
                </div>
              )}
              {parsedData.estimated_duration && (
                <div>
                  <span className="text-muted-foreground">Duration:</span>{' '}
                  <span className="font-medium">{parsedData.estimated_duration} min</span>
                </div>
              )}
              {parsedData.tags && parsedData.tags.length > 0 && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Tags:</span>{' '}
                  <span className="font-medium">{parsedData.tags.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleReviewAndEdit} className="w-full">
            Review and Save
          </Button>
        </div>
      )}
    </Card>
  );
}
