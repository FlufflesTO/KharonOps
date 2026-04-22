import React, { useMemo, useState } from "react";

interface ChecklistItem {
  id: string;
  label: string;
  clause: string;
  severity: "critical" | "major" | "minor";
}

const FIRE_ITEMS: ChecklistItem[] = [
  { id: "panel_functional", clause: "SANS 10139-13", severity: "critical", label: "Control Panel functional and clear of faults" },
  { id: "detectors_tested", clause: "SANS 10139-16", severity: "major", label: "All detectors tested and functional" },
  { id: "batteries_checked", clause: "SANS 10139-45", severity: "critical", label: "Standby batteries inspected and load tested" },
  { id: "call_points_verified", clause: "SANS 10139-17", severity: "major", label: "Manual call points verified and unobstructed" },
  { id: "sounders_audible", clause: "SANS 10139-21", severity: "major", label: "Audible and visual alarms confirmed functional" },
  { id: "signage_correct", clause: "SANS 10139-52", severity: "minor", label: "SANS-compliant signage in place and legible" }
];

const GAS_ITEMS: ChecklistItem[] = [
  { id: "cylinder_pressure", clause: "SANS 14520-7", severity: "critical", label: "Cylinder pressure within operational limits" },
  { id: "nozzles_clear", clause: "SANS 14520-10", severity: "major", label: "Discharge nozzles clear of obstructions" },
  { id: "logic_verified", clause: "SANS 14520-21", severity: "critical", label: "Pre-discharge logic and countdown verified" },
  { id: "manual_release", clause: "SANS 14520-14", severity: "major", label: "Manual release station functional" },
  { id: "hold_test", clause: "SANS 14520-18", severity: "major", label: "Room integrity / Door fan test performed" },
  { id: "signage_present", clause: "SANS 14520-25", severity: "minor", label: "Warning signage and status lamps clear" }
];

interface Prop {
  jobTitle: string;
  onChange: (data: Record<string, string>) => void;
}

export function CertificationForm({ jobTitle, onChange }: Prop) {
  const isGas = jobTitle.toLowerCase().includes("gas") || jobTitle.toLowerCase().includes("suppression");
  const [regVersion, setRegVersion] = useState(isGas ? "14520-2024.1" : "10139-2024.3");
  const [results, setResults] = useState<Record<string, string>>({});
  const items = useMemo(() => {
    const source = isGas ? GAS_ITEMS : FIRE_ITEMS;
    return source.map((item) => ({
      ...item,
      label: `${item.label} (${item.clause} v${regVersion})`
    }));
  }, [isGas, regVersion]);

  const toggle = (id: string, value: string) => {
    const next = { ...results, [id]: value };
    setResults(next);
    onChange({
      ...next,
      regulation_version: regVersion,
      checklist_standard: isGas ? "SANS 14520" : "SANS 10139"
    });
  };

  return (
    <div className="certification-checklist">
      <div className="control-block__head">
        <h3>{isGas ? "SANS 14520 Certification Checklist" : "SANS 10139 Certification Checklist"}</h3>
        <p>Verify every critical compliance point before generating the final service report.</p>
      </div>
      <div className="form-grid">
        <label className="field-stack">
          <span>Regulation mapping version</span>
          <input value={regVersion} onChange={(event) => setRegVersion(event.target.value)} />
        </label>
      </div>
      <div className="checklist-grid">
        {items.map(item => (
          <div key={item.id} className="checklist-item">
            <span className="checklist-item__label">
              {item.label}
              <small className={`status-chip status-chip--${item.severity === "critical" ? "critical" : item.severity === "major" ? "warning" : "neutral"}`} style={{ marginLeft: "0.5rem" }}>
                {item.severity}
              </small>
            </span>
            <div className="checklist-item__actions">
              <button 
                type="button" 
                className={`check-btn ${results[item.id] === 'PASS' ? 'check-btn--pass' : ''}`}
                onClick={() => toggle(item.id, 'PASS')}
              >
                PASS
              </button>
              <button 
                type="button" 
                className={`check-btn ${results[item.id] === 'FAIL' ? 'check-btn--fail' : ''}`}
                onClick={() => toggle(item.id, 'FAIL')}
              >
                FAIL
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
