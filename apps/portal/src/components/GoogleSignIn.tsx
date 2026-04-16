/**
 * KharonOps Portal - GoogleSignIn Component
 * Purpose: Self-contained Google Identity Services (GSI) sign-in button.
 *          Manages script injection and prevents duplicate initialize calls.
 */
import React, { useEffect, useRef } from "react";

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

interface GoogleSignInProps {
  clientId: string;
  onLogin: (token: string) => void;
}

let gsiScriptLoadPromise: Promise<void> | null = null;

function ensureGsiScriptLoaded(): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (gsiScriptLoadPromise) {
    return gsiScriptLoadPromise;
  }

  gsiScriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    const script = existingScript ?? document.createElement("script");

    const onLoad = () => {
      resolve();
    };

    const onError = () => {
      gsiScriptLoadPromise = null;
      reject(new Error("Failed to load Google Identity Services script."));
    };

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    if (!existingScript) {
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return gsiScriptLoadPromise;
}

let globalGsiInitialized = false;
let globalGsiClientId: string | null = null;

export function GoogleSignIn({ clientId, onLogin }: GoogleSignInProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initializationLockRef = useRef(false);
  const onLoginRef = useRef(onLogin);

  useEffect(() => {
    onLoginRef.current = onLogin;
  }, [onLogin]);

  useEffect(() => {
    if (!clientId) {
      return;
    }

    let active = true;

    const mountButton = async () => {
      await ensureGsiScriptLoaded();
      if (!active) {
        return;
      }

      const gsi = window.google?.accounts?.id;
      const container = containerRef.current;
      if (!gsi || !container) {
        return;
      }

      // Global lock to prevent "google.accounts.id.initialize() is called multiple times" warning.
      // This is necessary because GSI initialization is a singleton on the window object.
      if (!initializationLockRef.current) {
        if (!globalGsiInitialized || globalGsiClientId !== clientId) {
          gsi.initialize({
            client_id: clientId,
            callback: (res: GsiCredentialResponse) => {
              if (res.credential) {
                onLoginRef.current(res.credential);
              }
            }
          });
          globalGsiInitialized = true;
          globalGsiClientId = clientId;
        }
        initializationLockRef.current = true;
      }

      container.replaceChildren();
      gsi.renderButton(container, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "signin_with",
        width: 320
      });
    };

    void mountButton();

    return () => {
      active = false;
    };
  }, [clientId]);

  return <div ref={containerRef} className="google-signin-slot" style={{ minHeight: "44px" }} />;
}
