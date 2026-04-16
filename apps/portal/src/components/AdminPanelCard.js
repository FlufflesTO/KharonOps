import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { apiClient } from "../apiClient";
export function AdminPanelCard({ adminHealth, adminAuditCount, onLoadHealth, onLoadAudits, onFeedback, }) {
    return (_jsxs("article", { className: "workspace-card", children: [_jsxs("div", { className: "panel-heading", children: [_jsx("p", { className: "panel-eyebrow", children: "Admin" }), _jsx("h2", { children: "Health and audit surface" })] }), _jsxs("div", { className: "button-row", children: [_jsx("button", { className: "button button--secondary", onClick: onLoadHealth, children: "Load health" }), _jsx("button", { className: "button button--secondary", onClick: onLoadAudits, children: "Load audits" }), _jsx("button", { className: "button button--ghost", onClick: async () => {
                            await apiClient.retryAutomation("AUTO-001");
                            onFeedback("Automation retry requested.");
                        }, children: "Retry AUTO-001" })] }), _jsx("div", { className: "feedback-panel", children: _jsx("pre", { children: JSON.stringify({ health: adminHealth, audit_count: adminAuditCount }, null, 2) }) })] }));
}
