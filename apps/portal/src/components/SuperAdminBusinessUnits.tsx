import React, { useEffect, useMemo, useState } from "react";

type BusinessUnit = {
  id: string;
  name: string;
  location: string;
  active: boolean;
};

const STORAGE_KEY = "kharon_business_units";
const ACTIVE_KEY = "kharon_active_business_unit";

const DEFAULT_UNITS: BusinessUnit[] = [
  { id: "hq", name: "Kharon South Africa (HQ)", location: "Gauteng, Midrand", active: true },
  { id: "wc", name: "Kharon Western Cape", location: "Cape Town, Bellville", active: true }
];

function loadUnits(): BusinessUnit[] {
  if (typeof window === "undefined") return DEFAULT_UNITS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_UNITS;
    const parsed = JSON.parse(raw) as BusinessUnit[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_UNITS;
    return parsed
      .filter((unit) => typeof unit?.id === "string" && typeof unit?.name === "string")
      .map((unit) => ({
        id: unit.id,
        name: unit.name,
        location: String(unit.location ?? ""),
        active: Boolean(unit.active)
      }));
  } catch {
    return DEFAULT_UNITS;
  }
}

export function SuperAdminBusinessUnits(): React.JSX.Element {
  const [units, setUnits] = useState<BusinessUnit[]>(loadUnits);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [saved, setSaved] = useState(false);
  const [activeUnitId, setActiveUnitId] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_UNITS[0]?.id ?? "";
    return window.localStorage.getItem(ACTIVE_KEY) ?? DEFAULT_UNITS[0]?.id ?? "";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
    if (units.length > 0 && !units.some((unit) => unit.id === activeUnitId)) {
      const first = units[0];
      if (first) {
        setActiveUnitId(first.id);
      }
    }
  }, [activeUnitId, units]);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_KEY, activeUnitId);
  }, [activeUnitId]);

  const activeUnit = useMemo(() => units.find((unit) => unit.id === activeUnitId) ?? null, [activeUnitId, units]);

  function addUnit(): void {
    if (!name.trim() || !location.trim()) return;
    const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const next = [...units.filter((unit) => unit.id !== id), { id, name: name.trim(), location: location.trim(), active: true }];
    setUnits(next);
    setActiveUnitId(id);
    setName("");
    setLocation("");
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function toggleActive(id: string): void {
    setUnits((current) =>
      current.map((unit) => (unit.id === id ? { ...unit, active: !unit.active } : unit))
    );
  }

  function removeUnit(id: string): void {
    setUnits((current) => {
      const next = current.filter((unit) => unit.id !== id);
      if (activeUnitId === id) {
        setActiveUnitId(next[0]?.id ?? "");
      }
      return next;
    });
  }

  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Organization</p>
          <h2>Business Units</h2>
        </div>
      </div>

      <div className="highlight-box">
        <p>Manage company branches and switch the active business unit for local super-admin workflows.</p>
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Active Units</h3>
          <p>Select the current unit, add a new one, or mark a unit inactive.</p>
        </div>

        <div className="business-unit-grid">
          {units.map((unit) => (
            <div key={unit.id} className={`business-unit-card ${activeUnitId === unit.id ? "business-unit-card--active" : ""}`}>
              <div className="business-unit-card__header">
                <div>
                  <strong>{unit.name}</strong>
                  <p>{unit.location}</p>
                </div>
                <span className={`status-chip status-chip--${unit.active ? "active" : "warning"}`}>{unit.active ? "Active" : "Inactive"}</span>
              </div>
              <div className="button-row">
                <button type="button" className="button button--secondary" onClick={() => setActiveUnitId(unit.id)}>
                  Set active
                </button>
                <button type="button" className="button button--ghost" onClick={() => toggleActive(unit.id)}>
                  {unit.active ? "Disable" : "Enable"}
                </button>
                <button type="button" className="button button--ghost" onClick={() => removeUnit(unit.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Add Business Unit</h3>
          <p>Create a new local business unit entry for the registry.</p>
        </div>
        <div className="form-grid form-grid--two">
          <label className="field-stack">
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Unit name" />
          </label>
          <label className="field-stack">
            <span>Location</span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or region" />
          </label>
        </div>
        <div className="button-row mt-4">
          <button type="button" className="button button--primary" onClick={addUnit}>
            Add unit
          </button>
          {saved ? <span className="muted-copy">Registry updated locally.</span> : null}
        </div>
      </div>

      <p className="muted-copy mt-8">
        Active business unit: {activeUnit ? `${activeUnit.name} (${activeUnit.location})` : "None selected"}
      </p>

      <style>{`
        .mt-4 { margin-top: 1rem; }
        .mt-8 { margin-top: 2rem; }
        .business-unit-grid { display: grid; gap: 1rem; }
        .business-unit-card {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 1rem;
          background: rgba(255,255,255,0.03);
          display: grid;
          gap: 0.75rem;
        }
        .business-unit-card--active {
          border-color: rgba(99,102,241,0.55);
          background: rgba(99,102,241,0.1);
        }
        .business-unit-card__header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
        }
        .business-unit-card__header p {
          margin: 0.35rem 0 0;
          color: var(--color-text-muted);
        }
      `}</style>
    </article>
  );
}
