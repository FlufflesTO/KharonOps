import React from "react";
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
    <button className="button button--ghost" onClick={() => onClick(token)}>
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
  return (
    <div className="portal-auth-shell">
      {/* Back to website — minimal top-left link so users can exit without a hard back navigation */}
      <a href="/" className="portal-auth-back" aria-label="Back to Kharon website">
        ← kharon.co.za
      </a>
      <div className="portal-auth-stage">
        <section className="portal-auth-copy">
          <p className="portal-auth-kicker">KHARON OPERATIONAL COMMAND</p>
          <h1>Unified engineering control and compliance workspace.</h1>
          <p>
            This secure environment provides the authoritative operational trail for fire detection, suppression, 
            and security installations. Identity and role-based access are strictly enforced to ensure the 
            integrity of every SANS-aligned certification.
          </p>
          <div className="portal-auth-points">
            <div>
              <strong>Formal Verification</strong>
              <span>Every session is anchored to verified identity to ensure the fidelity of audit logs and certificates.</span>
            </div>
            <div>
              <strong>Governed Operational Flow</strong>
              <span>Schedules, jobcards, reports, and site evidence are managed within a single mission-critical trail.</span>
            </div>
            <div>
              <strong>Strategic Workspaces</strong>
              <span>Tailored command interfaces for Clients (visibility), Technicians (execution), and Dispatch (oversight).</span>
            </div>
          </div>
        </section>


        <section className="portal-auth-card">
          <div className="panel-heading">
            <p className="panel-eyebrow">Sign in</p>
            <h2>Portal access</h2>
          </div>

          {productionAuth ? (
            <div className="field-stack">
              <span>Sign in with a provisioned Google account</span>
              <GoogleSignIn clientId={authConfig?.google_client_id ?? ""} onLogin={onLogin} />
            </div>
          ) : null}

          {!productionAuth ? (
            <>
              <label className="field-stack">
                <span>Google ID token or local development token</span>
                <input
                  id="portal-login-token"
                  name="portal_login_token"
                  value={loginToken}
                  onChange={(event) => setLoginToken(event.target.value)}
                  placeholder="Paste token or use a quick token below"
                />
              </label>

              <div className="button-row">
                <button className="button button--primary" onClick={() => onLogin(loginToken)}>
                  Sign in
                </button>
              </div>

              <div className="quick-login-grid">
                <QuickLoginButton label="dev-client" token="dev-client" onClick={onLogin} />
                <QuickLoginButton label="dev-technician" token="dev-technician" onClick={onLogin} />
                <QuickLoginButton label="dev-dispatcher" token="dev-dispatcher" onClick={onLogin} />
                <QuickLoginButton label="dev-admin" token="dev-admin" onClick={onLogin} />
              </div>
            </>
          ) : (
            <details className="support-details">
              <summary>Diagnostic token input</summary>
              <label className="field-stack">
                <span>Paste a raw Google ID token JWT for diagnostics only</span>
                <input
                  id="portal-support-token"
                  name="portal_support_token"
                  value={loginToken}
                  onChange={(event) => setLoginToken(event.target.value)}
                  placeholder="eyJhbGciOiJSUzI1NiIs..."
                />
              </label>
              <p className="muted-copy">
                This is not your Google account email or session. Production login should happen from the Google button above.
              </p>
              <div className="button-row">
                <button className="button button--secondary" onClick={onSupportTokenSubmit}>
                  Submit token
                </button>
              </div>
            </details>
          )}

          <div className="feedback-panel">
            <pre>{feedback}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
