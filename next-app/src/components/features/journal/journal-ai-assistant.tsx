'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { parseJournalText } from '@/lib/api/journal';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { JournalForm } from './journal-form';
import { JournalMood } from '@/lib/types/journal';

interface ParsedJournalData {
  title?: string;
  content?: string;
  mood?: JournalMood;
  weather?: string;
  location?: string;
  sentiment?: string;
  keywords?: string[];
}

export function JournalAIAssistant() {
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [parsedData, setParsedData] = useState<ParsedJournalData | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleParse = async () => {
    if (!textInput.trim()) {
      toast.error('Please enter some text');
      return;
    }

    try {
      setLoading(true);
      const response = await parseJournalText(textInput);
      const parsed = response.data;
      
      setParsedData({
        title: parsed.title,
        content: parsed.content || textInput,
        mood: parsed.mood,
        weather: parsed.weather,
        location: parsed.location,
        sentiment: parsed.sentiment,
        keywords: parsed.keywords,
      });
      toast.success('Text parsed successfully');
    } catch (error) {
      console.error('Error parsing text:', error);
      toast.error('Failed to parse text');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAndEdit = () => {
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setParsedData(null);
    setTextInput('');
    toast.success('Journal entry saved successfully');
  };

  if (showForm && parsedData) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Review and Edit Entry</h3>
          {parsedData.sentiment && (
            <p className="text-sm text-muted-foreground">
              Detected Sentiment: {parsedData.sentiment}
            </p>
          )}
        </div>
        <JournalForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
          initialData={{
            title: parsedData.title || '',
            content: parsedData.content || '',
            mood: parsedData.mood,
            weather: parsedData.weather || '',
            location: parsedData.location || '',
          }}
        />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Journal Assistant</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Write naturally and let AI help structure your journal entry
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Textarea
            placeholder="e.g., Had a great day today! Went for a walk in the park, the weather was sunny and warm. Feeling grateful for the beautiful day..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="min-h-[150px] resize-none"
          />
        </div>

        <Button onClick={handleParse} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze with AI
            </>
          )}
        </Button>

        {parsedData && !showForm && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">AI Analysis</h4>
                {parsedData.sentiment && (
                  <Badge variant="secondary">{parsedData.sentiment}</Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {parsedData.title && (
                  <div>
                    <span className="text-muted-foreground">Suggested Title:</span>{' '}
                    <span className="font-medium">{parsedData.title}</span>
                  </div>
                )}
                {parsedData.mood && (
                  <div>
                    <span className="text-muted-foreground">Detected Mood:</span>{' '}
                    <span className="font-medium capitalize">{parsedData.mood.replace('_', ' ')}</span>
                  </div>
                )}
                {parsedData.weather && (
                  <div>
                    <span className="text-muted-foreground">Weather:</span>{' '}
                    <span className="font-medium">{parsedData.weather}</span>
                  </div>
                )}
                {parsedData.location && (
                  <div>
                    <span className="text-muted-foreground">Location:</span>{' '}
                    <span className="font-medium">{parsedData.location}</span>
                  </div>
                )}
                {parsedData.keywords && parsedData.keywords.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Keywords:</span>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {parsedData.keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleReviewAndEdit} className="w-full">
              Review and Save Entry
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
