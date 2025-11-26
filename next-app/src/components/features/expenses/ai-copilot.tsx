'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseText, parseReceipt, parseVoice } from '@/lib/api/expenses';
import { toast } from 'sonner';
import { Loader2, FileText, Image as ImageIcon, Mic } from 'lucide-react';
import { ExpenseForm } from './expense-form';
import { Expense } from '@/lib/types/expense';

type AIMode = 'text' | 'receipt' | 'voice';

interface ParsedExpenseData {
  amount?: number;
  currency?: string;
  category?: string;
  subcategory?: string;
  merchant?: string | null;
  description?: string | null;
  date?: string;
  payment_method?: string | null;
  confidence?: number;
}

export function AICopilot() {
  const [mode, setMode] = useState<AIMode>('text');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedExpenseData | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Text mode state
  const [textInput, setTextInput] = useState('');

  // Receipt mode state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

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
        amount: parsed.amount,
        currency: parsed.currency,
        category: parsed.category,
        merchant: parsed.merchant,
        description: parsed.description,
        date: parsed.date,
        payment_method: parsed.payment_method,
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

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setReceiptFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Parse receipt
    try {
      setLoading(true);
      const response = await parseReceipt(file);
      const parsed = response.data;
      setParsedData({
        amount: parsed.amount,
        currency: parsed.currency,
        category: parsed.category,
        merchant: parsed.merchant,
        description: parsed.description,
        date: parsed.date,
        payment_method: parsed.payment_method,
        confidence: parsed.confidence,
      });
      toast.success('Receipt parsed successfully');
    } catch (error) {
      console.error('Error parsing receipt:', error);
      toast.error('Failed to parse receipt');
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
            amount: parsed.amount,
            currency: parsed.currency,
            category: parsed.category,
            merchant: parsed.merchant,
            description: parsed.description,
            date: parsed.date,
            payment_method: parsed.payment_method,
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
    setReceiptFile(null);
    setReceiptPreview(null);
    setTranscription('');
    toast.success('Expense saved successfully');
  };

  if (showForm && parsedData) {
    const expenseData: Partial<Expense> = {
      amount: parsedData.amount || 0,
      currency: parsedData.currency || 'USD',
      category: parsedData.category as any,
      subcategory: parsedData.subcategory,
      merchant: parsedData.merchant,
      description: parsedData.description,
      date: parsedData.date || new Date().toISOString().split('T')[0],
      payment_method: parsedData.payment_method as any,
    };

    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Review and Edit Expense</h3>
          <p className="text-sm text-muted-foreground">
            AI Confidence: {((parsedData.confidence || 0) * 100).toFixed(0)}%
          </p>
        </div>
        <ExpenseForm
          expense={expenseData as Expense}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">AI Expense Assistant</h3>
        <p className="text-sm text-muted-foreground">
          Add expenses using natural language, receipts, or voice
        </p>
      </div>

      <Tabs value={mode} onValueChange={(value) => setMode(value as AIMode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text">
            <FileText className="h-4 w-4 mr-2" />
            Text
          </TabsTrigger>
          <TabsTrigger value="receipt">
            <ImageIcon className="h-4 w-4 mr-2" />
            Receipt
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Mic className="h-4 w-4 mr-2" />
            Voice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div>
            <Textarea
              placeholder="e.g., Spent $45.50 on groceries at Whole Foods yesterday"
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

        <TabsContent value="receipt" className="space-y-4">
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleReceiptUpload}
              className="mt-2"
            />
          </div>
          {receiptPreview && (
            <div className="mt-4">
              <img
                src={receiptPreview}
                alt="Receipt preview"
                className="max-w-full h-auto rounded-lg border"
              />
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Processing receipt...</span>
            </div>
          )}
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
              {parsedData.amount && (
                <div>
                  <span className="text-muted-foreground">Amount:</span>{' '}
                  <span className="font-medium">
                    {parsedData.currency || 'USD'} {parsedData.amount}
                  </span>
                </div>
              )}
              {parsedData.category && (
                <div>
                  <span className="text-muted-foreground">Category:</span>{' '}
                  <span className="font-medium capitalize">{parsedData.category}</span>
                </div>
              )}
              {parsedData.merchant && (
                <div>
                  <span className="text-muted-foreground">Merchant:</span>{' '}
                  <span className="font-medium">{parsedData.merchant}</span>
                </div>
              )}
              {parsedData.date && (
                <div>
                  <span className="text-muted-foreground">Date:</span>{' '}
                  <span className="font-medium">{parsedData.date}</span>
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
