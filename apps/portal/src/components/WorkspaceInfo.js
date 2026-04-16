import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
export function WorkspaceInfo({ role, selectedJob, queueCount, generatedDocumentCount, networkOnline }) {
    const brief = React.useMemo(() => {
        switch (role) {
            case "client":
                return {
                    title: "Client service visibility",
                    body: "A cleaner client workspace focused on live service visibility, scheduling preference capture, and published reports with supporting evidence.",
                    supportTitle: "Client guidance",
                    supportIntro: "This surface should feel calm and readable. It is for visibility, approvals, and records rather than internal operational detail.",
                    supportItems: [
                        "Track planned maintenance or callout status and the latest service note without calling dispatch.",
                        "Submit preferred windows directly from the active site service record.",
                        "Review published jobcards, service reports, and compliance-facing evidence once closeout is complete."
                    ],
                    selectedJobTitle: "Service record",
                    documentsTitle: "Reports and evidence",
                    jobsTitle: "Visible site activity"
                };
            case "technician":
                return {
                    title: "Field execution workspace",
                    body: "A technician view should emphasise job state, note capture, readings, and controlled closeout generation from site with minimal distraction.",
                    supportTitle: "Field checklist",
                    supportIntro: "The technician surface is for execution. Keep status, notes, readings, and closeout controls close to the active work order.",
                    supportItems: [
                        "Advance status as work moves from assigned to on-site, paused, or complete.",
                        "Capture site notes and service readings against the active work order as events happen.",
                        "Generate the current jobcard or service report before the visit closes."
                    ],
                    selectedJobTitle: "Active work order",
                    documentsTitle: "Document history",
                    jobsTitle: "Assigned and available work"
                };
            case "dispatcher":
                return {
                    title: "Dispatch coordination deck",
                    body: "A dispatcher workspace should foreground maintenance cadence, callouts, scheduling control, communication rails, and the current operational posture.",
                    supportTitle: "Dispatch posture",
                    supportIntro: "This view is for orchestration rather than field detail. Confirm timing, move resources, and keep client updates aligned with the job record.",
                    supportItems: [
                        "Confirm maintenance and callout requests with technician assignment and exact windows.",
                        "Reschedule work with row-version discipline instead of side-channel changes.",
                        "Send controlled Gmail and chat updates linked to the selected service record."
                    ],
                    selectedJobTitle: "Operational job context",
                    documentsTitle: "Document history",
                    jobsTitle: "Assigned and available work"
                };
            case "admin":
                return {
                    title: "Administrative control surface",
                    body: "An admin workspace should read like an executive operations console: platform posture, audit access, controlled documents, and privileged recovery actions.",
                    supportTitle: "Governance posture",
                    supportIntro: "Administrative users need oversight, not noise. Surface audit readiness, platform state, document control, and privileged actions clearly.",
                    supportItems: [
                        "Inspect health and audit surfaces from the same operational context as service delivery.",
                        "Review dispatch rails and controlled outputs while retaining administrative oversight.",
                        "Keep privileged retries and platform recovery separate from day-to-day execution."
                    ],
                    selectedJobTitle: "Operational job context",
                    documentsTitle: "Document history",
                    jobsTitle: "Assigned and available work"
                };
            default:
                return {
                    title: "Operations workspace",
                    body: "",
                    supportTitle: "Workspace guidance",
                    supportIntro: "",
                    supportItems: [],
                    selectedJobTitle: "Selected job",
                    documentsTitle: "Document history",
                    jobsTitle: "Jobs"
                };
        }
    }, [role]);
    const priorities = React.useMemo(() => {
        switch (role) {
            case "client":
                return [
                    {
                        label: "Current visibility",
                        detail: selectedJob ? `${selectedJob.job_uid} is ${selectedJob.status}` : "Select a service record to view live status."
                    },
                    {
                        label: "Scheduling path",
                        detail: networkOnline ? "Preferred service windows can be submitted now." : "Offline now; scheduling actions resume when connectivity returns."
                    },
                    {
                        label: "Published outputs",
                        detail: generatedDocumentCount > 0 ? `${generatedDocumentCount} report or evidence rows loaded in scope.` : "Published outputs will appear once service closeout is complete."
                    }
                ];
            case "technician":
                return [
                    {
                        label: "Field state",
                        detail: selectedJob ? `Use ${selectedJob.job_uid} as the active work order.` : "Select a work order before posting field updates."
                    },
                    {
                        label: "Queue posture",
                        detail: queueCount > 0 ? `${queueCount} offline-safe mutations are waiting for replay.` : "No queued field mutations are waiting for replay."
                    },
                    {
                        label: "Closeout readiness",
                        detail: generatedDocumentCount > 0 ? `${generatedDocumentCount} controlled outputs are visible in history.` : "Generate the current jobcard or service report when the visit is ready to close."
                    }
                ];
            case "dispatcher":
                return [
                    {
                        label: "Control window",
                        detail: selectedJob ? `Dispatch is centred on ${selectedJob.job_uid}.` : "Select a job to expose schedule and outbound controls."
                    },
                    {
                        label: "Queue posture",
                        detail: queueCount > 0 ? `${queueCount} operational mutations remain queued.` : "No queued mutations are waiting for replay."
                    },
                    {
                        label: "Outbound readiness",
                        detail: networkOnline ? "Gmail and chat rails are available from this session." : "Connectivity is offline; outbound service communications should be treated as delayed."
                    }
                ];
            case "admin":
                return [
                    {
                        label: "Control window",
                        detail: selectedJob ? `Administrative context is anchored on ${selectedJob.job_uid}.` : "Select a job to align governance and operational review."
                    },
                    {
                        label: "Audit surface",
                        detail: generatedDocumentCount > 0 ? `${generatedDocumentCount} document records are currently loaded.` : "Load document history to verify closeout posture."
                    },
                    {
                        label: "Platform posture",
                        detail: networkOnline ? "Session is online and privileged actions are available." : "Connectivity is offline; avoid assuming privileged actions have landed."
                    }
                ];
            default:
                return [];
        }
    }, [role, selectedJob, queueCount, generatedDocumentCount, networkOnline]);
    return (_jsxs("section", { className: "portal-header", children: [_jsxs("div", { className: "portal-header__brief", children: [_jsx("h1", { children: brief.title }), _jsx("p", { children: brief.body }), _jsx("div", { className: "portal-header__priorities", children: priorities.map((item) => (_jsxs("div", { className: "priority-item", children: [_jsx("strong", { children: item.label }), _jsx("span", { children: item.detail })] }, item.label))) })] }), _jsxs("aside", { className: "portal-header__support", children: [_jsx("h3", { children: brief.supportTitle }), _jsx("p", { children: brief.supportIntro }), _jsx("ul", { children: brief.supportItems.map((item, idx) => (_jsx("li", { children: item }, idx))) })] })] }));
}
