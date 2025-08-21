'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import PuzzleInterface from '@/components/PuzzleInterface';
import AdminDashboard from '@/components/AdminDashboard';
import ReadOnlyDashboard from '@/components/ReadOnlyDashboard';
import ComingSoonPage from '@/components/ComingSoonPage';
import { SafeValidationResult } from '@/types';

export default function Home() {
  const searchParams = useSearchParams();
  const uuid = searchParams?.get('uuid');
  const [validation, setValidation] = useState<SafeValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) {
      // No UUID provided, show coming soon page
      setLoading(false);
      return;
    }

    validateUser(uuid);
  }, [uuid]);

  const validateUser = async (userUuid: string) => {
    try {
      const response = await fetch(`/api/validate?uuid=${userUuid}`);
      const data = await response.json();

      if (data.success && data.data.valid) {
        setValidation(data.data);
      } else {
        setError('Invalid UUID. Access denied.');
      }
    } catch {
      setError('Failed to validate user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If no UUID provided, show coming soon page
  if (!uuid) {
    return <ComingSoonPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black bg-gradient-to-br from-gray-900 via-black to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4 shadow-lg shadow-cyan-500/50"></div>
          <p className="text-cyan-300 font-mono">VALIDATING ACCESS...</p>
          <div className="mt-2 text-xs text-gray-500 font-mono">Scanning pathways...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black bg-gradient-to-br from-gray-900 via-black to-red-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-400 text-6xl mb-4 animate-pulse">⚠</div>
          <h1 className="text-2xl font-bold text-red-300 mb-4 font-mono tracking-wider">ACCESS DENIED</h1>
          <p className="text-gray-400 mb-6 font-mono">{error}</p>
          <div className="bg-gray-900 border border-red-500/30 p-4 rounded-lg text-sm text-gray-300 shadow-lg shadow-red-500/20">
            <p className="font-semibold mb-2 text-red-400 font-mono">AUTHORIZATION REQUIRED</p>
            <p className="font-mono">Contact system administrator for access.</p>
            <div className="mt-4 p-2 bg-gray-800 rounded text-xs font-mono">
              <p className="text-gray-400">Valid UUID format required:</p>
              <p className="text-cyan-400">?uuid=your-valid-uuid</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!validation) return null;

  // Render appropriate interface based on user role
  switch (validation.role) {
    case 'user':
      return <PuzzleInterface uuid={uuid!} />;
    case 'admin':
      return <AdminDashboard uuid={uuid!} />;
    case 'dashboard':
      return <ReadOnlyDashboard uuid={uuid!} />;
    default:
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <p className="text-gray-400 font-mono">UNKNOWN USER ROLE - SYSTEM ERROR</p>
        </div>
      );
  }
}