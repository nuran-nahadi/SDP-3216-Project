'use client';

import { format } from 'date-fns';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AvatarUpload, ProfileForm } from '@/components/features/profile';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { useProfile } from '@/lib/hooks/use-profile';

export default function ProfilePage() {
  const { profile, loading, error } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <EmptyState
          title="Failed to load profile"
          description={error?.message || 'Unable to fetch your profile information'}
          action={{
            label: 'Try Again',
            onClick: () => window.location.reload(),
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Separator />

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Overview</CardTitle>
              <CardDescription>Your account status and information</CardDescription>
            </div>
            <Badge
              variant={profile.is_verified ? 'default' : 'secondary'}
              className="flex items-center gap-1"
            >
              {profile.is_verified ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Not Verified
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Created</p>
              <p className="text-sm mt-1">
                {format(new Date(profile.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm mt-1">
                {format(new Date(profile.updated_at), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Upload Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
        <AvatarUpload user={profile} />
      </div>

      {/* Profile Form Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <ProfileForm user={profile} />
      </div>
    </div>
  );
}
