import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

const DebugGroups: React.FC = () => {
  const [groups, setGroups] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setApiUrl(import.meta.env.VITE_API_URL || 'Not set');
        
        const gs = await api.getGroups();
        setGroups(gs);
      } catch (err: unknown) {
        console.error('Error loading groups:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Debug Groups</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">API URL:</h2>
        <p className="text-sm text-gray-600">{apiUrl}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Loading Status:</h2>
        <p>{loading ? 'Loading...' : 'Loaded'}</p>
      </div>

      {error && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-red-600">Error:</h2>
          <p className="text-red-500">{error}</p>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Groups ({groups.length}):</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(groups, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DebugGroups;
