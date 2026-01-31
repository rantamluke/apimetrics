'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            APImetrics
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            Track & optimize your AI API costs in real-time
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup" className="btn btn-primary text-lg px-8 py-3">
              Get Started Free
            </Link>
            <Link href="/login" className="btn btn-secondary text-lg px-8 py-3">
              Login
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="card text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Real-time Tracking</h3>
            <p className="text-gray-600">
              Monitor every API call with detailed cost breakdowns and token usage
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-xl font-bold mb-2">Smart Recommendations</h3>
            <p className="text-gray-600">
              Get AI-powered suggestions to optimize costs and improve performance
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-bold mb-2">Zero-Friction Setup</h3>
            <p className="text-gray-600">
              Drop-in replacement for OpenAI & Anthropic SDKs - just 2 lines changed
            </p>
          </div>
        </div>

        {/* Code Example */}
        <div className="card max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center">
            ⚡ Simple Integration
          </h2>
          <pre className="bg-gray-900 text-green-400 p-6 rounded-lg text-sm overflow-x-auto">
{`// Before
import OpenAI from 'openai';
const client = new OpenAI({ apiKey: '...' });

// After - just add 2 lines!
import { APImetricsClient, OpenAIWrapper } from '@apimetrics/sdk';
const tracker = new APImetricsClient({ apiKey: 'apim_...' });
const client = new OpenAIWrapper({ apiKey: '...' }, tracker);

// Use normally - costs tracked automatically! 🎯`}
          </pre>
        </div>

        {/* Pricing */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <h3 className="text-2xl font-bold mb-4">Free</h3>
              <div className="text-4xl font-bold mb-4">$0</div>
              <ul className="text-left space-y-2 mb-6">
                <li>✓ Up to $100 API spend tracked</li>
                <li>✓ 7 day retention</li>
                <li>✓ Basic analytics</li>
                <li>✓ Email alerts</li>
              </ul>
              <Link href="/signup" className="btn btn-secondary w-full">
                Start Free
              </Link>
            </div>

            <div className="card text-center border-2 border-primary-500 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Popular
              </div>
              <h3 className="text-2xl font-bold mb-4">Pro</h3>
              <div className="text-4xl font-bold mb-4">$49<span className="text-lg text-gray-600">/mo</span></div>
              <ul className="text-left space-y-2 mb-6">
                <li>✓ Unlimited tracking</li>
                <li>✓ 90 day retention</li>
                <li>✓ Advanced insights</li>
                <li>✓ Slack integration</li>
                <li>✓ Priority support</li>
              </ul>
              <Link href="/signup" className="btn btn-primary w-full">
                Start Pro Trial
              </Link>
            </div>

            <div className="card text-center">
              <h3 className="text-2xl font-bold mb-4">Team</h3>
              <div className="text-4xl font-bold mb-4">$199<span className="text-lg text-gray-600">/mo</span></div>
              <ul className="text-left space-y-2 mb-6">
                <li>✓ Everything in Pro</li>
                <li>✓ Multi-project support</li>
                <li>✓ 1 year retention</li>
                <li>✓ Custom alerts</li>
                <li>✓ Team collaboration</li>
              </ul>
              <Link href="/signup" className="btn btn-secondary w-full">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>© 2026 APImetrics. Built with 🌙 by Nox & niQlas</p>
        </div>
      </footer>
    </div>
  );
}
