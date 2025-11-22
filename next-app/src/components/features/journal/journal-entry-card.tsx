'use client';

import { JournalEntry, JournalMood } from '@/lib/types/journal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, MapPin, Cloud } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

const moodEmojis: Record<JournalMood, string> = {
  [JournalMood.VERY_HAPPY]: '😄',
  [JournalMood.HAPPY]: '😊',
  [JournalMood.NEUTRAL]: '😐',
  [JournalMood.SAD]: '😢',
  [JournalMood.VERY_SAD]: '😭',
  [JournalMood.ANGRY]: '😠',
  [JournalMood.EXCITED]: '🤩',
  [JournalMood.ANXIOUS]: '😰',
  [JournalMood.GRATEFUL]: '🙏',
};

export function JournalEntryCard({ entry, onEdit, onDelete }: JournalEntryCardProps) {
  return (
    <Card className="p-6 border-2 bg-gradient-to-br from-card to-teal-500/5 fade-in">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {entry.title && (
              <h3 className="text-xl font-bold mb-2 text-foreground">
                {entry.title}
              </h3>
            )}
            <p className="text-sm font-medium text-muted-foreground">
              {formatDate(entry.created_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(entry)}
              className="hover:bg-primary/10"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(entry.id)}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {entry.mood && (
            <Badge variant="secondary" className="bg-primary/15 text-primary font-semibold">
              {moodEmojis[entry.mood]} {entry.mood.replace('_', ' ')}
            </Badge>
          )}
          {entry.weather && (
            <Badge variant="outline" className="gap-1 border-teal-500/30 bg-teal-500/5">
              <Cloud className="h-3 w-3" />
              {entry.weather}
            </Badge>
          )}
          {entry.location && (
            <Badge variant="outline" className="gap-1 border-teal-500/30 bg-teal-500/5">
              <MapPin className="h-3 w-3" />
              {entry.location}
            </Badge>
          )}
        </div>

        <p className="text-sm leading-relaxed line-clamp-3">{entry.content}</p>

        {entry.summary && (
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wide">AI Summary</p>
            <p className="text-sm leading-relaxed">{entry.summary}</p>
          </div>
        )}

        {entry.keywords && entry.keywords.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {entry.keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="text-xs bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20">
                {keyword}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
