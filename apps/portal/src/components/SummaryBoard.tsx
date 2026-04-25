/**
 * KharonOps - Governance Pulse Summary
 * Purpose: Persistent status visualization for the active workspace.
 * Dependencies: summary-hardened.css, @kharon/domain
 */

import React from "react";
import type { Role } from "@kharon/domain";

type SummaryCardProps = {
  label: string;
  value: string | number;
  detail: string;
  isStatus?: boolean;
};

function SummaryCard({ label, value, detail, isStatus }: SummaryCardProps): React.JSX.Element {
  return (
    <article className="summary-card group">
      <div className="flex items-center gap-2 mb-2">
        {isStatus && <span className="summary-pulse summary-pulse--active"></span>}
        <span className="summary-card__label">{label}</span>
      </div>
      <strong>{value}</strong>
      <small className="group-hover:opacity-60 transition-opacity">{detail}</small>
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
    const connDetail = networkOnline ? `Verified ${syncPulseText}` : `Conflict Watch: ${syncPulseText}`;
    
    switch (role) {
      case "client":
        return [
          { label: "Active Engagements", value: openJobCount, detail: "Facility services in progress" },
          { label: "Governance Stage", value: selectedJobStatus, detail: "Current compliance state", isStatus: true },
          { label: "Asset Reports", value: generatedDocumentCount, detail: "Verified field documentation" },
          { label: "System Pulse", value: networkOnline ? "Online" : "Cached", detail: connDetail, isStatus: true }
        ];
      case "admin":
        return [
          { label: "Operational Queue", value: openJobCount, detail: "Jobs requiring oversight" },
          { label: "Ledger Sync", value: queueCount, detail: "Updates pending commit", isStatus: true },
          { label: "Registry Files", value: generatedDocumentCount, detail: "Historical state items" },
          { label: "Governance Pulse", value: adminAuditCount, detail: syncPulseText, isStatus: true }
        ];
      case "finance":
        return [
          { label: "Fiduciary Queue", value: openJobCount, detail: "Items awaiting reconciliation" },
          { label: "Ledger Documents", value: generatedDocumentCount, detail: "Billing evidence records" },
          { label: "Financial Sync", value: queueCount, detail: "Transactions pending commit", isStatus: true },
          { label: "Registry State", value: networkOnline ? "Stable" : "Isolated", detail: connDetail, isStatus: true }
        ];
      case "technician":
        return [
          { label: "Conduct Timeline", value: openJobCount, detail: "Active field engagements" },
          { label: "Active Handshake", value: selectedJobStatus, detail: "Current conduct stage", isStatus: true },
          { label: "Field Cache", value: queueCount, detail: "Evidence pending sync", isStatus: true },
          { label: "System Integrity", value: networkOnline ? "Online" : "Offline", detail: connDetail }
        ];
      case "dispatcher":
        return [
          { label: "Coordination Load", value: openJobCount, detail: "Jobs needing allocation" },
          { label: "Resource State", value: selectedJobStatus, detail: "Selected task status", isStatus: true },
          { label: "Schedule Sync", value: queueCount, detail: "Protocols pending commit", isStatus: true },
          { label: "System Pulse", value: networkOnline ? "Online" : "Offline", detail: syncPulseText }
        ];
      case "super_admin":
        return [
          { label: "Platform Load", value: openJobCount, detail: "Global active work" },
          { label: "Integrity Sync", value: queueCount, detail: "Global protocol buffer", isStatus: true },
          { label: "Forensic Audit", value: adminAuditCount, detail: "Platform governance logs" },
          { label: "Universal Pulse", value: networkOnline ? "Online" : "Syncing", detail: connDetail, isStatus: true }
        ];
      default:
        return [
          { label: "Active Jobs", value: openJobCount, detail: "Operations in progress" },
          { label: "Protocol Stage", value: selectedJobStatus, detail: "Current state", isStatus: true },
          { label: "Ledger Sync", value: queueCount, detail: "Pending updates", isStatus: true },
          { label: "System State", value: networkOnline ? "Online" : "Offline", detail: connDetail }
        ];
    }
  }, [role, openJobCount, selectedJobStatus, queueCount, generatedDocumentCount, adminAuditCount, networkOnline, syncPulseText]);

  return (
    <section className="summary-grid animate-fade-in">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </section>
  );
}
