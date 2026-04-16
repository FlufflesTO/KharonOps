import React, { useEffect, useRef } from "react";

interface GoogleSignInProps {
  clientId: string;
  onLogin: (token: string) => void;
}

export function GoogleSignIn({ clientId, onLogin }: GoogleSignInProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !clientId) return;

    let script = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    
    const mountButton = () => {
      // @ts-expect-error - Google Identity Services types might not be globally available
      if (!window.google?.accounts?.id || !containerRef.current) return;
      
      // @ts-expect-error
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (res: any) => {
          if (res.credential) onLogin(res.credential);
        }
      });
      
      // @ts-expect-error
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "signin_with",
        width: 320
      });
    };

    if (script) {
      // @ts-expect-error
      if (window.google?.accounts?.id) {
        mountButton();
      } else {
        script.addEventListener("load", mountButton);
      }
    } else {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.addEventListener("load", mountButton);
    }

    return () => {
      if (script) {
        script.removeEventListener("load", mountButton);
      }
    };
  }, [clientId, onLogin]);

  return <div ref={containerRef} className="google-signin-slot" style={{ minHeight: "44px" }} />;
}
