'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { uploadAvatar, removeAvatar, getAvatarUrl, getUserInitials } from '@/lib/api/profile';
import { User } from '@/lib/types/user';
import { eventBus } from '@/lib/utils/event-bus';
import { AVATAR_UPDATED } from '@/lib/utils/event-types';

interface AvatarUploadProps {
  user: User;
  onAvatarUpdate?: (user: User) => void;
}

export function AvatarUpload({ user, onAvatarUpdate }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = getAvatarUrl(user);
  const initials = getUserInitials(user);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const response = await uploadAvatar(selectedFile);
      
      toast.success('Profile picture updated successfully');
      
      // Clear preview and selected file
      setPreview(null);
      setSelectedFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Publish event
      eventBus.publish(AVATAR_UPDATED, response.data);
      
      // Call callback if provided
      if (onAvatarUpdate) {
        onAvatarUpdate(response.data);
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!avatarUrl) return;

    try {
      setUploading(true);
      await removeAvatar();
      
      toast.success('Profile picture removed');
      
      // Publish event with updated user (no avatar)
      const updatedUser = { ...user, profile_picture_url: null };
      eventBus.publish(AVATAR_UPDATED, updatedUser);
      
      // Call callback if provided
      if (onAvatarUpdate) {
        onAvatarUpdate(updatedUser);
      }
    } catch (error: any) {
      console.error('Avatar remove error:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to remove profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="h-32 w-32">
            <AvatarImage src={preview || avatarUrl || undefined} alt={user.username} />
            <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
          </Avatar>
          
          {!preview && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 rounded-full shadow-lg"
              onClick={handleAvatarClick}
              disabled={uploading}
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {preview && (
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={uploading}
              size="sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={uploading}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        )}

        {!preview && avatarUrl && (
          <Button
            onClick={handleRemove}
            disabled={uploading}
            variant="destructive"
            size="sm"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Remove Picture
              </>
            )}
          </Button>
        )}

        <p className="text-sm text-muted-foreground text-center">
          Click the camera icon to upload a new profile picture
          <br />
          <span className="text-xs">Maximum file size: 5MB</span>
        </p>
      </div>
    </Card>
  );
}
