'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';

interface Alert {
  id: string;
  name: string;
  type: 'daily_budget' | 'hourly_spike' | 'error_rate';
  threshold: number;
  channels: Array<{
    type: 'email' | 'slack';
    value?: string;
    webhook?: string;
  }>;
  enabled: boolean;
  last_triggered_at?: string;
  created_at: string;
}

export default function Alerts() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'daily_budget' | 'hourly_spike' | 'error_rate'>('daily_budget');
  const [threshold, setThreshold] = useState('');
  const [channelType, setChannelType] = useState<'email' | 'slack'>('email');
  const [channelValue, setChannelValue] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user]);

  async function loadAlerts() {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createAlert() {
    try {
      await api.createAlert({
        name,
        type,
        threshold: parseFloat(threshold),
        channels: [
          {
            type: channelType,
            ...(channelType === 'email' ? { value: channelValue } : { webhook: channelValue }),
          },
        ],
      });

      // Reset form
      setName('');
      setThreshold('');
      setChannelValue('');
      setShowCreate(false);

      await loadAlerts();
    } catch (error) {
      console.error('Failed to create alert:', error);
      alert('Failed to create alert');
    }
  }

  async function toggleAlert(id: string, enabled: boolean) {
    try {
      await api.updateAlert(id, { enabled: !enabled });
      await loadAlerts();
    } catch (error) {
      console.error('Failed to toggle alert:', error);
    }
  }

  async function deleteAlert(id: string) {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      await api.deleteAlert(id);
      await loadAlerts();
    } catch (error) {
      console.error('Failed to delete alert:', error);
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

  const alertTypeLabels = {
    daily_budget: 'Daily Budget',
    hourly_spike: 'Hourly Spike',
    error_rate: 'Error Rate',
  };

  const alertTypeDescriptions = {
    daily_budget: 'Trigger when daily spend exceeds threshold ($)',
    hourly_spike: 'Trigger when hourly spend exceeds threshold ($)',
    error_rate: 'Trigger when error rate exceeds threshold (%)',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="btn btn-primary"
            >
              {showCreate ? 'Cancel' : '+ Create Alert'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Form */}
        {showCreate && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold mb-4">Create New Alert</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Daily Budget Alert"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="input"
                >
                  <option value="daily_budget">Daily Budget</option>
                  <option value="hourly_spike">Hourly Spike</option>
                  <option value="error_rate">Error Rate</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {alertTypeDescriptions[type]}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Threshold {type === 'error_rate' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder={type === 'error_rate' ? '5' : '10.00'}
                  step={type === 'error_rate' ? '1' : '0.01'}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Channel
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={channelType}
                    onChange={(e) => setChannelType(e.target.value as any)}
                    className="input w-32"
                  >
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                  </select>
                  <input
                    type="text"
                    value={channelValue}
                    onChange={(e) => setChannelValue(e.target.value)}
                    placeholder={
                      channelType === 'email'
                        ? 'you@example.com'
                        : 'https://hooks.slack.com/...'
                    }
                    className="input flex-1"
                  />
                </div>
                {channelType === 'slack' && (
                  <p className="text-sm text-gray-500">
                    Create a Slack webhook in your workspace settings
                  </p>
                )}
              </div>

              <button
                onClick={createAlert}
                disabled={!name || !threshold || !channelValue}
                className="btn btn-primary w-full"
              >
                Create Alert
              </button>
            </div>
          </div>
        )}

        {/* Alerts List */}
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold mb-2">No alerts yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first alert to get notified about cost spikes or errors
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="btn btn-primary"
              >
                Create First Alert
              </button>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`card ${!alert.enabled ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{alert.name}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {alertTypeLabels[alert.type]}
                      </span>
                      {alert.enabled ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                          Disabled
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      Threshold: <span className="font-medium">
                        {alert.type === 'error_rate' ? `${alert.threshold}%` : `$${alert.threshold}`}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600">
                      Channels:{' '}
                      {alert.channels.map((ch, i) => (
                        <span key={i} className="font-medium">
                          {ch.type}
                          {i < alert.channels.length - 1 && ', '}
                        </span>
                      ))}
                    </div>

                    {alert.last_triggered_at && (
                      <div className="text-xs text-gray-500 mt-2">
                        Last triggered: {new Date(alert.last_triggered_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAlert(alert.id, alert.enabled)}
                      className="btn btn-secondary text-sm"
                    >
                      {alert.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium px-3"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
