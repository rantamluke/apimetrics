'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);
  const [overview, setOverview] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, timeRange]);

  async function loadData() {
    try {
      const [overviewData, timeseriesData, recommendationsData] = await Promise.all([
        api.getOverview(timeRange),
        api.getTimeseries(timeRange),
        api.getRecommendations(),
      ]);

      setOverview(overviewData);
      setTimeseries(timeseriesData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
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

  const stats = overview?.overview || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">APImetrics</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="flex gap-4 items-center">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={1}>Last 24h</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <button
              onClick={() => router.push('/alerts')}
              className="btn btn-secondary"
            >
              🔔 Alerts
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="btn btn-secondary"
            >
              Settings
            </button>
            <button
              onClick={logout}
              className="btn btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-sm text-gray-500 mb-1">Total Cost</div>
            <div className="text-3xl font-bold text-gray-900">
              ${(parseFloat(stats.total_cost) || 0).toFixed(2)}
            </div>
          </div>
          
          <div className="card">
            <div className="text-sm text-gray-500 mb-1">Total Calls</div>
            <div className="text-3xl font-bold text-gray-900">
              {(stats.total_calls || 0).toLocaleString()}
            </div>
          </div>

          <div className="card">
            <div className="text-sm text-gray-500 mb-1">Success Rate</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.total_calls > 0
                ? ((stats.successful_calls / stats.total_calls) * 100).toFixed(1)
                : 0}%
            </div>
          </div>

          <div className="card">
            <div className="text-sm text-gray-500 mb-1">Avg Latency</div>
            <div className="text-3xl font-bold text-gray-900">
              {Math.round(stats.avg_latency || 0)}ms
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold mb-4">💡 Cost Optimization Tips</h2>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border-l-4 ${
                    rec.severity === 'high'
                      ? 'bg-orange-50 border-orange-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="font-semibold mb-1">{rec.title}</div>
                  <div className="text-sm text-gray-600">{rec.description}</div>
                  {rec.potentialSavings && (
                    <div className="text-sm font-medium text-green-600 mt-2">
                      💰 Potential savings: ${rec.potentialSavings.toFixed(2)}/week
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost Over Time Chart */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Cost Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeseries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="#0ea5e9"
                strokeWidth={2}
                name="Cost ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Provider Breakdown */}
        {overview?.byProvider && overview.byProvider.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Cost by Provider</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={overview.byProvider}
                    dataKey="cost"
                    nameKey="provider"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {overview.byProvider.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold mb-4">Top Models</h2>
              <div className="space-y-3">
                {overview.byModel?.slice(0, 5).map((model: any, i: number) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{model.model}</div>
                      <div className="text-sm text-gray-500">
                        {model.calls} calls
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${parseFloat(model.cost).toFixed(2)}</div>
                      <div className="text-sm text-gray-500">
                        {(model.input_tokens + model.output_tokens).toLocaleString()} tokens
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
