'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Clock, Send, Eye, Loader2, CheckSquare, Calendar, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  getNotificationSettings, 
  updateNotificationSettings, 
  getEmailPreview, 
  sendTestEmail 
} from '@/lib/api/notifications';
import { NotificationSettings, DailySummary } from '@/lib/types/notification';

// Generate time options (every hour)
const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  const label = i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`;
  return { value: `${hour}:00`, label };
});

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: false,
    preferred_time: '08:00',
  });
  const [preview, setPreview] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await getNotificationSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    try {
      setSaving(true);
      const response = await updateNotificationSettings({ email_enabled: enabled });
      if (response.success && response.data) {
        setSettings(response.data);
        setMessage({ type: 'success', text: enabled ? 'Notifications enabled!' : 'Notifications disabled' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleTimeChange = async (time: string) => {
    try {
      setSaving(true);
      const response = await updateNotificationSettings({ preferred_time: time });
      if (response.success && response.data) {
        setSettings(response.data);
        setMessage({ type: 'success', text: 'Preferred time updated!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update time' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleLoadPreview = async () => {
    try {
      setLoadingPreview(true);
      const response = await getEmailPreview();
      if (response.success && response.data) {
        setPreview(response.data);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load preview' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSendTest = async () => {
    try {
      setSendingTest(true);
      const response = await sendTestEmail();
      if (response.success) {
        setMessage({ type: 'success', text: response.message || 'Test email sent!' });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to send test email' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test email' });
    } finally {
      setSendingTest(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-primary/10">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Manage your daily email reminders</p>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-600 border border-green-500/20'
              : 'bg-red-500/10 text-red-600 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Receive a daily summary of your tasks, events, and expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-toggle" className="text-base font-medium">
                Daily Email Summary
              </Label>
              <p className="text-sm text-muted-foreground">
                Get a daily overview sent to your email
              </p>
            </div>
            <Switch
              id="email-toggle"
              checked={settings.email_enabled}
              onCheckedChange={handleToggle}
              disabled={saving}
            />
          </div>

          <Separator />

          {/* Time Picker */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Preferred Time
              </Label>
              <p className="text-sm text-muted-foreground">
                When should we send your daily summary?
              </p>
            </div>
            <Select
              value={settings.preferred_time}
              onValueChange={handleTimeChange}
              disabled={saving || !settings.email_enabled}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleLoadPreview}
              disabled={loadingPreview}
            >
              {loadingPreview ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Preview Email
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={sendingTest}
            >
              {sendingTest ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Test Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
            <CardDescription>
              This is what your daily summary email will contain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Tasks */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tasks
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-2xl font-bold">{preview.tasks_pending}</span>
                    <p className="text-sm text-muted-foreground">pending</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-amber-500">{preview.tasks_due_today}</span>
                    <p className="text-sm text-muted-foreground">due today</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-red-500">{preview.tasks_overdue}</span>
                    <p className="text-sm text-muted-foreground">overdue</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-green-500">{preview.tasks_completed_today}</span>
                    <p className="text-sm text-muted-foreground">completed</p>
                  </div>
                </div>
              </div>

              {/* Events */}
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Today's Events
                  <Badge variant="secondary">{preview.events_today}</Badge>
                </h4>
                {preview.events_upcoming.length > 0 ? (
                  <ul className="space-y-2">
                    {preview.events_upcoming.map((event, i) => (
                      <li key={i} className="text-sm">
                        <span className="text-muted-foreground">{event.start_time}</span>
                        {' - '}
                        {event.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No events scheduled</p>
                )}
              </div>

              {/* Expenses */}
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Expenses
                </h4>
                <div className="space-y-1 text-sm">
                  <p>Today: <span className="font-medium">${preview.expenses_today.toFixed(2)}</span></p>
                  <p>This week: <span className="font-medium">${preview.expenses_this_week.toFixed(2)}</span></p>
                  {preview.top_expense_category && (
                    <p className="text-muted-foreground">Top category: {preview.top_expense_category}</p>
                  )}
                </div>
              </div>

              {/* Upcoming Week Section */}
              <div className="mt-6 pt-6 border-t-2 border-primary/20">
                <h3 className="text-lg font-semibold mb-4 text-primary">Next 7 Days</h3>
                
                {/* Upcoming Tasks */}
                <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10 mb-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Tasks Due
                  </h4>
                  <p className="text-3xl font-bold text-purple-600">{preview.tasks_due_next_week}</p>
                  <p className="text-sm text-muted-foreground">tasks due in the next week</p>
                </div>
                
                {/* Upcoming Events */}
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming Events
                    <Badge variant="secondary">{preview.events_next_week}</Badge>
                  </h4>
                  {preview.events_next_week_list.length > 0 ? (
                    <ul className="space-y-2">
                      {preview.events_next_week_list.map((event, i) => (
                        <li key={i} className="text-sm">
                          <span className="text-muted-foreground">{event.start_time}</span>
                          {' - '}
                          {event.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No upcoming events</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
