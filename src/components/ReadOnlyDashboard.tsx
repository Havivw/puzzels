'use client';

import { useState, useEffect } from 'react';
import { DashboardData } from '@/types';
import { BarChart3, Users, TrendingUp, Eye } from 'lucide-react';

interface ReadOnlyDashboardProps {
  uuid: string;
}

export default function ReadOnlyDashboard({ uuid }: ReadOnlyDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard?uuid=${uuid}`);
      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4 shadow-lg shadow-purple-500/50"></div>
          <p className="text-purple-300 font-mono">LOADING METRICS...</p>
          <div className="mt-2 text-xs text-gray-500 font-mono">Accessing surveillance data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black bg-gradient-to-br from-gray-900 via-black to-red-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-400 text-6xl mb-4 animate-pulse">⚠</div>
          <h1 className="text-2xl font-bold text-red-300 mb-4 font-mono tracking-wider">SYSTEM ERROR</h1>
          <p className="text-gray-400 mb-6 font-mono">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-red-600 border border-red-400 text-white px-6 py-3 rounded-lg hover:bg-red-500 transition-colors font-mono shadow-lg shadow-red-500/30"
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const sortedUsers = [...dashboardData.users].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="min-h-screen bg-black bg-gradient-to-br from-gray-900 via-black to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gray-900 border border-purple-500/30 rounded-2xl shadow-lg shadow-purple-500/20 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-8 h-8 text-purple-400" />
              <div>
                <h1 className="text-3xl font-bold text-purple-300 font-mono tracking-wider">SURVEILLANCE MATRIX</h1>
                <p className="text-gray-400 font-mono">&gt; Real-time cognitive enhancement monitoring</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 font-mono">LAST SYNC</div>
              <div className="text-sm font-medium text-gray-300 font-mono">
                {new Date(dashboardData.lastUpdated).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-blue-500/30 rounded-2xl shadow-lg shadow-blue-500/20 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-blue-300 font-mono">ACTIVE USERS</h3>
                <p className="text-3xl font-bold text-blue-400 font-mono">{dashboardData.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-green-500/30 rounded-2xl shadow-lg shadow-green-500/20 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-green-300 font-mono">AVERAGE PROGRESS</h3>
                <p className="text-3xl font-bold text-green-400 font-mono">{dashboardData.averageCompletion}%</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-purple-500/30 rounded-2xl shadow-lg shadow-purple-500/20 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-900/30 border border-purple-500/50 rounded-lg">
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-purple-300 font-mono">PUZZLES COMPLETED</h3>
                <p className="text-3xl font-bold text-purple-400 font-mono">
                  {dashboardData.users.filter(u => u.percentage === 100).length}
                </p>
              </div>
            </div>
          </div>
        </div>



        {/* Individual Progress */}
        <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl shadow-lg shadow-cyan-500/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-cyan-300 font-mono">USER STATUS</h3>
            <div className="text-sm text-gray-400 font-mono">
              MONITORING {dashboardData.users.length} SUBJECTS
            </div>
          </div>

          <div className="space-y-4">
            {sortedUsers.map((user, index) => (
              <div key={index} className="border border-gray-700 bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-cyan-900/30 border border-cyan-500/50 rounded-full flex items-center justify-center">
                        <span className="text-cyan-400 font-semibold text-sm font-mono">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 font-mono">{user.name.toUpperCase()}</h4>
                      <p className="text-sm text-gray-400 font-mono">
                        {user.completedCount} OF {user.totalQuestions} PUZZLES COMPLETED
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold font-mono border ${
                    user.percentage >= 80 ? 'text-green-300 bg-green-900/30 border-green-500/50' :
                    user.percentage >= 50 ? 'text-yellow-300 bg-yellow-900/30 border-yellow-500/50' :
                    'text-red-300 bg-red-900/30 border-red-500/50'
                  }`}>
                    {user.percentage}%
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="w-full bg-gray-700 border border-gray-600 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 shadow-lg ${
                        user.percentage >= 80 ? 'bg-green-500 shadow-green-500/50' :
                        user.percentage >= 50 ? 'bg-yellow-500 shadow-yellow-500/50' :
                        'bg-red-500 shadow-red-500/50'
                      }`}
                      style={{ width: `${user.percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 font-mono">
                  LAST ACTIVITY: {new Date(user.lastActivity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {dashboardData.users.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-6xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-gray-400 mb-2 font-mono">NO ACTIVITY DETECTED</h3>
              <p className="text-gray-500 font-mono">Awaiting neural link connections...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
