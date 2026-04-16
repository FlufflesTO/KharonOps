import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
const FIRE_ITEMS = [
    { id: "panel_functional", label: "Control Panel functional and clear of faults" },
    { id: "detectors_tested", label: "All detectors tested and functional" },
    { id: "batteries_checked", label: "Standby batteries inspected and load tested" },
    { id: "call_points_verified", label: "Manual call points verified and unobstructed" },
    { id: "sounders_audible", label: "Audible and visual alarms confirmed functional" },
    { id: "signage_correct", label: "SANS-compliant signage in place and legible" }
];
const GAS_ITEMS = [
    { id: "cylinder_pressure", label: "Cylinder pressure within operational limits" },
    { id: "nozzles_clear", label: "Discharge nozzles clear of obstructions" },
    { id: "logic_verified", label: "Pre-discharge logic and countdown verified" },
    { id: "manual_release", label: "Manual release station functional" },
    { id: "hold_test", label: "Room integrity / Door fan test performed" },
    { id: "signage_present", label: "Warning signage and status lamps clear" }
];
export function CertificationForm({ jobTitle, onChange }) {
    const isGas = jobTitle.toLowerCase().includes("gas") || jobTitle.toLowerCase().includes("suppression");
    const items = isGas ? GAS_ITEMS : FIRE_ITEMS;
    const [results, setResults] = useState({});
    const toggle = (id, value) => {
        const next = { ...results, [id]: value };
        setResults(next);
        onChange(next);
    };
    return (_jsxs("div", { className: "certification-checklist", children: [_jsxs("div", { className: "control-block__head", children: [_jsx("h3", { children: isGas ? "SANS 14520 Certification Checklist" : "SANS 10139 Certification Checklist" }), _jsx("p", { children: "Verify every critical compliance point before generating the final service report." })] }), _jsx("div", { className: "checklist-grid", children: items.map(item => (_jsxs("div", { className: "checklist-item", children: [_jsx("span", { className: "checklist-item__label", children: item.label }), _jsxs("div", { className: "checklist-item__actions", children: [_jsx("button", { type: "button", className: `check-btn ${results[item.id] === 'PASS' ? 'check-btn--pass' : ''}`, onClick: () => toggle(item.id, 'PASS'), children: "PASS" }), _jsx("button", { type: "button", className: `check-btn ${results[item.id] === 'FAIL' ? 'check-btn--fail' : ''}`, onClick: () => toggle(item.id, 'FAIL'), children: "FAIL" })] })] }, item.id))) })] }));
}
