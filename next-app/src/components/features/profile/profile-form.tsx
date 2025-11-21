'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { updateProfile } from '@/lib/api/profile';
import { User, UserProfileUpdate } from '@/lib/types/user';
import { eventBus } from '@/lib/utils/event-bus';
import { PROFILE_UPDATED } from '@/lib/utils/event-types';

// Common timezones
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Europe/Rome', label: 'Rome' },
  { value: 'Europe/Madrid', label: 'Madrid' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'India' },
  { value: 'Asia/Shanghai', label: 'Beijing, Shanghai' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Seoul', label: 'Seoul' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Australia/Melbourne', label: 'Melbourne' },
  { value: 'Pacific/Auckland', label: 'Auckland' },
];

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username is too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  timezone: z.string().min(1, 'Timezone is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: User;
  onProfileUpdate?: (user: User) => void;
}

type EditableField = 'first_name' | 'last_name' | 'username' | 'timezone';

export function ProfileForm({ user, onProfileUpdate }: ProfileFormProps) {
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      timezone: user.timezone,
    },
  });

  const currentTimezone = watch('timezone');

  const startEditing = (field: EditableField) => {
    setEditingField(field);
  };

  const cancelEditing = () => {
    setEditingField(null);
    reset({
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      timezone: user.timezone,
    });
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!editingField) return;

    try {
      setSaving(true);

      // Only send the field that was edited
      const updateData: UserProfileUpdate = {
        [editingField]: data[editingField],
      };

      const response = await updateProfile(updateData);

      toast.success('Profile updated successfully');

      // Publish event
      eventBus.publish(PROFILE_UPDATED, response.data);

      // Call callback if provided
      if (onProfileUpdate) {
        onProfileUpdate(response.data);
      }

      setEditingField(null);
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (
    field: EditableField,
    label: string,
    value: string,
    type: 'text' | 'select' = 'text'
  ) => {
    const isEditing = editingField === field;
    const error = errors[field];

    return (
      <div className="space-y-2">
        <Label htmlFor={field}>{label}</Label>
        <div className="flex items-start gap-2">
          {isEditing ? (
            <>
              {type === 'text' ? (
                <div className="flex-1">
                  <Input
                    id={field}
                    {...register(field)}
                    disabled={saving}
                    className={error ? 'border-destructive' : ''}
                  />
                  {error && (
                    <p className="text-sm text-destructive mt-1">{error.message}</p>
                  )}
                </div>
              ) : (
                <div className="flex-1">
                  <Select
                    value={currentTimezone}
                    onValueChange={(value) => setValue('timezone', value)}
                    disabled={saving}
                  >
                    <SelectTrigger className={error ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {error && (
                    <p className="text-sm text-destructive mt-1">{error.message}</p>
                  )}
                </div>
              )}
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="default"
                  onClick={handleSubmit(onSubmit)}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1">
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {type === 'select'
                    ? TIMEZONES.find((tz) => tz.value === value)?.label || value
                    : value}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing(field)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal information. Click the edit icon to modify a field.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderField('first_name', 'First Name', user.first_name)}
        {renderField('last_name', 'Last Name', user.last_name)}
        {renderField('username', 'Username', user.username)}

        {/* Email - Read-only */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
            <div className="w-10" /> {/* Spacer to align with editable fields */}
          </div>
          <p className="text-xs text-muted-foreground">
            Email cannot be changed
          </p>
        </div>

        {renderField('timezone', 'Timezone', user.timezone, 'select')}
      </CardContent>
    </Card>
  );
}
