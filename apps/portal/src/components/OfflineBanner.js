import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function OfflineBanner({ networkOnline, queueCount, onReplay, actionPending }) {
    if (networkOnline && queueCount === 0) {
        return (_jsxs("div", { className: "status-bar status-bar--online", children: [_jsx("span", { className: "dot dot--online" }), "Connected to Kharon API. Session is live."] }));
    }
    if (!networkOnline) {
        return (_jsxs("div", { className: "status-bar status-bar--offline", children: [_jsx("span", { className: "dot dot--offline" }), "Offline. Mutations are queued locally and will replay when connectivity returns.", queueCount > 0 && _jsxs("strong", { children: [" (", queueCount, " pending)"] })] }));
    }
    return (_jsxs("div", { className: "status-bar status-bar--warning", children: [_jsx("span", { className: "dot dot--warning" }), queueCount, " mutations are queued locally.", _jsx("button", { className: "button button--small button--ghost", onClick: onReplay, disabled: actionPending, children: actionPending ? "Replaying..." : "Replay now" })] }));
}
