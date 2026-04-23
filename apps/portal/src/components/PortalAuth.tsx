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
  return (
    <button className="button button--ghost" type="button" onClick={() => onClick(token)}>
      {label}
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
  const showGoogleSignIn = productionAuth && Boolean(authConfig?.google_client_id);
  const showDevTokens = authConfig?.dev_tokens_enabled === true;

  return (
    <div className="portal-auth-shell">
      <div className="portal-auth-container">
        <header className="portal-auth-header">
          <div className="portal-logo">KHARON</div>
        </header>

        <main className="portal-auth-card">
          <div className="auth-card-content">
            <h1>Sign in to KharonOps</h1>
            <p className="auth-subtitle">
              Secure access to your work, tools, and team.
            </p>

            {showGoogleSignIn ? (
              <div className="auth-action-stack">
                <GoogleSignIn clientId={authConfig?.google_client_id ?? ""} onLogin={onLogin} />
                <p className="auth-help-hint">
                  Use your company Google account to continue.
                </p>
              </div>
            ) : showDevTokens ? (
              <div className="auth-dev-stack">
                <label className="field-stack">
                  <span className="field-label">Development Token</span>
                  <input
                    id="portal-login-token"
                    name="portal_login_token"
                    className="input-field"
                    value={loginToken}
                    onChange={(event) => setLoginToken(event.target.value)}
                    placeholder="Paste token or use a quick token below"
                  />
                </label>

                <div className="button-row">
                  <button className="button button--primary" type="button" onClick={() => onLogin(loginToken)}>
                    Sign in
                  </button>
                  <button className="button button--secondary" type="button" onClick={onSupportTokenSubmit}>
                    Validate
                  </button>
                </div>

                <div className="quick-login-grid">
                  <QuickLoginButton label="client" token="dev-client" onClick={onLogin} />
                  <QuickLoginButton label="tech" token="dev-technician" onClick={onLogin} />
                  <QuickLoginButton label="dispatch" token="dev-dispatcher" onClick={onLogin} />
                  <QuickLoginButton label="finance" token="dev-finance" onClick={onLogin} />
                  <QuickLoginButton label="admin" token="dev-admin" onClick={onLogin} />
                </div>
              </div>
            ) : (
              <div className="auth-action-stack">
                <p className="auth-help-hint">
                  Sign-in options are still loading. Refresh the page if this does not clear within a few seconds.
                </p>
              </div>
            )}

            {feedback && (
              <div className="auth-feedback" aria-live="polite">
                {feedback}
              </div>
            )}
          </div>

          <footer className="auth-card-footer">
            <button 
              type="button" 
              className="link-button" 
              onClick={() => setShowHelp(!showHelp)}
            >
              Need help signing in?
            </button>
            
            {showHelp && (
              <div className="auth-help-expanded">
                <p>Contact the office for account support or to reset your permissions.</p>
              </div>
            )}
          </footer>
        </main>
        
        <div className="auth-external-links">
          <a href="/" className="auth-back-link">
            Back to website
          </a>
        </div>
      </div>
    </div>
  );
}
