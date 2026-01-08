import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Xordon</h1>
              {tenant && (
                <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {tenant.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.firstName} {user.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Your Dashboard
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Choose an option below to get started with your email campaigns.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Email Campaigns */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Campaigns</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Create and manage email campaigns with sequences, templates, and analytics.
                </p>
                <button
                  onClick={() => navigate('/reach/outbound/email/campaigns')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Email Campaigns
                </button>
              </div>
            </div>

            {/* SMS Campaigns */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">SMS Campaigns</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Send SMS campaigns with templates, sequences, and delivery tracking.
                </p>
                <button
                  onClick={() => navigate('/reach/outbound/sms/campaigns')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Go to SMS Campaigns
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Configure your account, sending accounts, templates, and preferences.
                </p>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Go to Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
