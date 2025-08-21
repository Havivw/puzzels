'use client';

import { useState, useEffect } from 'react';
import { AdminDashboardData, Question, User } from '@/types';
import { Settings, Users, FileText, Plus, Trash2, Edit, Save, X, Copy, ExternalLink, Shield, RefreshCw, Link } from 'lucide-react';

interface AdminDashboardProps {
  uuid: string;
}

export default function AdminDashboard({ uuid }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questions' | 'users' | 'security' | 'access'>('dashboard');
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newAdminUuid, setNewAdminUuid] = useState('');
  const [newDashboardUuid, setNewDashboardUuid] = useState('');
  const [updatingConfig, setUpdatingConfig] = useState(false);
  const [currentDashboardUuid, setCurrentDashboardUuid] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchQuestions();
    fetchUsers();
    fetchCurrentConfig();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard?uuid=${uuid}`);
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/admin/questions?uuid=${uuid}`);
      const data = await response.json();
      if (data.success) {
        setQuestions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/admin/users?uuid=${uuid}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentConfig = async () => {
    try {
      const response = await fetch(`/api/admin/config?uuid=${uuid}`);
      const data = await response.json();
      if (data.success) {
        setCurrentDashboardUuid(data.data.dashboardUuid);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const saveQuestions = async () => {
    try {
      const response = await fetch(`/api/admin/questions?uuid=${uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questions)
      });
      const data = await response.json();
      if (data.success) {
        alert('Questions saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save questions:', error);
      alert('Failed to save questions');
    }
  };

  const addQuestion = () => {
    // Generate a unique ID by finding the highest existing order number
    const maxOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order)) : 0;
    const newQuestion: Question = {
      id: `q${maxOrder + 1}`,
      text: '',
      answer: '',
      hints: [],
      order: maxOrder + 1
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion);
  };

  const deleteQuestion = (questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter(q => q.id !== questionId));
    }
  };

  const updateQuestion = (updatedQuestion: Question) => {
    setQuestions(questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
    setEditingQuestion(null);
  };

  const addUser = async () => {
    if (!newUserName.trim()) {
      alert('Please enter a user name');
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users?uuid=${uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setUsers([...users, data.data]);
        setNewUserName('');
        fetchDashboardData(); // Refresh dashboard data
        alert(`User "${data.data.name}" added successfully!\nUUID: ${data.data.uuid}\n\nShare this URL: ${window.location.origin}?uuid=${data.data.uuid}`);
      } else {
        alert(`Failed to add user: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to add user:', error);
      alert('Failed to add user');
    }
  };

  const deleteUser = async (userUuid: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`/api/admin/users?uuid=${uuid}&userUuid=${userUuid}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setUsers(users.filter(u => u.uuid !== userUuid));
        fetchDashboardData(); // Refresh dashboard data
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const copyUserUrl = async (userUuid: string, userName: string) => {
    const url = `${window.location.origin}?uuid=${userUuid}`;
    try {
      await navigator.clipboard.writeText(url);
      alert(`URL copied to clipboard for ${userName}!`);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(`URL copied to clipboard for ${userName}!`);
    }
  };

  const generateNewUuids = () => {
    const generateUuid = () => {
      return 'xxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    setNewAdminUuid(`admin-${generateUuid()}`);
    setNewDashboardUuid(`dash-${generateUuid()}`);
  };

  const updateConfiguration = async () => {
    if (!newAdminUuid || !newDashboardUuid) {
      alert('Please generate new UUIDs first');
      return;
    }

    if (newAdminUuid === newDashboardUuid) {
      alert('Admin and Dashboard UUIDs must be different');
      return;
    }

    if (!confirm('⚠️ WARNING: This will change the admin and dashboard access UUIDs!\n\nCurrent admin session will be invalidated. Make sure to save the new UUIDs.\n\nContinue?')) {
      return;
    }

    setUpdatingConfig(true);
    try {
      const response = await fetch(`/api/admin/config?uuid=${uuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUuid: newAdminUuid,
          dashboardUuid: newDashboardUuid
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ UUIDs updated successfully!\n\n🔑 New Admin UUID: ${newAdminUuid}\n📊 New Dashboard UUID: ${newDashboardUuid}\n\n⚠️ You will need to use the new admin UUID to access this panel.`);
        // Redirect to new admin URL
        window.location.href = `${window.location.origin}?uuid=${newAdminUuid}`;
      } else {
        alert(`Failed to update UUIDs: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to update UUIDs');
    } finally {
      setUpdatingConfig(false);
    }
  };

  const copyUrl = async (url: string, type: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert(`${type} URL copied to clipboard!`);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(`${type} URL copied to clipboard!`);
    }
  };

  const openUrl = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black bg-gradient-to-br from-gray-900 via-black to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4 shadow-lg shadow-blue-500/50"></div>
          <p className="text-blue-300 font-mono">LOADING ADMIN INTERFACE...</p>
          <div className="mt-2 text-xs text-gray-500 font-mono">Accessing control systems...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black bg-gradient-to-br from-gray-900 via-black to-blue-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-900 border border-blue-500/30 rounded-2xl shadow-lg shadow-blue-500/20 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-blue-300 font-mono tracking-wider">ADMIN CONTROL MATRIX</h1>
                <p className="text-gray-400 font-mono">&gt; Neural system management interface</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl shadow-lg shadow-cyan-500/20 mb-6">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-4 font-medium font-mono ${
                activeTab === 'dashboard'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>OVERVIEW</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-4 font-medium font-mono ${
                activeTab === 'questions'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>PUZZLES</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-medium font-mono ${
                activeTab === 'users'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>USERS</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-4 font-medium font-mono ${
                activeTab === 'security'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>SECURITY</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`px-6 py-4 font-medium font-mono ${
                activeTab === 'access'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Link className="w-5 h-5" />
                <span>ACCESS URLS</span>
              </div>
            </button>
          </div>

          <div className="p-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && dashboardData && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-6 shadow-lg shadow-blue-500/20">
                    <h3 className="text-lg font-semibold text-blue-300 mb-2 font-mono">ACTIVE USERS</h3>
                    <p className="text-3xl font-bold text-blue-400 font-mono">{dashboardData.totalUsers}</p>
                  </div>
                  <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-6 shadow-lg shadow-green-500/20">
                    <h3 className="text-lg font-semibold text-green-300 mb-2 font-mono">AVERAGE PROGRESS</h3>
                    <p className="text-3xl font-bold text-green-400 font-mono">{dashboardData.averageCompletion}%</p>
                  </div>
                  <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-6 shadow-lg shadow-purple-500/20">
                    <h3 className="text-lg font-semibold text-purple-300 mb-2 font-mono">PUZZLES</h3>
                    <p className="text-3xl font-bold text-purple-400 font-mono">{questions.length}</p>
                  </div>
                </div>

                {/* User Progress Table */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">User Progress</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UUID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardData.users.map((user) => (
                          <tr key={user.uuid}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.uuid}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${user.percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{user.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.completedCount}/{user.totalQuestions}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.lastActivity).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-cyan-300 font-mono">PUZZLE MATRIX</h3>
                  <div className="space-x-3">
                    <button
                      onClick={addQuestion}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-500 hover:to-cyan-500 flex items-center space-x-2 font-mono shadow-lg shadow-blue-500/30 border border-blue-400/30"
                    >
                      <Plus className="w-4 h-4" />
                      <span>CREATE PUZZLE</span>
                    </button>
                    <button
                      onClick={saveQuestions}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-500 hover:to-emerald-500 flex items-center space-x-2 font-mono shadow-lg shadow-green-500/30 border border-green-400/30"
                    >
                      <Save className="w-4 h-4" />
                      <span>UPLOAD MATRIX</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((question) => (
                    <div key={question.id} className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6 shadow-lg shadow-cyan-500/10">
                      {editingQuestion?.id === question.id ? (
                        <QuestionEditor 
                          question={editingQuestion}
                          onSave={updateQuestion}
                          onCancel={() => setEditingQuestion(null)}
                        />
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-cyan-300 mb-2 font-mono">PUZZLE #{question.order}</h4>
                            <p className="text-gray-300 mb-2 font-mono">&gt; {question.text}</p>
                            <p className="text-sm text-green-400 font-mono">SOLUTION: {question.answer}</p>
                            {question.hints && question.hints.length > 0 && (
                              <p className="text-sm text-yellow-400 mt-1 font-mono">
                                HINTS: {question.hints.join(' | ')}
                              </p>
                            )}
                            {question.hintPassword && (
                              <p className="text-sm text-orange-400 mt-1 font-mono">
                                🔒 ENCRYPTION KEY: {question.hintPassword}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => setEditingQuestion(question)}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteQuestion(question.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-cyan-300 font-mono">USER MANAGEMENT</h3>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addUser()}
                      placeholder="Enter subject designation..."
                      className="px-3 py-2 bg-gray-800 border border-cyan-500/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 min-w-[200px] text-cyan-300 placeholder-gray-500 font-mono"
                    />
                    <button
                      onClick={addUser}
                      disabled={!newUserName.trim()}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono shadow-lg shadow-cyan-500/30 border border-cyan-400/30"
                    >
                      <Plus className="w-4 h-4" />
                      <span>INITIATE LINK</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UUID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.uuid}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.uuid}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Question {user.currentQuestion} ({user.completedQuestions.length} completed)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => copyUserUrl(user.uuid, user.name)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Copy user URL"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => window.open(`${window.location.origin}?uuid=${user.uuid}`, '_blank')}
                                className="text-green-600 hover:text-green-700"
                                title="Open user puzzle"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteUser(user.uuid)}
                                className="text-red-600 hover:text-red-700"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-red-300 font-mono">SECURITY MATRIX</h3>
                  <div className="text-sm text-gray-400 font-mono">
                    ⚠️ CRITICAL SYSTEM CONFIGURATION
                  </div>
                </div>

                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6 shadow-lg shadow-red-500/20">
                  <h4 className="text-lg font-semibold text-red-300 mb-4 font-mono">🔐 ACCESS UUID REGENERATION</h4>
                  <p className="text-red-200 mb-6 font-mono text-sm">
                    Generate new UUIDs for admin and dashboard access. This will invalidate current access tokens.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-red-300 mb-2 font-mono">NEW ADMIN UUID</label>
                      <input
                        type="text"
                        value={newAdminUuid}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-800 border border-red-500/30 rounded-lg text-red-300 font-mono text-sm"
                        placeholder="Generate new UUIDs to see values..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-red-300 mb-2 font-mono">NEW DASHBOARD UUID</label>
                      <input
                        type="text"
                        value={newDashboardUuid}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-800 border border-red-500/30 rounded-lg text-red-300 font-mono text-sm"
                        placeholder="Generate new UUIDs to see values..."
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={generateNewUuids}
                        className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-yellow-500 hover:to-orange-500 flex items-center space-x-2 font-mono shadow-lg shadow-yellow-500/30"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>GENERATE NEW UUIDS</span>
                      </button>

                      <button
                        onClick={updateConfiguration}
                        disabled={updatingConfig || !newAdminUuid || !newDashboardUuid}
                        className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-500 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono shadow-lg shadow-red-500/30"
                      >
                        {updatingConfig ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                        <span>{updatingConfig ? 'UPDATING...' : 'APPLY CHANGES'}</span>
                      </button>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                      <h5 className="text-yellow-300 font-semibold mb-2 font-mono">⚠️ SECURITY WARNING</h5>
                      <ul className="text-yellow-200 text-sm space-y-1 font-mono">
                        <li>• Current admin session will be terminated</li>
                        <li>• Dashboard access will require new UUID</li>
                        <li>• Make sure to save new UUIDs before applying</li>
                        <li>• Changes are immediate and irreversible</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-300 mb-4 font-mono">📊 CURRENT CONFIGURATION</h4>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Admin UUID:</span>
                      <span className="text-cyan-300">{uuid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Users:</span>
                      <span className="text-cyan-300">{users.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Questions:</span>
                      <span className="text-cyan-300">{questions.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Access URLs Tab */}
            {activeTab === 'access' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-cyan-300 font-mono">ACCESS CONTROL URLS</h3>
                  <div className="text-sm text-gray-400 font-mono">
                    🔗 DIRECT SYSTEM ACCESS LINKS
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Admin URL Card */}
                  <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-500/50 rounded-lg p-6 shadow-lg shadow-red-500/20">
                    <h4 className="text-lg font-semibold text-red-300 mb-4 font-mono flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>🔑 ADMIN CONTROL PANEL</span>
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-red-300 mb-2 font-mono">ADMIN ACCESS URL</label>
                        <div className="bg-gray-800 border border-red-500/30 rounded-lg p-3 font-mono text-sm">
                          <div className="text-red-200 break-all">
                            {`${typeof window !== 'undefined' ? window.location.origin : ''}?uuid=${uuid}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => copyUrl(`${typeof window !== 'undefined' ? window.location.origin : ''}?uuid=${uuid}`, 'Admin')}
                          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-500 hover:to-red-600 flex items-center space-x-2 font-mono shadow-lg shadow-red-500/30"
                        >
                          <Copy className="w-4 h-4" />
                          <span>COPY URL</span>
                        </button>
                        
                        <button
                          onClick={() => openUrl(`${typeof window !== 'undefined' ? window.location.origin : ''}?uuid=${uuid}`)}
                          className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg hover:from-gray-500 hover:to-gray-600 flex items-center space-x-2 font-mono shadow-lg shadow-gray-500/30"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>OPEN</span>
                        </button>
                      </div>

                      <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                        <h5 className="text-red-300 font-semibold mb-1 font-mono text-sm">🛡️ ADMIN PRIVILEGES</h5>
                        <ul className="text-red-200 text-xs space-y-1 font-mono">
                          <li>• Full system administration access</li>
                          <li>• Question and user management</li>
                          <li>• Security configuration control</li>
                          <li>• Dashboard analytics and monitoring</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard URL Card */}
                  <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-500/50 rounded-lg p-6 shadow-lg shadow-blue-500/20">
                    <h4 className="text-lg font-semibold text-blue-300 mb-4 font-mono flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>📊 READ-ONLY DASHBOARD</span>
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-300 mb-2 font-mono">DASHBOARD ACCESS URL</label>
                        <div className="bg-gray-800 border border-blue-500/30 rounded-lg p-3 font-mono text-sm">
                          <div className="text-blue-200 break-all">
                            {currentDashboardUuid ? 
                              `${typeof window !== 'undefined' ? window.location.origin : ''}?uuid=${currentDashboardUuid}` : 
                              'Loading dashboard UUID...'
                            }
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => currentDashboardUuid && copyUrl(`${typeof window !== 'undefined' ? window.location.origin : ''}?uuid=${currentDashboardUuid}`, 'Dashboard')}
                          disabled={!currentDashboardUuid}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono shadow-lg shadow-blue-500/30"
                        >
                          <Copy className="w-4 h-4" />
                          <span>COPY URL</span>
                        </button>
                        
                        <button
                          onClick={() => currentDashboardUuid && openUrl(`${typeof window !== 'undefined' ? window.location.origin : ''}?uuid=${currentDashboardUuid}`)}
                          disabled={!currentDashboardUuid}
                          className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg hover:from-gray-500 hover:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono shadow-lg shadow-gray-500/30"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>OPEN</span>
                        </button>
                      </div>

                      <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                        <h5 className="text-blue-300 font-semibold mb-1 font-mono text-sm">👁️ DASHBOARD PRIVILEGES</h5>
                        <ul className="text-blue-200 text-xs space-y-1 font-mono">
                          <li>• Read-only access to progress data</li>
                          <li>• Anonymous user monitoring</li>
                          <li>• System statistics overview</li>
                          <li>• No administrative capabilities</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-yellow-300 mb-4 font-mono">⚠️ SECURITY GUIDELINES</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
                    <div className="space-y-2">
                      <h5 className="text-yellow-300 font-semibold">🔐 ACCESS CONTROL</h5>
                      <ul className="text-yellow-200 space-y-1">
                        <li>• Keep URLs confidential</li>
                        <li>• Share only with authorized personnel</li>
                        <li>• Regularly rotate UUIDs for security</li>
                        <li>• Monitor access logs for anomalies</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-yellow-300 font-semibold">🚨 EMERGENCY PROCEDURES</h5>
                      <ul className="text-yellow-200 space-y-1">
                        <li>• Use Security tab to regenerate UUIDs</li>
                        <li>• Immediately invalidates compromised access</li>
                        <li>• Update all authorized personnel</li>
                        <li>• Document security incidents</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuestionEditorProps {
  question: Question;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [editedQuestion, setEditedQuestion] = useState(question);

  const updateField = (field: keyof Question, value: string | number | string[]) => {
    setEditedQuestion({ ...editedQuestion, [field]: value });
  };

  const updateHints = (hints: string) => {
    const hintsArray = hints.split(',').map(h => h.trim()).filter(h => h.length > 0);
    setEditedQuestion({ ...editedQuestion, hints: hintsArray });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1 font-mono">PUZZLE TEXT</label>
        <textarea
          value={editedQuestion.text}
          onChange={(e) => updateField('text', e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-purple-300 placeholder-gray-500 font-mono"
          rows={3}
          placeholder="Enter the puzzle question..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1 font-mono">SOLUTION CODE</label>
        <input
          type="text"
          value={editedQuestion.answer}
          onChange={(e) => updateField('answer', e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-green-300 placeholder-gray-500 font-mono"
          placeholder="Enter the correct answer..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1 font-mono">HINTS (comma-separated)</label>
        <input
          type="text"
          value={editedQuestion.hints?.join(', ') || ''}
          onChange={(e) => updateHints(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-cyan-500/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-cyan-300 placeholder-gray-500 font-mono"
          placeholder="Enter hints separated by commas..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1 font-mono">HINT ENCRYPTION KEY (optional)</label>
        <input
          type="text"
          value={editedQuestion.hintPassword || ''}
          onChange={(e) => updateField('hintPassword', e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-yellow-500/30 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-yellow-300 placeholder-gray-500 font-mono"
          placeholder="Leave empty for public hints, or enter password to encrypt..."
        />
        <p className="text-xs text-gray-500 mt-1 font-mono">⚡ Users will need this password to unlock hints</p>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 border border-gray-600 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center space-x-2 font-mono"
        >
          <X className="w-4 h-4" />
          <span>ABORT</span>
        </button>
        <button
          onClick={() => onSave(editedQuestion)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 flex items-center space-x-2 font-mono shadow-lg shadow-cyan-500/30"
        >
          <Save className="w-4 h-4" />
          <span>UPLOAD</span>
        </button>
      </div>
    </div>
  );
}
