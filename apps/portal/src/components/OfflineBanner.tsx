import React from "react";

interface OfflineBannerProps {
  networkOnline: boolean;
  queueCount: number;
  onReplay: () => void;
  actionPending: boolean;
}

export function OfflineBanner({
  networkOnline,
  queueCount,
  onReplay,
  actionPending
}: OfflineBannerProps): React.JSX.Element {
  if (networkOnline && queueCount === 0) {
    return (
      <div className="status-bar status-bar--online">
        <span className="dot dot--online" />
        Connected to Kharon API. Session is live.
      </div>
    );
  }

  if (!networkOnline) {
    return (
      <div className="status-bar status-bar--offline">
        <span className="dot dot--offline" />
        Offline. Mutations are queued locally and will replay when connectivity returns.
        {queueCount > 0 && <strong> ({queueCount} pending)</strong>}
      </div>
    );
  }

  return (
    <div className="status-bar status-bar--warning">
      <span className="dot dot--warning" />
      {queueCount} mutations are queued locally.
      <button 
        className="button button--small button--ghost" 
        onClick={onReplay}
        disabled={actionPending}
      >
        {actionPending ? "Replaying..." : "Replay now"}
      </button>
    </div>
  );
}
