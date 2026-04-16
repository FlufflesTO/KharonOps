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
          { label: "Visible jobs", value: openJobCount, detail: "Service records in scope" },
          { label: "Current status", value: selectedJobStatus, detail: "Live posture" },
          { label: "Reports", value: generatedDocumentCount, detail: "Published documents" },
          { label: "Connection", value: networkOnline ? "Online" : "Offline", detail: "Session availability" }
        ];
      case "admin":
        return [
          { label: "Open jobs", value: openJobCount, detail: "Active records" },
          { label: "Queued mutations", value: queueCount, detail: "Offline changes pending" },
          { label: "Documents in scope", value: generatedDocumentCount, detail: "Loaded history" },
          { label: "Loaded audits", value: adminAuditCount, detail: "Audit trail fetched" }
        ];
      default:
        return [
          { label: "Open jobs", value: openJobCount, detail: "Active records" },
          { label: "Selected status", value: selectedJobStatus, detail: "Current state" },
          { label: "Queued mutations", value: queueCount, detail: "Offline changes pending" },
          { label: "Documents in scope", value: generatedDocumentCount, detail: "Loaded history" }
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
