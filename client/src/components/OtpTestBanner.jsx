import React, { useState } from 'react';
import { KeyRound, Copy, Check, X, Zap } from 'lucide-react';

export const OtpTestBanner = ({ otpCode, onCopy, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!otpCode) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(otpCode);
    setCopied(true);
    if (onCopy) onCopy(otpCode);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-bounce-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-4 shadow-2xl border-2 border-amber-400/80 shadow-amber-500/20 backdrop-blur-xl">
        {/* Stylish ZigZag Decorative Edge Pattern */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
        
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0">
              <Zap className="w-5 h-5 fill-slate-950 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                  TEST OTP CODE
                </span>
              </div>

              {/* Bold Spaced OTP Display */}
              <div className="mt-1 flex items-center gap-1 font-mono text-2xl font-black tracking-wider text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {otpCode.split('').map((char, index) => (
                  <span
                    key={index}
                    className="w-7 h-8 bg-slate-800/90 border border-amber-400/50 rounded-lg flex items-center justify-center text-amber-300"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0"
              title="Copy OTP Code"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-800" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy OTP
                </>
              )}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpTestBanner;
