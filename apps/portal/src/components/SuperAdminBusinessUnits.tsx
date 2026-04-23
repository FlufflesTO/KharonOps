import React from "react";

export function SuperAdminBusinessUnits(): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Organization</p>
          <h2>Business Units</h2>
        </div>
      </div>

      <div className="highlight-box">
        <p>Manage company branches, departments, and regional offices. Business unit data is pulled from the canonical registry.</p>
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Active Units</h3>
          <p>The following business units are currently configured in the ledger.</p>
        </div>
        
        <div className="history-table">
          <div className="history-row">
            <div className="flex-1">
              <strong>Kharon South Africa (HQ)</strong>
              <span className="job-item__meta">Gauteng, Midrand</span>
            </div>
            <span className="status-chip status-chip--active">Active</span>
          </div>
          <div className="history-row">
            <div className="flex-1">
              <strong>Kharon Western Cape</strong>
              <span className="job-item__meta">Cape Town, Bellville</span>
            </div>
            <span className="status-chip status-chip--active">Active</span>
          </div>
        </div>
      </div>
      
      <p className="muted-copy mt-8">Unit configuration is currently managed via the master ledger. Portal-based editing will be enabled in a future update.</p>
      
      <style>{`
        .mt-8 { margin-top: 2rem; }
      `}</style>
    </article>
  );
}
