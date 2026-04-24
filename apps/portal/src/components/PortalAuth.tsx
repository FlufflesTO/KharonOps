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
      {isLoggingIn ? "Auth..." : label}
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
      <div className="ambient-background"></div>
      <div className="portal-auth-container relative z-10 w-full max-w-md p-4">
        <header className="portal-auth-header text-center mb-8">
          <div className="portal-mark-large inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4 glow-primary">
            <svg viewBox="0 0 100 100" width="36" height="36" aria-hidden="true">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
              <circle cx="50" cy="50" r="25" fill="currentColor" opacity="0.4" />
              <circle cx="50" cy="50" r="12" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">KharonOps</h1>
          <p className="text-muted text-sm">Constitutional Governance Platform</p>
        </header>

        <main className="portal-auth-card glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="glow-accent-top"></div>
          <div className="auth-card-content relative z-10">
            <h2 className="text-xl font-semibold mb-1 text-white">Sign In</h2>
            <p className="auth-subtitle text-sm text-muted mb-8">
              Secure access to your operational workspace.
            </p>

            {showGoogleSignIn ? (
              <div className="auth-action-stack">
                <GoogleSignIn clientId={authConfig?.google_client_id ?? ""} onLogin={onLogin} />
                <p className="auth-help-hint text-xs text-muted mt-4 text-center">
                  Use your corporate identity to authenticate.
                </p>
              </div>
            ) : showDevTokens ? (
              <div className="auth-dev-stack flex flex-col gap-6">
                <label className="field-stack">
                  <span className="field-label text-xs uppercase tracking-wider text-muted mb-1 block">Security Token</span>
                  <input
                    id="portal-login-token"
                    name="portal_login_token"
                    className="enhanced-input w-full"
                    value={loginToken}
                    onChange={(event) => setLoginToken(event.target.value)}
                    placeholder="Enter bypass token"
                  />
                </label>

                <div className="button-row flex gap-3">
                  <button 
                    className={`button button--large flex-1 ${isSubmitting ? "button--loading" : "button--primary"}`} 
                    type="button" 
                    onClick={() => {
                      setIsSubmitting(true);
                      setTimeout(() => onLogin(loginToken), 600);
                    }}
                    disabled={isSubmitting || !loginToken.trim()}
                  >
                    {isSubmitting ? "Authenticating..." : "Authenticate"}
                  </button>
                </div>

                <div className="quick-login-wrapper pt-4 border-t border-white/5">
                  <p className="text-xs uppercase text-muted mb-3 text-center tracking-wider">Developer Fast Auth</p>
                  <div className="quick-login-grid grid grid-cols-3 gap-2">
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
              <div className="auth-action-stack text-center py-4">
                <div className="loader-spinner mb-4 inline-block"></div>
                <p className="auth-help-hint text-sm text-muted">
                  Establishing secure connection...
                </p>
              </div>
            )}

            {feedback && (
              <div className="auth-feedback mt-6 p-3 rounded-lg bg-critical/10 border border-critical/20 text-critical text-sm text-center animate-shake" aria-live="polite">
                {feedback}
              </div>
            )}
          </div>
        </main>
        
        <footer className="auth-card-footer mt-8 text-center">
          <button 
            type="button" 
            className="text-xs text-muted hover:text-white transition-colors underline-offset-4 hover:underline" 
            onClick={() => setShowHelp(!showHelp)}
          >
            Need help signing in?
          </button>
          
          {showHelp && (
            <div className="auth-help-expanded mt-4 p-4 rounded-lg bg-white/5 border border-white/10 text-sm text-muted animate-fade-in">
              <p>Contact the office for account support or to reset your permissions.</p>
            </div>
          )}
        </footer>
      </div>

      <style>{`
        .ambient-background { position: absolute; inset: 0; background: radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.15), transparent 60%); z-index: 0; }
        .glass-panel { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .glow-primary { box-shadow: 0 0 40px rgba(99, 102, 241, 0.4); }
        .glow-accent-top { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--color-primary), transparent); opacity: 0.5; }
        .enhanced-input { padding: 1rem 1.25rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); color: white; font-family: var(--font-mono); font-size: 0.95rem; transition: all 0.2s; }
        .enhanced-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(99,102,241,0.2); background: rgba(0,0,0,0.5); }
        .button--large { padding: 1rem; font-size: 1.1rem; font-weight: 600; border-radius: var(--radius-md); transition: all var(--transition-fast); }
        .button--loading { opacity: 0.8; cursor: wait; }
        .quick-login-btn { padding: 0.5rem; font-size: 0.8rem; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); }
        .quick-login-btn:hover { background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.3); color: white; }
        .loader-spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
        .bg-primary\\\\/20 { background-color: rgba(99, 102, 241, 0.2); }
        .text-primary { color: var(--color-primary); }
        .text-critical { color: var(--color-critical); }
        .bg-critical\\\\/10 { background-color: rgba(239, 68, 68, 0.1); }
        .border-critical\\\\/20 { border-color: rgba(239, 68, 68, 0.2); }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Flex/Grid Utilities */
        .flex { display: flex; } .flex-col { flex-direction: column; } .items-center { align-items: center; } .justify-center { justify-content: center; }
        .gap-2 { gap: 0.5rem; } .gap-3 { gap: 0.75rem; } .gap-6 { gap: 1.5rem; }
        .grid { display: grid; } .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .min-h-screen { min-height: 100vh; } .w-full { width: 100%; } .max-w-md { max-width: 28rem; }
        .relative { position: relative; } .absolute { position: absolute; } .z-10 { z-index: 10; }
        .overflow-hidden { overflow: hidden; }
        .p-3 { padding: 0.75rem; } .p-4 { padding: 1rem; } .p-8 { padding: 2rem; } .py-4 { padding-top: 1rem; padding-bottom: 1rem; } .pt-4 { padding-top: 1rem; }
        .mb-1 { margin-bottom: 0.25rem; } .mb-2 { margin-bottom: 0.5rem; } .mb-3 { margin-bottom: 0.75rem; } .mb-4 { margin-bottom: 1rem; } .mb-8 { margin-bottom: 2rem; } .mt-4 { margin-top: 1rem; } .mt-6 { margin-top: 1.5rem; } .mt-8 { margin-top: 2rem; }
        .text-center { text-align: center; }
        .text-white { color: white; } .text-muted { color: var(--color-text-muted); }
        .text-xs { font-size: 0.75rem; } .text-sm { font-size: 0.875rem; } .text-xl { font-size: 1.25rem; } .text-3xl { font-size: 1.875rem; }
        .font-bold { font-weight: 700; } .font-semibold { font-weight: 600; }
        .tracking-tight { letter-spacing: -0.025em; } .tracking-wider { letter-spacing: 0.05em; }
        .uppercase { text-transform: uppercase; } .block { display: block; } .inline-block { display: inline-block; } .inline-flex { display: inline-flex; }
        .rounded-full { border-radius: 9999px; } .rounded-lg { border-radius: var(--radius-lg); } .rounded-2xl { border-radius: 1rem; }
        .border { border-width: 1px; border-style: solid; } .border-t { border-top-width: 1px; border-style: solid; }
        .border-white\\\\/5 { border-color: rgba(255,255,255,0.05); } .border-white\\\\/10 { border-color: rgba(255,255,255,0.1); }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .hover\\\\:text-white:hover { color: white; } .hover\\\\:underline:hover { text-decoration-line: underline; } .underline-offset-4 { text-underline-offset: 4px; } .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
      `}</style>
    </div>
  );
}
