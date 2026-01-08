import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Phone } from 'lucide-react';
import { CampaignData } from './types';
import { SMSSendingAccount } from '@/lib/sms-api';

interface AccountStepProps {
    campaignData: CampaignData;
    updateCampaignData: (updates: Partial<CampaignData>) => void;
    sendingAccounts: SMSSendingAccount[];
    isSenderActuallyLocked: boolean;
}

export const AccountStep = ({ campaignData, updateCampaignData, sendingAccounts, isSenderActuallyLocked }: AccountStepProps) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAccounts = sendingAccounts.filter((account: SMSSendingAccount) =>
        account.phone_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Select Number
                </CardTitle>
                <CardDescription>
                    Choose the phone number to send SMS from
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="sender-id">Sender Account</Label>
                    {isSenderActuallyLocked ? (
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span className="font-medium">
                                    {sendingAccounts.find((acc: SMSSendingAccount) => acc.id === campaignData?.sender_id)?.phone_number || 'Unknown Number'}
                                </span>
                                {sendingAccounts.find((acc: SMSSendingAccount) => acc.id === campaignData?.sender_id)?.name &&
                                    <Badge variant="outline">
                                        {sendingAccounts.find((acc: SMSSendingAccount) => acc.id === campaignData?.sender_id)?.name}
                                    </Badge>
                                }
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                Locked
                            </Badge>
                        </div>
                    ) : (
                        <Select
                            value={campaignData?.sender_id || ''}
                            onValueChange={(value) => {
                                updateCampaignData({ sender_id: value });
                                // Don't lock here - only lock when campaign is launched
                            }}
                        >
                            <SelectTrigger id="sender-id">
                                <SelectValue placeholder="Select a sending account" />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="p-2">
                                    <Input
                                        placeholder="Search accounts..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="mb-2"
                                    />
                                </div>
                                {filteredAccounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            <span>{account.phone_number}</span>
                                            {account.name && <Badge variant="outline">{account.name}</Badge>}
                                            <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                                                {account.status}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                                {filteredAccounts.length === 0 && (
                                    <div className="p-4 text-center text-muted-foreground text-sm">
                                        No accounts found matching your search
                                    </div>
                                )}
                                {sendingAccounts.filter((acc: SMSSendingAccount) => acc.type === 'signalwire').length === 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
                                        <p className="text-xs text-yellow-800">
                                            <strong>Note:</strong> No SignalWire accounts found. Please connect your SignalWire account in
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 h-auto text-yellow-800 underline"
                                                onClick={() => navigate('/settings')}
                                            >
                                                Settings → SMS
                                            </Button>
                                        </p>
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    )}
                    {isSenderActuallyLocked && (
                        <p className="text-xs text-muted-foreground">
                            Phone number is locked once selected. To change it, you'll need to create a new campaign.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
