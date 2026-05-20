export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center
                    bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300
                    dark:from-gray-950 dark:via-slate-900 dark:to-gray-950">

      {/* Orbs — hidden on mobile to save GPU */}
      <div className="hidden sm:block absolute w-96 h-96 rounded-full bg-blue-400/10 dark:bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="hidden sm:block absolute w-64 h-64 rounded-full bg-violet-400/10 dark:bg-violet-500/10 blur-[80px] pointer-events-none translate-x-32 translate-y-16" />

      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 128 128" style={{ animationDuration: "1.4s" }}>
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0" />
              <stop offset="40%"  stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r="58" fill="none" stroke="url(#g1)"
            strokeWidth="5" strokeLinecap="round" strokeDasharray="240 125" />
        </svg>

        {/* Second ring — hidden on mobile for performance */}
        <svg className="hidden sm:block absolute inset-0 w-full h-full" viewBox="0 0 128 128"
          style={{ animation: "spin-reverse 2.2s linear infinite" }}>
          <defs>
            <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#ec4899" stopOpacity="0" />
              <stop offset="60%"  stopColor="#ec4899" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r="48" fill="none" stroke="url(#g2)"
            strokeWidth="3" strokeLinecap="round" strokeDasharray="140 160" />
        </svg>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="J Pintuexpress"
          className="w-16 h-16 object-contain rounded-2xl drop-shadow-lg"
          style={{ animation: "logo-pulse 1.8s ease-in-out infinite" }} />
      </div>

      <p className="mt-8 text-lg font-bold text-gray-800 dark:text-gray-200 tracking-wide">
        J Pintuexpress
      </p>

      <div className="mt-3 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"
            style={{ animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>

      <style>{`
        @keyframes spin-reverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes logo-pulse { 0%, 100% { opacity: 0.85; transform: scale(0.97); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
