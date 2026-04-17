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
  return (
    <div className="portal-auth-shell">
      <a href="/" className="portal-auth-back" aria-label="Back to the website">
        Back to website
      </a>
      <div className="portal-auth-stage">
        <section className="portal-auth-copy">
          <p className="portal-auth-kicker">KHARON OPERATIONAL COMMAND</p>
          <h1>Unified engineering control and compliance workspace.</h1>
          <p>
            This secure environment holds the operational trail for fire detection, suppression, and security work.
            Identity and role-based access protect every schedule, jobcard, report, and published certificate.
          </p>
          <div className="portal-auth-points">
            <div>
              <strong>Verified identity</strong>
              <span>Every session is tied to a provisioned operator profile before any record can be changed.</span>
            </div>
            <div>
              <strong>Controlled workflow</strong>
              <span>Scheduling, closeout, evidence capture, and release stay in one governed operational trail.</span>
            </div>
            <div>
              <strong>Role-specific access</strong>
              <span>Clients, technicians, dispatch, and admin each see the controls that match their responsibility.</span>
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
              <p className="muted-copy">If Google sign-in fails, capture the error and contact the platform administrator.</p>
            </div>
          ) : (
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
                <button className="button button--primary" type="button" onClick={() => onLogin(loginToken)}>
                  Sign in
                </button>
                <button className="button button--secondary" type="button" onClick={onSupportTokenSubmit}>
                  Validate token
                </button>
              </div>

              <div className="quick-login-grid">
                <QuickLoginButton label="dev-client" token="dev-client" onClick={onLogin} />
                <QuickLoginButton label="dev-technician" token="dev-technician" onClick={onLogin} />
                <QuickLoginButton label="dev-dispatcher" token="dev-dispatcher" onClick={onLogin} />
                <QuickLoginButton label="dev-admin" token="dev-admin" onClick={onLogin} />
              </div>
            </>
          )}

          <div className="feedback-panel" aria-live="polite">
            <pre>{feedback}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}

