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
          { label: "Active jobs", value: openJobCount, detail: "Current service work" },
          { label: "Selected job", value: selectedJobStatus, detail: "Latest status" },
          { label: "Files", value: generatedDocumentCount, detail: "Published reports" },
          { label: "Connection", value: networkOnline ? "Online" : "Offline", detail: "Portal session" }
        ];
      case "admin":
        return [
          { label: "Open jobs", value: openJobCount, detail: "Work in progress" },
          { label: "Queued changes", value: queueCount, detail: "Waiting to sync" },
          { label: "Files loaded", value: generatedDocumentCount, detail: "Current history" },
          { label: "Audit entries", value: adminAuditCount, detail: "Loaded this session" }
        ];
      case "finance":
        return [
          { label: "Billable jobs", value: openJobCount, detail: "Open finance items" },
          { label: "Selected job", value: selectedJobStatus, detail: "Current stage" },
          { label: "Files in scope", value: generatedDocumentCount, detail: "Generated and published" },
          { label: "Connection", value: networkOnline ? "Online" : "Offline", detail: "Portal session" }
        ];
      default:
        return [
          { label: "Open jobs", value: openJobCount, detail: "Work in progress" },
          { label: "Selected job", value: selectedJobStatus, detail: "Current status" },
          { label: "Queued changes", value: queueCount, detail: "Waiting to sync" },
          { label: "Files in scope", value: generatedDocumentCount, detail: "Loaded history" }
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
