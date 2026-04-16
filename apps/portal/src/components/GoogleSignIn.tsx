/**
 * KharonOps Portal - GoogleSignIn Component
 * Purpose: Self-contained Google Identity Services (GSI) sign-in button.
 *          Manages its own script injection lifecycle to prevent de-sync on
 *          React re-renders that plagued the previous App.tsx-level approach.
 * Dependencies: Google Identity Services (GSI) loaded on demand.
 * Structural Role: Leaf component rendered inside PortalAuth.
 */
import React, { useEffect, useRef } from "react";

// ─── Ambient type declarations for GSI SDK ────────────────────────────────────
// These are not shipped as a first-party @types package. We declare the minimal
// surface we consume rather than installing an unofficial third-party typings
// package, keeping the type surface explicit and auditable.

interface GsiCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GsiButtonConfig {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  shape?: "rectangular" | "pill" | "circle" | "square";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  width?: number;
}

interface GsiInitConfig {
  client_id: string;
  callback: (response: GsiCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleAccountsId {
  initialize: (config: GsiInitConfig) => void;
  renderButton: (container: HTMLElement, config: GsiButtonConfig) => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface GoogleSignInProps {
  clientId: string;
  onLogin: (token: string) => void;
}

export function GoogleSignIn({ clientId, onLogin }: GoogleSignInProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !clientId) return;

    const container = containerRef.current;

    const mountButton = () => {
      const gsi = window.google?.accounts?.id;
      if (!gsi || !container) return;

      gsi.initialize({
        client_id: clientId,
        callback: (res: GsiCredentialResponse) => {
          if (res.credential) onLogin(res.credential);
        }
      });

      gsi.renderButton(container, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "signin_with",
        width: 320
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      // Script already in DOM — GSI may or may not have initialised yet.
      if (window.google?.accounts?.id) {
        mountButton();
      } else {
        existingScript.addEventListener("load", mountButton);
        return () => {
          existingScript.removeEventListener("load", mountButton);
        };
      }
    } else {
      // Inject the GSI script for the first time.
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.addEventListener("load", mountButton);
      return () => {
        script.removeEventListener("load", mountButton);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  return <div ref={containerRef} className="google-signin-slot" style={{ minHeight: "44px" }} />;
}
