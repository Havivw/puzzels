'use client';

import { useState, useEffect } from 'react';
import { SafeQuestion, QuestionResponse, AnswerResponse } from '@/types';
import { sanitizeHtml, sanitizeErrorMessage } from '@/lib/security';
import { Lightbulb, Send, Trophy, User as UserIcon } from 'lucide-react';

interface PuzzleInterfaceProps {
  uuid: string;
}

export default function PuzzleInterface({ uuid }: PuzzleInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState<SafeQuestion | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning' | null; message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [unlockedHints, setUnlockedHints] = useState<string[]>([]);
  const [hintPassword, setHintPassword] = useState('');
  const [requestingHint, setRequestingHint] = useState(false);
  const [hintsRequirePassword, setHintsRequirePassword] = useState(false);

  useEffect(() => {
    fetchCurrentQuestion();
  }, []);

  // Countdown timer for rate limit
  useEffect(() => {
    if (rateLimited && lockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1) {
            setRateLimited(false);
            setFeedback({ type: null, message: '' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [rateLimited, lockTimeRemaining]);

  const fetchCurrentQuestion = async () => {
    try {
      const response = await fetch(`/api/question?uuid=${uuid}`);
      const data = await response.json();

      if (data.success) {
        const questionData: QuestionResponse = data.data;
        
        // Check if user has completed all questions
        if (questionData.completed || (questionData.question === null && questionData.progress.percentage === 100)) {
          setCompleted(true);
          setCurrentQuestion(null);
        } else {
          setCurrentQuestion(questionData.question);
        }
        
        setProgress(questionData.progress);
      } else {
        setFeedback({ type: 'error', message: sanitizeErrorMessage(data.error || 'Failed to load question') });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load question' });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !answer.trim()) return;

    setSubmitting(true);
    setFeedback({ type: null, message: '' });

    try {
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid,
          questionId: currentQuestion.id,
          answer: answer.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        const answerData: AnswerResponse = data.data;
        
        if (answerData.rateLimited) {
          setRateLimited(true);
          setLockTimeRemaining(answerData.lockTimeRemaining || 0);
          const minutes = Math.floor((answerData.lockTimeRemaining || 0) / 60);
          const seconds = (answerData.lockTimeRemaining || 0) % 60;
          setFeedback({ 
            type: 'warning', 
            message: `🚫 SYSTEM OVERLOAD DETECTED! Too many incorrect attempts. System locked for ${minutes}m ${seconds}s.` 
          });
        } else if (answerData.correct) {
          setFeedback({ type: 'success', message: '🎉 PUZZLE SOLVED! Correct!' });
          setProgress(answerData.progress);
          setAnswer('');
          setShowHint(false);
          setRateLimited(false);
          
          if (answerData.completed) {
            setCompleted(true);
            setCurrentQuestion(null);
          } else if (answerData.nextQuestion) {
            setTimeout(() => {
              setCurrentQuestion(answerData.nextQuestion!);
              setFeedback({ type: null, message: '' });
            }, 2000);
          }
        } else {
          setFeedback({ type: 'error', message: '❌ INCORRECT ANSWER. Try again!' });
        }
      } else {
        setFeedback({ type: 'error', message: sanitizeErrorMessage(data.error || 'Failed to submit answer') });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to submit answer' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitting) {
      submitAnswer();
    }
  };

  const requestHints = async (password?: string) => {
    if (!currentQuestion) return;

    setRequestingHint(true);
    try {
      const response = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid,
          questionId: currentQuestion.id,
          password
        })
      });

      const data = await response.json();

      if (data.success) {
        const hintData = data.data;
        
        if (hintData.success && hintData.hints) {
          // Set all unlocked hints
          setUnlockedHints(hintData.hints);
          setHintPassword('');
          setHintsRequirePassword(false);
          setFeedback({ type: 'success', message: '🔓 HINTS UNLOCKED!' });
        } else if (hintData.rateLimited) {
          setHintsRequirePassword(true);
          const minutes = Math.floor((hintData.lockTimeRemaining || 0) / 60);
          const seconds = (hintData.lockTimeRemaining || 0) % 60;
          setFeedback({ 
            type: 'error', 
            message: `🚫 TOO MANY FAILED PASSWORD ATTEMPTS! Hint access locked for ${minutes}m ${seconds}s.` 
          });
        } else if (hintData.requiresPassword) {
          setHintsRequirePassword(true);
          setFeedback({ 
            type: 'warning', 
            message: hintData.error?.includes('Incorrect password') 
              ? '❌ INCORRECT PASSWORD! Try again.' 
              : '🔒 ENCRYPTED HINTS! Password required for hints.' 
          });
        } else {
          setFeedback({ type: 'error', message: hintData.error || 'Failed to access hints' });
        }
      } else {
        setFeedback({ type: 'error', message: sanitizeErrorMessage(data.error || 'Failed to request hints') });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to request hints' });
    } finally {
      setRequestingHint(false);
    }
  };

  const toggleHint = () => {
    setShowHint(!showHint);
    if (!showHint) {
      setHintPassword('');
      setUnlockedHints([]);
      setHintsRequirePassword(false);
      // Try to request hints without password first
      requestHints();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4 shadow-lg shadow-purple-500/50"></div>
          <p className="text-purple-300 font-mono">LOADING PUZZLE...</p>
          <div className="mt-2 text-xs text-gray-500 font-mono">Decrypting challenge matrix...</div>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-black bg-gradient-to-br from-gray-900 via-black to-green-900 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center bg-gray-900 border border-green-500/30 rounded-2xl shadow-xl shadow-green-500/20 p-8">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-bold text-green-300 mb-4 font-mono tracking-wider">MISSION COMPLETE</h1>
          <p className="text-gray-300 mb-6 font-mono">
            ALL PUZZLES COMPLETED. MAXIMUM ACHIEVEMENT UNLOCKED! 🧠⚡
          </p>
          <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 shadow-inner">
            <p className="text-green-400 font-semibold font-mono">FINAL SCORE: {progress.percentage}%</p>
            <p className="text-green-300 text-sm mt-1 font-mono">
              {progress.current} / {progress.total} PUZZLES SOLVED!
            </p>
          </div>
          <div className="mt-6 space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all font-mono shadow-lg shadow-green-500/30"
            >
              🔄 REFRESH SYSTEM
            </button>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-mono">
            &gt; SYSTEM STATUS: ENLIGHTENED
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black bg-gradient-to-br from-gray-900 via-black to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl shadow-lg shadow-cyan-500/20 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserIcon className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-2xl font-bold text-cyan-300 font-mono tracking-wider">PUZZLE INTERFACE</h1>
                <p className="text-gray-400 font-mono">&gt; Cognitive enhancement protocol active</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400 font-mono">{progress.percentage}%</div>
              <div className="text-sm text-gray-500 font-mono">PROGRESS</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2 font-mono">
              <span>PUZZLE {progress.current} OF {progress.total}</span>
              <span>{progress.current - 1} DECODED</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-700">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg shadow-cyan-500/50"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-gray-900 border border-purple-500/30 rounded-2xl shadow-lg shadow-purple-500/20 p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-purple-300 mb-6 leading-relaxed font-mono">
                &gt; {sanitizeHtml(currentQuestion.text)}
              </h2>
              
              {/* Hint Section */}
              <div className="mb-6">
                  <button
                    onClick={toggleHint}
                    className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                  >
                    <Lightbulb className="w-5 h-5" />
                    <span>{showHint ? 'HIDE HINTS' : 'ACCESS HINTS'}</span>
                  </button>
                  
                  {showHint && (
                    <div className="mt-3">
                      {hintsRequirePassword ? (
                        <div className="p-4 bg-yellow-900/30 border border-yellow-500/30 rounded">
                          <div className="text-yellow-300 mb-3 font-mono">
                            🔒 ENCRYPTED HINTS - PASSWORD REQUIRED
                          </div>
                          <div className="flex space-x-3">
                            <input
                              type="password"
                              value={hintPassword}
                              onChange={(e) => setHintPassword(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && requestHints(hintPassword)}
                              placeholder="Enter decryption key..."
                              className="flex-1 px-3 py-2 bg-gray-800 border border-yellow-500/30 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-yellow-300 placeholder-gray-500 font-mono"
                            />
                            <button
                              onClick={() => requestHints(hintPassword)}
                              disabled={requestingHint || !hintPassword.trim()}
                              className="px-4 py-2 bg-yellow-600 text-black rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-bold"
                            >
                              {requestingHint ? 'DECRYPTING...' : 'DECRYPT'}
                            </button>
                          </div>
                        </div>
                      ) : unlockedHints.length > 0 ? (
                        <div className="p-4 bg-yellow-900/30 border-l-4 border-yellow-400 rounded border border-yellow-500/30">
                          <div className="text-yellow-300">
                            {unlockedHints.map((hint, index) => (
                              <p key={index} className="mb-1 font-mono">⚡ {sanitizeHtml(hint)}</p>
                            ))}
                          </div>
                        </div>
                      ) : requestingHint ? (
                        <div className="p-4 bg-yellow-900/30 border border-yellow-500/30 rounded">
                          <div className="text-yellow-300 font-mono flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                            <span>ACCESSING HINT DATABASE...</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
            </div>

            {/* Answer Input */}
            <div className="space-y-4">
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-400 mb-2 font-mono">
                  PUZZLE ANSWER INPUT
                </label>
                <div className="flex space-x-3">
                  <input
                    id="answer"
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter neural response..."
                    className="flex-1 px-4 py-3 bg-gray-800 border border-cyan-500/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-lg text-cyan-300 placeholder-gray-500 font-mono shadow-inner"
                    disabled={submitting}
                  />
                  <button
                    onClick={submitAnswer}
                    disabled={submitting || !answer.trim() || rateLimited}
                    className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-all font-mono font-bold shadow-lg ${
                      rateLimited 
                        ? 'bg-red-600 text-white cursor-not-allowed opacity-75 shadow-red-500/30' 
                        : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-black hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-cyan-500/30'
                    }`}
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    ) : rateLimited ? (
                      <div className="text-xl">🔒</div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    <span>
                      {submitting ? 'PROCESSING...' : 
                       rateLimited ? `LOCKED ${Math.floor(lockTimeRemaining / 60)}:${String(lockTimeRemaining % 60).padStart(2, '0')}` : 
                       'TRANSMIT'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Feedback */}
              {feedback.type && (
                <div className={`p-4 rounded-lg border font-mono ${
                  feedback.type === 'success' 
                    ? 'bg-green-900/30 border border-green-500/50 text-green-300 shadow-lg shadow-green-500/20' 
                    : feedback.type === 'warning'
                    ? 'bg-yellow-900/30 border border-yellow-500/50 text-yellow-300 shadow-lg shadow-yellow-500/20'
                    : 'bg-red-900/30 border border-red-500/50 text-red-300 shadow-lg shadow-red-500/20'
                }`}>
                  {feedback.message}
                  {rateLimited && (
                    <div className="mt-2 text-sm">
                      🕐 SYSTEM COOLDOWN: {Math.floor(lockTimeRemaining / 60)}:{String(lockTimeRemaining % 60).padStart(2, '0')} remaining
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
