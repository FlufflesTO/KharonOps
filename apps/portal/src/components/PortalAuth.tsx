/**
 * KharonOps - Constitutional Gateway
 * Purpose: Level 4 Platform Entry Point and Authentication Hardening
 * Dependencies: auth-hardened.css, GoogleSignIn.tsx
 * Structural Role: Secure front-door for all Kharon operational roles.
 */

import React, { useState } from "react";
import type { PortalAuthConfig } from "../apiClient";
import { GoogleSignIn } from "./GoogleSignIn";

interface PortalAuthProps {
  authConfig: PortalAuthConfig | null;
  productionAuth: boolean;
  loginToken: string;
  setLoginToken: (token: string) => void;
  onLogin: (token: string) => void;
  onSupportTokenSubmit: () => void;
  feedback: string;
}

function QuickLoginButton({ label, token, onClick }: { label: string; token: string; onClick: (token: string) => void }): React.JSX.Element {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  return (
    <button 
      className={`button button--ghost quick-login-btn ${isLoggingIn ? "button--loading" : ""}`} 
      type="button" 
      onClick={() => {
        setIsLoggingIn(true);
        setTimeout(() => onClick(token), 400);
      }}
      disabled={isLoggingIn}
    >
      {isLoggingIn ? "AUTH..." : label}
    </button>
  );
}

