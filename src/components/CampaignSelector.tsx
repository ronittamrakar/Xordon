import { Mail, MessageSquare, Phone, BarChart3 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CampaignOption, CampaignListResponse } from '@/lib/api';

// Re-export types for convenience
export type { CampaignOption, CampaignListResponse };

interface CampaignSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  campaigns: CampaignListResponse;
  loading?: boolean;
}

const channelIcons = {
  email: Mail,
  sms: MessageSquare,
  call: Phone,
};

const channelLabels = {
  email: 'Email Campaigns',
  sms: 'SMS Campaigns',
  call: 'Call Campaigns',
};

export function CampaignSelector({
  value,
  onChange,
  campaigns,
  loading = false,
}: CampaignSelectorProps) {
  const handleValueChange = (newValue: string) => {
    onChange(newValue === 'all' ? null : newValue);
  };

  const renderChannelGroup = (channel: 'email' | 'sms' | 'call') => {
    const Icon = channelIcons[channel];
    const channelCampaigns = campaigns[channel] || [];

    return (
      <SelectGroup key={channel}>
        <SelectLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {channelLabels[channel]}
        </SelectLabel>
        {channelCampaigns.length > 0 ? (
          channelCampaigns.map((campaign) => (
            <SelectItem
              key={`${channel}:${campaign.id}`}
              value={`${channel}:${campaign.id}`}
              className="pl-6"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate max-w-[180px]">{campaign.name}</span>
              </span>
            </SelectItem>
          ))
        ) : (
          <div className="pl-6 py-1.5 text-xs text-muted-foreground italic">
            No campaigns
          </div>
        )}
      </SelectGroup>
    );
  };

  const getDisplayValue = () => {
    if (!value || value === 'all') {
      return 'All Campaigns';
    }

    const [channel, id] = value.split(':') as ['email' | 'sms' | 'call', string];
    const campaign = campaigns[channel]?.find((c) => c.id === id);
    
    if (campaign) {
      const Icon = channelIcons[channel];
      return (
        <span className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" />
          <span className="truncate">{campaign.name}</span>
        </span>
      );
    }

    return 'All Campaigns';
  };

  return (
    <Select
      value={value || 'all'}
      onValueChange={handleValueChange}
      disabled={loading}
    >
      <SelectTrigger className="w-[220px]">
        <BarChart3 className="h-4 w-4 mr-2 flex-shrink-0" />
        <SelectValue placeholder="Select campaign">
          {getDisplayValue()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" />
            All Campaigns
          </span>
        </SelectItem>
        {renderChannelGroup('email')}
        {renderChannelGroup('sms')}
        {renderChannelGroup('call')}
      </SelectContent>
    </Select>
  );
}

export default CampaignSelector;
