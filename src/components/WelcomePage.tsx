'use client';

import { useState } from 'react';
import { Play, Users, Trophy, Brain, Zap, ArrowRight, ExternalLink } from 'lucide-react';

export default function WelcomePage() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-green-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent font-mono">
            HUSKEYS ESCAPE
          </h1>
          
          <p className="text-xl md:text-2xl text-green-300 font-mono animate-pulse">
            🎯 GAME IS NOW ACTIVE! 🎯
          </p>
          
          <div className="flex justify-center items-center space-x-2 text-green-400 font-mono">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-lg font-bold">🚀 SYSTEM STATUS: LIVE & READY! 🚀</span>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Game Description */}
        <div className="bg-gray-900/50 border border-cyan-500/30 rounded-2xl p-8 shadow-lg shadow-cyan-500/20 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-cyan-300 mb-4 font-mono">
            🧠 COGNITIVE ENHANCEMENT CHALLENGE
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed font-mono">
            Welcome to the ultimate neural puzzle experience. Test your cognitive abilities through a series of 
            carefully crafted riddles and challenges. Each puzzle will push your mind to new limits while 
            tracking your progress through our advanced monitoring system.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-purple-900/30 border border-purple-500/50 rounded-xl p-6 text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-purple-300 mb-2 font-mono">ACHIEVEMENT SYSTEM</h3>
            <p className="text-gray-400 text-sm font-mono">Track your progress and unlock achievements as you solve puzzles</p>
          </div>
          
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-xl p-6 text-center">
            <Brain className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-300 mb-2 font-mono">NEURAL ADAPTATION</h3>
            <p className="text-gray-400 text-sm font-mono">Puzzles designed to enhance cognitive function and problem-solving</p>
          </div>
          
          <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-6 text-center">
            <Users className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-300 mb-2 font-mono">LIVE MONITORING</h3>
            <p className="text-gray-400 text-sm font-mono">Real-time progress tracking and performance analytics</p>
          </div>
        </div>

        {/* Rules Section */}
        <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-8 shadow-lg shadow-red-500/20 backdrop-blur-sm mb-8">
          <h2 className="text-2xl font-bold text-red-300 mb-6 font-mono flex items-center justify-center">
            ⚠️ NEURAL PROTOCOL GUIDELINES ⚠️
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300 font-mono">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">01.</span>
                <p><span className="text-cyan-400">SECURITY TESTING:</span> Found vulnerabilities? Report them responsibly - we appreciate ethical disclosure.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">02.</span>
                <p><span className="text-yellow-400">BRUTE FORCE DETECTION:</span> Our AI monitors attempt patterns. Excessive automation triggers permanent lockout.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">03.</span>
                <p><span className="text-purple-400">ACCESS CREDENTIALS:</span> Your UUID is a private key. Guard it like classified intel.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">04.</span>
                <p><span className="text-green-400">SOCIAL ENGINEERING:</span> Play fair, think independently. No collaboration or information sharing.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">05.</span>
                <p><span className="text-cyan-400">REAL-WORLD INTELLIGENCE:</span> Hints exist in the physical world around you. Look beyond the screen.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">06.</span>
                <p><span className="text-blue-400">RATE LIMITING:</span> Failed attempts trigger cooldown periods. Patience is part of the challenge.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">07.</span>
                <p><span className="text-orange-400">SYSTEM INTEGRITY:</span> Any attempt to disrupt other participants results in immediate termination.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">08.</span>
                <p><span className="text-pink-400">COGNITIVE ENHANCEMENT:</span> Think creatively, question everything, but respect the neural protocol.</p>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-900/50 border border-yellow-500/30 rounded-lg">
            <p className="text-center text-yellow-300 font-mono text-sm">
              🧠 <span className="font-bold">REMEMBER:</span> This is a test of intelligence, creativity, and persistence - not technical exploitation. 
              <br />
              <span className="text-gray-400">Violators will be tracked, logged, and permanently banned from the neural network.</span>
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-cyan-300 mb-4 font-mono">
              🚀 READY TO BEGIN YOUR JOURNEY?
            </h2>
            <p className="text-gray-300 mb-6 font-mono">
              Accept the neural protocol guidelines and enter the cognitive enhancement chamber
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => window.location.href = '/'}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-cyan-500 hover:to-purple-500 transform hover:scale-105 transition-all duration-300 flex items-center space-x-3 font-mono shadow-lg shadow-cyan-500/30 border border-cyan-400/30"
              >
                <Play className={`w-5 h-5 ${isHovered ? 'animate-pulse' : ''}`} />
                <span className="text-lg font-semibold">START PUZZLE SEQUENCE</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => window.open('/admin-dashboard-uuid', '_blank')}
                className="bg-gray-800 border border-gray-600 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 hover:border-gray-500 transition-all flex items-center space-x-2 font-mono"
              >
                <Users className="w-4 h-4" />
                <span>PROGRESS DASHBOARD</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3 font-mono flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>⚡ NEURAL INTERFACE INSTRUCTIONS</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-200 font-mono">
              <div>
                <p>• Click &quot;START PUZZLE SEQUENCE&quot; to begin</p>
                <p>• Enter your participant code when prompted</p>
                <p>• Solve puzzles in sequential order</p>
              </div>
              <div>
                <p>• Use hint system if you get stuck</p>
                <p>• Track progress via dashboard link</p>
                <p>• Complete all challenges for maximum enhancement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm font-mono">
          <p>&gt; HUSKEYS ESCAPE COGNITIVE ENHANCEMENT PROTOCOL v2.0</p>
          <p>&gt; Initiated: {new Date().toLocaleDateString()} | Status: ACTIVE</p>
        </div>
      </div>
    </div>
  );
}
