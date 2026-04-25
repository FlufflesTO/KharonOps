/**
 * KharonOps - Technician Field Activity (Check In / Out)
 * Purpose: Level 4 Temporal and Spatial Provenance Capture
 * Dependencies: tech-hardened.css, @kharon/domain
 * Structural Role: Governance-grade capture for site arrival and completion.
 */

import React from "react";
import { type JobRecord } from "./JobListView";
import type { JobStatus } from "@kharon/domain";

interface TechCheckInOutCardProps {
  selectedJob: JobRecord | null;
  onUpdateStatus: (status: JobStatus) => void;
  onVerifyLocation: () => void;
  geoStatus: "idle" | "verified" | "warning" | "error";
}

export function TechCheckInOutCard({ selectedJob, onUpdateStatus, onVerifyLocation, geoStatus }: TechCheckInOutCardProps): React.JSX.Element {
  if (!selectedJob) {
    return (
      <article className="premium-card glass-dark p-12 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
          <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold opacity-60">No active job selected</h2>
        <p className="text-sm opacity-40 mt-2">Select a deployment to begin field capture.</p>
      </article>
    );
  }

  const isCheckedIn = selectedJob.status === "performed";
  const geoVerified = geoStatus === "verified" || geoStatus === "warning";

  return (
    <article className="premium-card glass overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="p-6 border-b border-white/10 bg-white/5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-light/60 mb-1">Temporal Provenance</p>
        <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
          {isCheckedIn ? "Operational Completion" : "Site Arrival Capture"}
        </h2>
      </div>

      <div className="p-6 space-y-8">
        {/* Context Brief */}
        <section className="p-6 rounded-2xl bg-black/40 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <span className="px-2 py-0.5 bg-primary/20 rounded font-mono text-[10px] font-bold tracking-widest text-primary-light border border-primary/30">
                {selectedJob.job_id}
              </span>
              <span className={`status-chip status-chip--compact status-chip--${isCheckedIn ? 'active' : 'neutral'}`}>
                {isCheckedIn ? "Checked In" : "Pending Arrival"}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{selectedJob.client_name}</h3>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">{selectedJob.site_id}</p>
          </div>
        </section>

        {!isCheckedIn ? (
          <section className="space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white/80 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
                Spatial Verification
              </h3>
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${geoVerified ? 'bg-primary shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.5)]' : 'bg-white/20 animate-pulse'}`}></div>
                    <div>
                      <p className="font-bold text-xs text-white uppercase tracking-wider">
                        {geoStatus === "verified" ? "Location Secure" : 
                         geoStatus === "warning" ? "Signal Warning" :
                         geoStatus === "error" ? "Verification Failed" : "Awaiting Pulse..."}
                      </p>
                      <p className="text-[10px] text-white/40 font-medium">
                        {geoStatus === "verified" ? "Coordinates bound to audit log." : "GPS Handshake Required."}
                      </p>
                    </div>
                  </div>
                  <button 
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${geoVerified ? "bg-white/10 text-white/60 hover:bg-white/20" : "bg-primary text-black shadow-glow hover:scale-105"}`}
                    onClick={onVerifyLocation}
                  >
                    {geoVerified ? "Re-verify" : "Capture"}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5">
              <h3 className="text-sm font-black uppercase tracking-widest text-white/80 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
                Operational Handshake
              </h3>
              
              <button 
                className="button button--primary w-full py-4 text-sm font-black uppercase tracking-widest shadow-glow disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
                disabled={!geoVerified}
                onClick={() => onUpdateStatus("performed")}
              >
                Sign In to Work
              </button>
              {!geoVerified && (
                <div className="flex items-center justify-center gap-2 mt-4 text-[10px] font-bold text-white/20 uppercase">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Spatial Verification Required
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white/80 mb-4">Post-Execution Verification</h3>
              <p className="text-xs text-white/40 font-medium leading-relaxed">Attest to the completion of all safety and engineering protocols.</p>
            </div>
            
            <div className="space-y-3">
              {[
                "Safety systems reinstated and verified",
                "Site hazards cleared and debris removed",
                "All engineering targets achieved per brief"
              ].map((text, idx) => (
                <label key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" className="peer appearance-none w-5 h-5 rounded border-2 border-white/20 bg-transparent checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                    <svg className="absolute inset-0 w-5 h-5 text-black opacity-0 peer-checked:opacity-100 transition-opacity p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider group-hover:text-white transition-colors">{text}</span>
                </label>
              ))}
            </div>

            <div className="pt-4 border-t border-white/5">
              <button 
                className="button button--primary w-full py-4 text-sm font-black uppercase tracking-widest shadow-glow hover:scale-105 active:scale-95 transition-all"
                onClick={() => onUpdateStatus("certified")}
              >
                Formalize Completion
              </button>
              <p className="text-center text-[10px] font-bold text-white/20 uppercase mt-4 tracking-widest">
                Constitutional Certification: SANS 10139
              </p>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
