import { useCallback, useState } from "react";

function errorMessage(error: unknown): string {
  const typed = error as { error?: { message?: string } };
  return typed.error?.message ?? String(error);
}

function errorCode(error: unknown): string {
  const typed = error as { error?: { code?: string } };
  return typed.error?.code ?? "";
}

export function useActionRunner(setFeedback: (value: string) => void): {
  actionPending: boolean;
  runAction: (action: () => Promise<void>) => void;
} {
  const [actionPending, setActionPending] = useState(false);

  const runAction = useCallback((action: () => Promise<void>): void => {
    if (actionPending) {
      setFeedback("Another action is still running. Wait a moment and retry.");
      return;
    }
    setActionPending(true);
    void action()
      .catch((error) => {
        const code = errorCode(error);
        if (code === "google_transient_error") {
          setFeedback("Google API rate limit reached (429). Wait 30-60 seconds and retry one action at a time.");
          return;
        }
        setFeedback(errorMessage(error));
      })
      .finally(() => {
        setActionPending(false);
      });
  }, [actionPending, setFeedback]);

  return { actionPending, runAction };
}
