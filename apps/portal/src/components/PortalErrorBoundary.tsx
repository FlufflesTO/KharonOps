import React from "react";

interface PortalErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (message: string) => void;
}

interface PortalErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class PortalErrorBoundary extends React.Component<PortalErrorBoundaryProps, PortalErrorBoundaryState> {
  state: PortalErrorBoundaryState = {
    hasError: false,
    message: ""
  };

  static getDerivedStateFromError(error: unknown): PortalErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unknown portal error"
    };
  }

  componentDidCatch(error: unknown): void {
    const message = error instanceof Error ? error.message : "Unknown portal error";
    this.props.onError?.(`Portal workspace failed to render: ${message}`);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <section className="workspace-card">
          <div className="panel-heading">
            <p className="panel-eyebrow">Portal recovery</p>
            <h2>Workspace unavailable</h2>
          </div>
          <div className="highlight-box">
            <p>The current workspace could not be rendered safely.</p>
            <p className="muted-copy">{this.state.message}</p>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
