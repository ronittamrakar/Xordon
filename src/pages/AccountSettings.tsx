import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type User } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

import { useToast } from '@/hooks/use-toast';

const AccountSettings = () => {
  const navigate = useNavigate();

  // Set up default user if none exists (for development)
  useEffect(() => {
    const existingUser = api.getCurrentUser();
    if (!existingUser) {
      const defaultUser = {
        id: 'dev-user-1',
        email: 'developer@xordon.com',
        name: 'Developer User'
      };
      localStorage.setItem('currentUser', JSON.stringify(defaultUser));
    }
  }, []);

  const user = api.getCurrentUser();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [settings, setSettings] = useState({
    notifyCampaignUpdates: true,
    notifyDailySummary: false,
  });

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      await api.updateSettings({ [key]: value });
      toast({
        title: 'Settings updated',
        description: 'Your preferences have been saved successfully.',
      });
    } catch (err) {
      console.error('Failed to update setting', err);
      setSettings(settings);
      toast({
        title: 'Update failed',
        description: 'Failed to save your preferences. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const current = api.getCurrentUser();
      if (!current) return;

      const updated = { ...current, name, email };
      localStorage.setItem('currentUser', JSON.stringify(updated));

      toast({
        title: 'Profile updated',
        description: 'Your profile information has been saved successfully.',
      });
    } catch (err) {
      console.error('Failed to update profile', err);
      toast({
        title: 'Update failed',
        description: 'Failed to save your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and notification preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleSaveProfile}>Save Profile</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose what notifications you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Campaign Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about campaign status changes
                </p>
              </div>
              <Switch checked={settings.notifyCampaignUpdates} onCheckedChange={v => updateSetting('notifyCampaignUpdates', v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Daily Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Receive daily email with campaign statistics
                </p>
              </div>
              <Switch checked={settings.notifyDailySummary} onCheckedChange={v => updateSetting('notifyDailySummary', v)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSettings;
