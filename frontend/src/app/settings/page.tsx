'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadKeys();
    }
  }, [user]);

  async function loadKeys() {
    try {
      const data = await api.getAPIKeys();
      setKeys(data);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    if (!newKeyName.trim()) return;

    try {
      const key = await api.createAPIKey(newKeyName);
      setNewKey(key);
      setShowNewKey(true);
      setNewKeyName('');
      await loadKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key');
    }
  }

  async function deleteKey(id: string) {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      await api.deleteAPIKey(id);
      await loadKeys();
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('Failed to delete API key');
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Info */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Account</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Email:</span>{' '}
              <span className="font-medium">{user.email}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Plan:</span>{' '}
              <span className="font-medium capitalize">{user.plan}</span>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">API Keys</h2>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Use API keys to track API calls from your applications. Keep them secret!
            </p>

            {showNewKey && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="font-semibold mb-2">🎉 New API Key Created!</div>
                <div className="text-sm mb-2">Copy this key now - you won't see it again:</div>
                <div className="bg-white p-3 rounded border border-green-300 font-mono text-sm break-all">
                  {newKey}
                </div>
                <button
                  onClick={() => setShowNewKey(false)}
                  className="btn btn-secondary mt-3"
                >
                  Done
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g., Production)"
                className="input flex-1"
              />
              <button
                onClick={createKey}
                className="btn btn-primary"
              >
                Create Key
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {keys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No API keys yet. Create one to get started!
              </div>
            ) : (
              keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{key.name}</div>
                    <div className="text-sm text-gray-500">
                      Created: {new Date(key.created_at).toLocaleDateString()}
                      {key.last_used_at && (
                        <> • Last used: {new Date(key.last_used_at).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteKey(key.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Integration Code Example */}
        <div className="card mt-8">
          <h2 className="text-xl font-bold mb-4">📦 Integration</h2>
          <p className="text-sm text-gray-600 mb-4">
            Install the SDK and start tracking:
          </p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`npm install @apimetrics/sdk

import { APImetricsClient, OpenAIWrapper } from '@apimetrics/sdk';

const tracker = new APImetricsClient({
  apiKey: 'your-api-key-here'
});

const openai = new OpenAIWrapper(
  { apiKey: process.env.OPENAI_API_KEY },
  tracker
);

// Use normally - costs tracked automatically!
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});`}
          </pre>
        </div>
      </div>
    </div>
  );
}
