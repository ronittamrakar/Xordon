import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Key, Eye, EyeOff, LogOut, RefreshCw, Smartphone, Shield, Download, Trash2, AlertTriangle } from 'lucide-react';

interface Session {
    id: string;
    device: string;
    location: string;
    ipAddress: string;
    lastActivity: string;
    current: boolean;
    active: boolean;
}

const mockSessions: Session[] = [
    {
        id: 'session-1',
        device: 'iPhone 15 Pro',
        location: 'New York, USA',
        ipAddress: '192.168.1.100',
        lastActivity: '2024-01-15 14:30:00',
        current: true,
        active: true
    },
    {
        id: 'session-2',
        device: 'MacBook Pro',
        location: 'New York, USA',
        ipAddress: '192.168.1.101',
        lastActivity: '2024-01-15 12:15:00',
        current: false,
        active: true
    },
    {
        id: 'session-3',
        device: 'iPad Air',
        location: 'London, UK',
        ipAddress: '10.0.0.50',
        lastActivity: '2024-01-14 18:45:00',
        current: false,
        active: false
    }
];

const SecuritySettings = () => {
    const { toast } = useToast();
    const [sessions, setSessions] = useState<Session[]>(mockSessions);
    const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [securitySettings, setSecuritySettings] = useState({
        twoFactorEnabled: true,
        passwordChanged: '2024-01-10 10:15:00',
    });

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "Please make sure both password fields match.",
                variant: "destructive",
            });
            return;
        }

        if (newPassword.length < 8) {
            toast({
                title: "Password too weak",
                description: "Password must be at least 8 characters long.",
                variant: "destructive",
            });
            return;
        }

        setIsChangingPassword(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSecuritySettings(prev => ({
                ...prev,
                passwordChanged: new Date().toLocaleString()
            }));
            setNewPassword('');
            setConfirmPassword('');
            toast({
                title: "Password Changed",
                description: "Your password has been updated successfully.",
            });
        } catch (error) {
            toast({
                title: "Change Failed",
                description: "Failed to update password. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleLogoutAllDevices = async () => {
        setIsLoggingOutAll(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSessions(prev => prev.map(session => ({
                ...session,
                active: session.current ? true : false
            })));
            toast({
                title: "Logged Out",
                description: "You have been logged out of all other devices.",
            });
        } catch (error) {
            toast({
                title: "Logout Failed",
                description: "Failed to logout from other devices. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoggingOutAll(false);
        }
    };

    const handleToggle2FA = async (enabled: boolean) => {
        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: enabled }));
        if (enabled) {
            toast({
                title: "2FA Enabled",
                description: "Two-factor authentication has been enabled for your account.",
            });
        } else {
            toast({
                title: "2FA Disabled",
                description: "Two-factor authentication has been disabled for your account.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Access & Security
                    </CardTitle>
                    <CardDescription>
                        Manage your account security and active sessions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Network & Access */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <h4 className="font-medium text-sm">Network & Access Control</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Whitelisted IP Addresses</Label>
                                <Input placeholder="e.g. 192.168.1.1, 10.0.0.0/24" />
                                <p className="text-[10px] text-muted-foreground">Restrict access to specific IP addresses or ranges. Leave empty for no restriction.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Session Timeout</Label>
                                <Select defaultValue="24h">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1h">1 Hour</SelectItem>
                                        <SelectItem value="4h">4 Hours</SelectItem>
                                        <SelectItem value="12h">12 Hours</SelectItem>
                                        <SelectItem value="24h">24 Hours</SelectItem>
                                        <SelectItem value="7d">7 Days</SelectItem>
                                        <SelectItem value="30d">30 Days</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-muted-foreground">Automatically log out users after a period of inactivity.</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Two-Factor Authentication */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="font-medium">Two-Factor Authentication</Label>
                            <p className="text-sm text-muted-foreground">
                                Add an extra layer of security to your account.
                            </p>
                        </div>
                        <Switch
                            checked={securitySettings.twoFactorEnabled}
                            onCheckedChange={handleToggle2FA}
                        />
                    </div>

                    {/* Password Change */}
                    <Card className="border-muted bg-muted/40">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Change Password</CardTitle>
                            <CardDescription>
                                Last changed: {securitySettings.passwordChanged}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <Button
                                onClick={handlePasswordChange}
                                disabled={isChangingPassword || !newPassword || !confirmPassword}
                                className="w-full sm:w-auto"
                            >
                                {isChangingPassword ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Changing Password...
                                    </>
                                ) : (
                                    <>
                                        <Key className="h-4 w-4 mr-2" />
                                        Change Password
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Privacy Controls */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <h4 className="font-medium text-sm">Privacy & Visibility</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="font-medium">Profile Visibility</Label>
                                    <p className="text-xs text-muted-foreground">Who can see your profile when you are part of an organization.</p>
                                </div>
                                <Select defaultValue="contacts">
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="contacts">Contacts Only</SelectItem>
                                        <SelectItem value="private">Private</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Data & Compliance */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <h4 className="font-medium text-sm">Data Privacy & Compliance</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Data Retention Policy</Label>
                                <Select defaultValue="indefinite">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="indefinite">Indefinite (Forever)</SelectItem>
                                        <SelectItem value="1y">1 Year</SelectItem>
                                        <SelectItem value="2y">2 Years</SelectItem>
                                        <SelectItem value="3y">3 Years</SelectItem>
                                        <SelectItem value="5y">5 Years</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Automatically delete logs and history after this period.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Request Personal Data</Label>
                                <Button variant="outline" className="w-full justify-start gap-2 h-10">
                                    <Download className="h-4 w-4" />
                                    Export My Data (.CSV)
                                </Button>
                                <p className="text-xs text-muted-foreground">Download a copy of all your interactions and settings.</p>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="space-y-4 pt-6 border-t border-destructive/20 mt-4 rounded-xl p-4 bg-destructive/5 border-dashed border">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <h4 className="font-bold text-sm">Danger Zone</h4>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold">Delete Account</p>
                                <p className="text-xs text-muted-foreground">Permanently remove your account and all associated data. This action is irreversible.</p>
                            </div>
                            <Button variant="destructive" className="sm:w-auto h-9">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Account
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Active Sessions
                    </CardTitle>
                    <CardDescription>
                        View and manage your active sessions across all devices.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Device</TableHead>
                                <TableHead className="hidden md:table-cell">Location</TableHead>
                                <TableHead className="hidden md:table-cell">IP Address</TableHead>
                                <TableHead className="hidden sm:table-cell">Last Activity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell className="font-medium">
                                        {session.device}
                                        <div className="md:hidden text-xs text-muted-foreground mt-1">
                                            {session.location}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{session.location}</TableCell>
                                    <TableCell className="hidden md:table-cell"><code className="bg-muted px-1 py-0.5 rounded text-xs">{session.ipAddress}</code></TableCell>
                                    <TableCell className="hidden sm:table-cell">{session.lastActivity}</TableCell>
                                    <TableCell>
                                        <Badge variant={session.active ? "default" : "secondary"}>
                                            {session.current ? "Current" : session.active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSessions(prev => prev.map(s =>
                                                    s.id === session.id ? { ...s, active: false } : s
                                                ));
                                                toast({
                                                    title: "Session Ended",
                                                    description: `Session on ${session.device} has been ended.`,
                                                });
                                            }}
                                            disabled={session.current || !session.active}
                                        >
                                            <LogOut className="h-4 w-4 mr-1" />
                                            End
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            {sessions.filter(s => s.active).length} active sessions
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    disabled={isLoggingOutAll}
                                >
                                    {isLoggingOutAll ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Logging Out...
                                        </>
                                    ) : (
                                        <>
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Logout All Devices
                                        </>
                                    )}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Logout All Devices</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will logout your account from all devices except the current one.
                                        You will need to login again on other devices.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleLogoutAllDevices}>
                                        Logout All
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SecuritySettings;
