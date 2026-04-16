import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function statusTone(status) {
    switch (status) {
        case "performed":
        case "approved":
        case "certified":
            return "active";
        case "draft":
        case "rejected":
            return "warning";
        case "cancelled":
            return "critical";
        default:
            return "neutral";
    }
}
export function JobItem({ job, isActive, onClick }) {
    return (_jsxs("button", { className: isActive ? "job-item job-item--active" : "job-item", onClick: () => onClick(job.job_uid), children: [_jsxs("div", { className: "job-item__top", children: [_jsx("strong", { children: job.job_uid }), _jsx("span", { className: `status-chip status-chip--${statusTone(job.status)}`, children: job.status })] }), _jsx("span", { className: "job-item__title", children: job.title }), _jsxs("span", { className: "job-item__meta", children: ["client ", job.client_uid || "unassigned", " | tech ", job.technician_uid || "pending"] })] }));
}
export function JobListView({ jobs, selectedJobUid, onSelectJob, title }) {
    return (_jsxs("section", { className: "workspace-card", children: [_jsxs("div", { className: "panel-heading panel-heading--inline", children: [_jsxs("div", { children: [_jsx("p", { className: "panel-eyebrow", children: "Jobs" }), _jsx("h2", { children: title })] }), _jsx("span", { className: "count-pill", children: jobs.length })] }), _jsx("div", { className: "job-list", children: jobs.length === 0 ? (_jsx("p", { className: "muted-copy", children: "No jobs currently available for this role." })) : (jobs.map((job) => (_jsx(JobItem, { job: job, isActive: job.job_uid === selectedJobUid, onClick: onSelectJob }, job.job_uid)))) })] }));
}
