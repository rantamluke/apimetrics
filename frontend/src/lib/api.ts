/**
 * API Client
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class APIClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
      if (this.token) {
        this.setToken(this.token);
      }
    }
  }

  setToken(token: string) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    delete this.client.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  // Auth
  async register(email: string, password: string) {
    const { data } = await this.client.post('/v1/auth/register', { email, password });
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const { data } = await this.client.post('/v1/auth/login', { email, password });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    const { data } = await this.client.get('/v1/auth/me');
    return data.user;
  }

  async logout() {
    this.clearToken();
  }

  // API Keys
  async getAPIKeys() {
    const { data } = await this.client.get('/v1/auth/keys');
    return data.keys;
  }

  async createAPIKey(name: string) {
    const { data } = await this.client.post('/v1/auth/keys', { name });
    return data.apiKey;
  }

  async deleteAPIKey(id: string) {
    await this.client.delete(`/v1/auth/keys/${id}`);
  }

  // Analytics
  async getOverview(days: number = 7) {
    const { data } = await this.client.get('/v1/analytics/overview', {
      params: { days },
    });
    return data;
  }

  async getTimeseries(days: number = 7, groupBy: 'hour' | 'day' = 'day') {
    const { data } = await this.client.get('/v1/analytics/timeseries', {
      params: { days, groupBy },
    });
    return data.data;
  }

  async getTopExpensive(limit: number = 20) {
    const { data } = await this.client.get('/v1/analytics/top-expensive', {
      params: { limit },
    });
    return data.calls;
  }

  async getRecommendations() {
    const { data } = await this.client.get('/v1/analytics/recommendations');
    return data.recommendations;
  }

  // Alerts
  async getAlerts() {
    const { data } = await this.client.get('/v1/alerts');
    return data.alerts;
  }

  async createAlert(alert: {
    name: string;
    type: string;
    threshold: number;
    channels: any[];
  }) {
    const { data } = await this.client.post('/v1/alerts', alert);
    return data.alert;
  }

  async updateAlert(id: string, updates: any) {
    const { data } = await this.client.patch(`/v1/alerts/${id}`, updates);
    return data.alert;
  }

  async deleteAlert(id: string) {
    await this.client.delete(`/v1/alerts/${id}`);
  }
}

export const api = new APIClient();
