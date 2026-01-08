import React from 'react';
import PhoneNumberProvisioning from '@/components/PhoneNumberProvisioning';

export default function PhoneProvisioningPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Number Provisioning</h1>
                <p className="text-gray-600">Register and verify your phone numbers for A2P 10DLC compliance</p>
            </div>
            <PhoneNumberProvisioning />
        </div>
    );
}
