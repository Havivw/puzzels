'use client';

import { useEffect, useState } from 'react';
import { SafeHintRoute } from '@/types';
import { sanitizeHtml } from '@/lib/security';

export default function HintRoutePage({ params }: { params: Promise<{ uuid: string }> }) {
  const [uuid, setUuid] = useState<string>('');
  const [hintRoute, setHintRoute] = useState<SafeHintRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUuid = async () => {
      try {
        const { uuid: resolvedUuid } = await params;
        setUuid(resolvedUuid);
      } catch (err) {
        setError('Failed to resolve route parameters');
        setLoading(false);
      }
    };
    getUuid();
  }, [params]);

  useEffect(() => {
    if (!uuid) return;

    const fetchHintRoute = async () => {
      try {
        // Check if this is a hint route by looking for the 'hint-' prefix
        if (!uuid.startsWith('hint-')) {
          setError('Invalid hint route');
          setLoading(false);
          return;
        }

        // Fetch hint route from API
        const response = await fetch(`/api/hint-route/${uuid}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setHintRoute(data.data);
        } else {
          setError(data.error || 'Hint route not found');
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load hint route');
        setLoading(false);
      }
    };

    fetchHintRoute();
  }, [uuid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-lg">LOADING HINT...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">🚫 ACCESS DENIED</h1>
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!hintRoute) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">🚫 HINT NOT FOUND</h1>
          <p className="text-lg">This hint route does not exist or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 border border-green-400 rounded-lg p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-400 mb-2">🔓 HINT ACCESSED</h1>
            <p className="text-gray-400">Secure hint delivery system</p>
          </div>
          
          <div className="bg-black border border-green-400 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-400 mb-4">HINT CONTENT:</h2>
            <div 
              className="text-lg leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(hintRoute.content) }}
            />
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              This hint route was created by an administrator and is accessible via UUID.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