export function PortalAuth({
  authConfig,
  productionAuth,
  loginToken,
  setLoginToken,
  onLogin,
  onSupportTokenSubmit,
  feedback
}: PortalAuthProps): React.JSX.Element {
  const [showHelp, setShowHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showGoogleSignIn = productionAuth && Boolean(authConfig?.google_client_id);
  const showDevTokens = authConfig?.dev_tokens_enabled === true;

  return (
    <div className="portal-auth-shell flex items-center justify-center min-h-screen relative overflow-hidden">
      {/* Visual Depth Elements */}
      <div className="light-orb" style={{ background: 'var(--color-primary-light)', top: '10%', left: '10%' }}></div>
      <div className="light-orb" style={{ background: 'var(--color-secondary)', bottom: '10%', right: '10%', animationDelay: '-10s' }}></div>
      
      <div className="portal-auth-container relative z-10 w-full max-w-md p-6">
        <header className="portal-auth-header text-center mb-12 animate-fade-in">
          <div className="portal-mark-large inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/5 text-primary mb-8 glow-primary backdrop-blur-2xl border border-white/10 rotate-3 transition-transform hover:rotate-0 duration-700">
            <svg viewBox="0 0 100 100" width="48" height="48" aria-hidden="true" className="drop-shadow-glow">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="15 8" />
              <path d="M50 20 L50 80 M20 50 L80 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <circle cx="50" cy="50" r="12" fill="currentColor" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            </svg>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-3">KHARON<span className="text-primary-light">OPS</span></h1>
          <div className="login-status justify-center">
            <div className="login-status__dot"></div>
            <span>CONSTITUTIONAL_GATEWAY_V4.2</span>
          </div>
        </header>

        <main className="auth-terminal p-1 p-px">
          <div className="bg-[#020617]/90 rounded-[1.9rem] p-10 relative z-10">
            <header className="mb-10">
              <h2 className="text-2xl font-bold text-white tracking-tight">Identity Verification</h2>
              <p className="text-sm text-muted mt-2">Enter your credentials to establish a secure session.</p>
            </header>

            {showGoogleSignIn ? (
              <div className="auth-action-stack">
                <GoogleSignIn clientId={authConfig?.google_client_id ?? ""} onLogin={onLogin} />
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted mt-8 text-center opacity-40 font-bold">
                  Enterprise SSO Integration Active
                </p>
              </div>
            ) : showDevTokens ? (
              <div className="auth-dev-stack flex flex-col gap-8">
                <label className="field-stack">
                  <span className="text-[10px] uppercase tracking-widest text-muted font-bold mb-3 block">Bypass Security Token</span>
                  <input
                    id="portal-login-token"
                    className="enhanced-input w-full shadow-inner"
                    value={loginToken}
                    onChange={(event) => setLoginToken(event.target.value)}
                    placeholder="SHA-256 Protocol Token"
                  />
                </label>

                <button 
                  className={`button button--large w-full ${isSubmitting ? "button--loading" : "button--primary shadow-glow"}`} 
                  type="button" 
                  onClick={() => {
                    setIsSubmitting(true);
                    setTimeout(() => onLogin(loginToken), 800);
                  }}
                  disabled={isSubmitting || !loginToken.trim()}
                >
                  {isSubmitting ? "AUTHORIZING..." : "INITIALIZE SESSION"}
                </button>

                <div className="quick-login-wrapper pt-8 border-t border-white/5">
                  <p className="text-[10px] uppercase text-muted mb-4 text-center tracking-[0.2em] font-bold opacity-50">Role Emulation Matrix</p>
                  <div className="grid grid-cols-3 gap-3">
                    <QuickLoginButton label="Client" token="dev-client" onClick={onLogin} />
                    <QuickLoginButton label="Tech" token="dev-technician" onClick={onLogin} />
                    <QuickLoginButton label="Dispatch" token="dev-dispatcher" onClick={onLogin} />
                    <QuickLoginButton label="Finance" token="dev-finance" onClick={onLogin} />
                    <QuickLoginButton label="Admin" token="dev-admin" onClick={onLogin} />
                    <QuickLoginButton label="Super" token="dev-super-admin" onClick={onLogin} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="auth-action-stack text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                <p className="text-sm font-mono text-muted tracking-widest animate-pulse">Establishing Peer Link...</p>
              </div>
            )}

            {feedback && (
              <div className="auth-feedback mt-8 p-4 rounded-xl bg-critical/10 border border-critical/20 text-critical text-xs font-bold text-center animate-shake" aria-live="polite">
                CRITICAL_ERROR: {feedback.toUpperCase()}
              </div>
            )}
          </div>
        </main>
        
        <footer className="auth-card-footer mt-10 text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <button 
            type="button" 
            className="text-[10px] uppercase tracking-widest text-muted hover:text-white transition-all duration-300 font-bold" 
            onClick={() => setShowHelp(!showHelp)}
          >
            Terminal Connection Issues?
          </button>
          
          {showHelp && (
            <div className="auth-help-expanded mt-6 p-5 rounded-2xl bg-white/5 border border-white/10 text-xs text-muted/80 leading-relaxed shadow-xl animate-fade-in">
              <p>Contact the Operational Command Center for account synchronization or to reset your fiduciary permissions.</p>
            </div>
          )}
        </footer>
      </div>

      <style>{`
        .glow-primary { box-shadow: 0 0 80px rgba(99, 102, 241, 0.2); }
        .shadow-glow { box-shadow: 0 0 30px var(--color-primary-light); }
        .drop-shadow-glow { filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.6)); }
        
        .enhanced-input { 
          padding: 1.25rem; 
          background: rgba(0,0,0,0.4); 
          border: 1px solid rgba(255,255,255,0.05); 
          border-radius: 1rem; 
          color: white; 
          font-family: var(--font-mono); 
          font-size: 0.9rem; 
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .enhanced-input:focus { 
          outline: none; 
          border-color: var(--color-primary-light); 
          box-shadow: 0 0 0 4px rgba(99,102,241,0.1); 
          background: rgba(0,0,0,0.6); 
          transform: translateY(-1px);
        }
        
        .button--primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          padding: 1.25rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          border-radius: 1rem;
        }
        
        .quick-login-btn { 
          padding: 0.75rem; 
          font-size: 0.65rem; 
          font-weight: 800;
          letter-spacing: 0.05em;
          border-radius: 0.75rem; 
          border: 1px solid rgba(255,255,255,0.05); 
          background: rgba(255,255,255,0.02); 
          transition: all 0.3s;
        }
        .quick-login-btn:hover { 
          background: rgba(255, 255, 255, 0.08); 
          border-color: rgba(255, 255, 255, 0.15); 
          color: white; 
          transform: translateY(-2px);
        }
        
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}
