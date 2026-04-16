import React, { useState } from "react";

interface ChecklistItem {
  id: string;
  label: string;
}

const FIRE_ITEMS: ChecklistItem[] = [
  { id: "panel_functional", label: "Control Panel functional and clear of faults" },
  { id: "detectors_tested", label: "All detectors tested and functional" },
  { id: "batteries_checked", label: "Standby batteries inspected and load tested" },
  { id: "call_points_verified", label: "Manual call points verified and unobstructed" },
  { id: "sounders_audible", label: "Audible and visual alarms confirmed functional" },
  { id: "signage_correct", label: "SANS-compliant signage in place and legible" }
];

const GAS_ITEMS: ChecklistItem[] = [
  { id: "cylinder_pressure", label: "Cylinder pressure within operational limits" },
  { id: "nozzles_clear", label: "Discharge nozzles clear of obstructions" },
  { id: "logic_verified", label: "Pre-discharge logic and countdown verified" },
  { id: "manual_release", label: "Manual release station functional" },
  { id: "hold_test", label: "Room integrity / Door fan test performed" },
  { id: "signage_present", label: "Warning signage and status lamps clear" }
];

interface Prop {
  jobTitle: string;
  onChange: (data: Record<string, string>) => void;
}

export function CertificationForm({ jobTitle, onChange }: Prop) {
  const isGas = jobTitle.toLowerCase().includes("gas") || jobTitle.toLowerCase().includes("suppression");
  const items = isGas ? GAS_ITEMS : FIRE_ITEMS;
  const [results, setResults] = useState<Record<string, string>>({});

  const toggle = (id: string, value: string) => {
    const next = { ...results, [id]: value };
    setResults(next);
    onChange(next);
  };

  return (
    <div className="certification-checklist">
      <div className="control-block__head">
        <h3>{isGas ? "SANS 14520 Certification Checklist" : "SANS 10139 Certification Checklist"}</h3>
        <p>Verify every critical compliance point before generating the final service report.</p>
      </div>
      <div className="checklist-grid">
        {items.map(item => (
          <div key={item.id} className="checklist-item">
            <span className="checklist-item__label">{item.label}</span>
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
