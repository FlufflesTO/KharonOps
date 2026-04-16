import React from "react";
import type { Role } from "@kharon/domain";

type SummaryCardProps = {
  label: string;
  value: string | number;
  detail: string;
};

function SummaryCard({ label, value, detail }: SummaryCardProps): React.JSX.Element {
  return (
    <article className="summary-card">
      <span className="summary-card__label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

interface SummaryBoardProps {
  role: Role;
  openJobCount: number;
  selectedJobStatus: string;
  queueCount: number;
  generatedDocumentCount: number;
  adminAuditCount: number;
  networkOnline: boolean;
}

export function SummaryBoard({
  role,
  openJobCount,
  selectedJobStatus,
  queueCount,
  generatedDocumentCount,
  adminAuditCount,
  networkOnline
}: SummaryBoardProps): React.JSX.Element {
  const cards = React.useMemo(() => {
    switch (role) {
      case "client":
        return [
          { label: "Visible jobs", value: openJobCount, detail: "Service records available to this client context" },
          { label: "Current status", value: selectedJobStatus, detail: "Live posture of the selected record" },
          { label: "Reports", value: generatedDocumentCount, detail: "Published or generated rows currently in scope" },
          { label: "Connection", value: networkOnline ? "Online" : "Offline", detail: "Scheduling and visibility posture for this session" }
        ];
      case "admin":
        return [
          { label: "Open jobs", value: openJobCount, detail: "Statuses excluding completed and cancelled" },
          { label: "Queued mutations", value: queueCount, detail: "Offline-safe changes waiting for replay" },
          { label: "Documents in scope", value: generatedDocumentCount, detail: "History rows loaded for current context" },
          { label: "Loaded audits", value: adminAuditCount, detail: "Audit entries fetched into this session" }
        ];
      default:
        return [
          { label: "Open jobs", value: openJobCount, detail: "Statuses excluding completed and cancelled" },
          { label: "Selected status", value: selectedJobStatus, detail: "Current state of the active job context" },
          { label: "Queued mutations", value: queueCount, detail: "Offline-safe changes waiting for replay" },
          { label: "Documents in scope", value: generatedDocumentCount, detail: "History rows loaded for current context" }
        ];
    }
  }, [role, openJobCount, selectedJobStatus, queueCount, generatedDocumentCount, adminAuditCount, networkOnline]);

  return (
    <section className="summary-grid">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </section>
  );
}
