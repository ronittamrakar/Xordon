import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Clock, Mail, FileTextIcon } from 'lucide-react';
import RichTextEditor from '@/components/editors/RichTextEditor';
import { type FollowUpEmail } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
}

interface FollowUpEmailBuilderProps {
  initialEmails?: Omit<FollowUpEmail, 'id' | 'campaignId' | 'userId' | 'createdAt' | 'updatedAt'>[];
  onEmailsChange: (emails: Omit<FollowUpEmail, 'id' | 'campaignId' | 'userId' | 'createdAt' | 'updatedAt'>[]) => void;
  templates?: Template[];
  className?: string;
  maxFollowUps?: number;
}

const FollowUpEmailBuilder = ({ 
  initialEmails, 
  onEmailsChange, 
  templates = [], 
  className,
  maxFollowUps = 5 
}: FollowUpEmailBuilderProps) => {
  const [emails, setEmails] = useState<Omit<FollowUpEmail, 'id' | 'campaignId' | 'userId' | 'createdAt' | 'updatedAt'>[]>(
    initialEmails || []
  );

  const addFollowUp = () => {
    if (emails.length >= maxFollowUps) return;
    
    const newEmail = {
      subject: '',
      content: '',
      delayDays: emails.length === 0 ? 3 : 7, // Default: 3 days for first follow-up, 7 for others
      emailOrder: emails.length + 1
    };
    const newEmails = [...emails, newEmail];
    setEmails(newEmails);
    onEmailsChange(newEmails);
  };

  const removeFollowUp = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index);
    // Reorder the remaining emails
    const reorderedEmails = newEmails.map((email, i) => ({ ...email, emailOrder: i + 1 }));
    setEmails(reorderedEmails);
    onEmailsChange(reorderedEmails);
  };

  const updateEmail = useCallback((index: number, field: keyof Omit<FollowUpEmail, 'id' | 'campaignId' | 'userId' | 'createdAt' | 'updatedAt'>, value: string | number) => {
    setEmails(prevEmails => {
      const newEmails = [...prevEmails];
      const currentEmail = newEmails[index];
      
      // Only update if the value actually changed
      if (currentEmail[field] !== value) {
        newEmails[index] = { ...currentEmail, [field]: value };
        onEmailsChange(newEmails);
        return newEmails;
      }
      
      return prevEmails; // Return the same reference if no change
    });
  }, [onEmailsChange]);

  const applyTemplate = (index: number, templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const newEmails = [...emails];
      newEmails[index] = { 
        ...newEmails[index], 
        subject: template.subject,
        content: template.htmlContent 
      };
      setEmails(newEmails);
      onEmailsChange(newEmails);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Follow-up Emails
            <span className="text-sm font-normal text-muted-foreground">
              ({emails.length}/{maxFollowUps} follow-ups)
            </span>
          </CardTitle>
          {emails.length < maxFollowUps && (
            <Button onClick={addFollowUp} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Follow-up
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {emails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No follow-up emails added yet</p>
              <p className="text-sm mb-4">Add follow-up emails to increase your response rates</p>
              <Button onClick={addFollowUp} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add First Follow-up
              </Button>
            </div>
          ) : (
            emails.map((email, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-hunter-orange text-white rounded-full text-sm font-medium">
                      {email.emailOrder}
                    </div>
                    <span className="font-medium">Follow-up {email.emailOrder}</span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {email.delayDays} day{email.delayDays !== 1 ? 's' : ''} after {index === 0 ? 'initial email' : 'previous follow-up'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFollowUp(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Delay (days after {index === 0 ? 'initial email' : 'previous follow-up'})</Label>
                    <Select 
                      value={email.delayDays.toString()} 
                      onValueChange={(value) => updateEmail(index, 'delayDays', parseInt(value))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day} day{day !== 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Subject Line</Label>
                    <Input
                      placeholder="Re: {{subject}} (or enter new subject)"
                      value={email.subject}
                      onChange={(e) => updateEmail(index, 'subject', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to reply in the same thread with "Re: [original subject]"
                    </p>
                  </div>
                  
                  {templates.length > 0 && (
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Use Template (Optional)</Label>
                      <Select onValueChange={(templateId) => applyTemplate(index, templateId)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <FileTextIcon className="h-4 w-4" />
                                {template.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Email Content</Label>
                    <RichTextEditor
                      value={email.content}
                      onChange={(value) => updateEmail(index, 'content', value)}
                      placeholder="<p>Hi {{firstName}},</p><p>Just following up on my previous email...</p><p><a href='{{unsubscribeUrl}}'>Unsubscribe</a></p>"
                      showVariables={true}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
          
          {emails.length > 0 && emails.length < maxFollowUps && (
            <div className="text-center pt-4">
              <Button onClick={addFollowUp} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Follow-up ({emails.length}/{maxFollowUps})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FollowUpEmailBuilder;

