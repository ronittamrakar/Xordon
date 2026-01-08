import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Target, Smartphone, MessageSquare, Users, Settings, Eye, Send } from 'lucide-react';

const SMSCampaignWizardSimple: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    sender_id: '',
    message: '',
  });

  const steps = [
    { id: 1, title: 'Info', icon: Target, description: 'Campaign details' },
    { id: 2, title: 'Account', icon: Smartphone, description: 'Choose sending number' },
    { id: 3, title: 'Content', icon: MessageSquare, description: 'Create SMS message' },
    { id: 4, title: 'Audience', icon: Users, description: 'Select recipients' },
    { id: 5, title: 'Settings', icon: Settings, description: 'Configure schedule' },
    { id: 6, title: 'Review', icon: Eye, description: 'Review campaign' },
    { id: 7, title: 'Launch', icon: Send, description: 'Launch campaign' },
  ];

  const updateCampaignData = (updates: Partial<typeof campaignData>) => {
    setCampaignData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Information</CardTitle>
              <CardDescription>Set up your campaign name and description</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignData.name}
                    onChange={(e) => updateCampaignData({ name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter campaign name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={campaignData.description}
                    onChange={(e) => updateCampaignData({ description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter campaign description..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Select Number</CardTitle>
              <CardDescription>Choose the phone number to send SMS from</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Account selection step - simplified for testing</p>
            </CardContent>
          </Card>
        );
      default:
        return <div>Step {currentStep} content</div>;
    }
  };

  return (
    <>
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-[18px] font-bold mb-2">
            {id ? 'Edit SMS Campaign' : 'Create SMS Campaign'}
          </h1>
          <p className="text-muted-foreground">
            Simplified version for testing
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isActive
                      ? 'bg-hunter-orange text-white'
                      : isCompleted
                        ? 'bg-hunter-orange text-white'
                        : 'bg-gray-200 text-gray-600'
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${isActive ? 'text-hunter-orange' : isCompleted ? 'text-hunter-orange' : 'text-gray-500'
                      }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/reach/outbound/sms/campaigns')}
            >
              Cancel
            </Button>
            {currentStep === steps.length ? (
              <Button onClick={handleNext}>
                Review Complete
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SMSCampaignWizardSimple;
