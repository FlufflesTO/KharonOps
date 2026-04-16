import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
function SummaryCard({ label, value, detail }) {
    return (_jsxs("article", { className: "summary-card", children: [_jsx("span", { className: "summary-card__label", children: label }), _jsx("strong", { children: value }), _jsx("small", { children: detail })] }));
}
export function SummaryBoard({ role, openJobCount, selectedJobStatus, queueCount, generatedDocumentCount, adminAuditCount, networkOnline }) {
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
    return (_jsx("section", { className: "summary-grid", children: cards.map((card) => (_jsx(SummaryCard, { ...card }, card.label))) }));
}
