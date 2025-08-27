'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function ComingSoonPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black bg-gradient-to-br from-gray-900 via-black to-blue-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo/Symbol */}
          <div className="mb-8 animate-float">
            <Image
              src="/symbol-positive.svg"
              alt="Enigma Hub Symbol"
              width={200}
              height={200}
              className="mx-auto drop-shadow-2xl filter drop-shadow-[0_0_30px_rgba(0,255,255,0.3)]"
              priority
            />
          </div>

          {/* Main heading */}
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 mb-6 font-mono tracking-wider animate-pulse">
            HUSKEYS ESCAPE
          </h1>

          {/* Subtitle */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl text-cyan-300 mb-4 font-mono tracking-wide">
              COMING SOON
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto rounded-full shadow-lg shadow-cyan-500/50"></div>
          </div>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed font-mono">
            Prepare your mind for the ultimate puzzle challenge. 
            <br />
            <span className="text-cyan-400">Interactive riddles</span> await those brave enough to enter.
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="bg-gray-900/50 border border-cyan-500/30 rounded-lg p-6 backdrop-blur-sm shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all duration-300">
              <div className="text-cyan-400 text-3xl mb-3">🧩</div>
              <h3 className="text-cyan-300 font-semibold mb-2 font-mono">MIND BENDING</h3>
              <p className="text-gray-400 text-sm font-mono">Complex puzzles that challenge your thinking</p>
            </div>
            
            <div className="bg-gray-900/50 border border-blue-500/30 rounded-lg p-6 backdrop-blur-sm shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300">
              <div className="text-blue-400 text-3xl mb-3">⚡</div>
              <h3 className="text-blue-300 font-semibold mb-2 font-mono">REAL-TIME</h3>
              <p className="text-gray-400 text-sm font-mono">Instant feedback and progression tracking</p>
            </div>
            
            <div className="bg-gray-900/50 border border-purple-500/30 rounded-lg p-6 backdrop-blur-sm shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300">
              <div className="text-purple-400 text-3xl mb-3">🔐</div>
              <h3 className="text-purple-300 font-semibold mb-2 font-mono">SECURE</h3>
              <p className="text-gray-400 text-sm font-mono">Protected access with advanced encryption</p>
            </div>
          </div>

          {/* Launch notification */}
          <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/50 rounded-lg p-6 mb-8 backdrop-blur-sm shadow-lg shadow-cyan-500/20">
            <h3 className="text-cyan-300 font-semibold mb-2 font-mono">🚀 LAUNCHING SOON</h3>
            <p className="text-gray-300 font-mono">
              The system is currently in final calibration phase. 
              <br />
              <span className="text-cyan-400">Authorized personnel</span> can access the beta using their UUID credentials.
            </p>
          </div>

          {/* Access instructions */}
          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-yellow-500/30 rounded-lg p-4 backdrop-blur-sm">
              <h4 className="text-yellow-300 font-semibold mb-2 font-mono">🔑 AUTHORIZED ACCESS</h4>
              <p className="text-gray-300 font-mono text-sm">
                If you have a valid UUID, add it to the URL:
              </p>
              <div className="mt-2 p-2 bg-gray-800 rounded font-mono text-sm">
                <span className="text-gray-500">https://yoursite.com</span>
                <span className="text-cyan-400">?uuid=your-uuid-here</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-gray-800">
            <p className="text-gray-500 text-sm font-mono">
              © 2025 Huskeys Escape Challenge Platform. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
