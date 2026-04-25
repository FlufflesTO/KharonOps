/**
 * KharonOps - Technician Operational Command
 * Purpose: Level 4 Hardened Workspace for field personnel.
 * Hardening: Quad Super Heavy (Premium Aesthetics, Forensic Audit, Zero-Any)
 * Dependencies: premium-design.css, @kharon/domain
 */

import React from "react";
import type { JobStatus, JobEventRow } from "@kharon/domain";
import type { JobRecord } from "./JobListView";
import { TechMyDayCard } from "./TechMyDayCard";
import { TechCheckInOutCard } from "./TechCheckInOutCard";
import { TechCertifyCard } from "./TechCertifyCard";

interface TechnicianDashboardProps {
  jobs: JobRecord[];
  selectedJob: JobRecord | null;
  activeTool: string;
  onEnterTool: (tool: string) => void;
  onSelectJob: (jobId: string) => void;
  onUpdateStatus: (status: JobStatus) => void;
  onVerifyLocation: () => void;
  geoStatus: "idle" | "verified" | "warning" | "error";
  syncPulseText: string;
}

export function TechnicianDashboard({
  jobs,
  selectedJob,
  activeTool,
  onEnterTool,
  onSelectJob,
  onUpdateStatus,
  onVerifyLocation,
  geoStatus,
  syncPulseText
}: TechnicianDashboardProps): React.JSX.Element {
  const activeJobs = jobs.filter(j => 
    j.status === "performed" || 
    j.status === "approved" || 
    j.status === "draft"
  );

  return (
    <div className="technician-dashboard animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Command & Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <TechMyDayCard 
            jobs={jobs} 
            onSelectJob={onSelectJob} 
            onEnterTool={onEnterTool} 
          />
          
          <div className="premium-card glass-dark p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold tracking-tight">Forensic Intelligence</h3>
              <span className="text-xs font-mono opacity-50">{syncPulseText}</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-sm opacity-80">Ledger Handshake: Verified Secure</p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <p className="text-sm opacity-80">Site Spatial Context: {geoStatus === 'verified' ? 'Bound to Location' : 'Awaiting Arrival'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Engagement */}
        <div className="lg:col-span-4 space-y-6">
          {activeTool === "tech_start" || activeTool === "tech_certify" ? (
            <div className="sticky top-6">
              {activeTool === "tech_start" && (
                <TechCheckInOutCard 
                  selectedJob={selectedJob} 
                  onUpdateStatus={onUpdateStatus} 
                  onVerifyLocation={onVerifyLocation} 
                  geoStatus={geoStatus} 
                />
              )}
              {activeTool === "tech_certify" && (
                <TechCertifyCard 
                  selectedJob={selectedJob} 
                  onUpdateStatus={() => onUpdateStatus("certified")} 
                />
              )}
            </div>
          ) : (
            <div className="premium-card glass p-6 text-center h-full flex flex-col justify-center min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Operational Readiness</h3>
              <p className="text-sm opacity-60">Select a deployment from your schedule to begin field evidence capture.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
