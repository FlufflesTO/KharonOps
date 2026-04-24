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
  syncPulseText: string;
}

export function SummaryBoard({
  role,
  openJobCount,
  selectedJobStatus,
  queueCount,
  generatedDocumentCount,
  adminAuditCount,
  networkOnline,
  syncPulseText
}: SummaryBoardProps): React.JSX.Element {
  const cards = React.useMemo(() => {
    switch (role) {
      case "client":
        return [
          { label: "Active jobs", value: openJobCount, detail: "Current service work" },
          { label: "Selected job", value: selectedJobStatus, detail: "Latest status" },
          { label: "Files", value: generatedDocumentCount, detail: "Published reports" },
          { label: "Connection", value: networkOnline ? "Online" : "Offline", detail: syncPulseText }
        ];
      case "admin":
        return [
          { label: "Office queue", value: openJobCount, detail: "Work needing oversight" },
          { label: "Queued changes", value: queueCount, detail: "Waiting to sync" },
          { label: "Files loaded", value: generatedDocumentCount, detail: "Current history" },
          { label: "Audit entries", value: adminAuditCount, detail: syncPulseText }
        ];
      case "finance":
        return [
          { label: "Billable work", value: openJobCount, detail: "Jobs to review for billing" },
          { label: "Payment files", value: generatedDocumentCount, detail: "Documents in billing scope" },
          { label: "Queued changes", value: queueCount, detail: "Finance updates waiting to sync" },
          { label: "Connection", value: networkOnline ? "Online" : "Offline", detail: syncPulseText }
        ];
      case "technician":
        return [
          { label: "Today", value: openJobCount, detail: "Assigned jobs still active" },
          { label: "Current status", value: selectedJobStatus, detail: "Selected job stage" },
          { label: "Queued field notes", value: queueCount, detail: "Offline updates waiting" },
          { label: "Files", value: generatedDocumentCount, detail: syncPulseText }
        ];
      case "dispatcher":
        return [
          { label: "Dispatch load", value: openJobCount, detail: "Jobs needing coordination" },
          { label: "Selected job", value: selectedJobStatus, detail: "Schedule context" },
          { label: "Queued updates", value: queueCount, detail: "Changes waiting to sync" },
          { label: "Files ready", value: generatedDocumentCount, detail: syncPulseText }
        ];
      case "super_admin":
        return [
          { label: "Platform work", value: openJobCount, detail: "Jobs visible in current role" },
          { label: "Queued changes", value: queueCount, detail: "Sync and conflict watch" },
          { label: "Audit entries", value: adminAuditCount, detail: "Governance activity" },
          { label: "Connection", value: networkOnline ? "Online" : "Offline", detail: syncPulseText }
        ];
      default:
        return [
          { label: "Open jobs", value: openJobCount, detail: "Work in progress" },
          { label: "Selected job", value: selectedJobStatus, detail: "Current status" },
          { label: "Queued changes", value: queueCount, detail: "Waiting to sync" },
          { label: "Files in scope", value: generatedDocumentCount, detail: syncPulseText }
        ];
    }
  }, [role, openJobCount, selectedJobStatus, queueCount, generatedDocumentCount, adminAuditCount, networkOnline, syncPulseText]);

  return (
    <section className="summary-grid">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </section>
  );
}
