/**
 * KharonOps - Technician Job Certification
 * Purpose: Level 4 Post-Execution Attestation
 * Dependencies: tech-hardened.css, @kharon/domain
 * Structural Role: Formal sign-off for field operations.
 */

import React, { useState } from "react";
import { type JobRecord } from "./JobListView";
import type { JobStatus } from "@kharon/domain";

interface TechCertifyCardProps {
  selectedJob: JobRecord | null;
  onUpdateStatus: (status: JobStatus) => void;
}

export function TechCertifyCard({ selectedJob, onUpdateStatus }: TechCertifyCardProps): React.JSX.Element {
  const [completed, setCompleted] = useState(false);
  const [safety, setSafety] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  if (!selectedJob) {
    return (
      <article className="premium-card glass-dark p-12 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
          <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold opacity-60">No selection</h2>
        <p className="text-sm opacity-40 mt-2">Select a job to begin the certification process.</p>
      </article>
    );
  }

  const isCheckedIn = selectedJob.status === "performed";
  const isFinished = selectedJob.status === "certified";
  const canCertify = completed && safety && cleared;

  return (
    <article className="premium-card glass overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="p-6 border-b border-white/10 bg-white/5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-light/60 mb-1">Conduct Attestation</p>
        <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Formal Certification</h2>
      </div>

      <div className="p-6 space-y-8">
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
              <span className={`status-chip status-chip--compact status-chip--${isFinished ? 'positive' : isCheckedIn ? 'active' : 'neutral'}`}>
                {isFinished ? "Certified" : isCheckedIn ? "Awaiting Sign-off" : "Not Started"}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{selectedJob.client_name}</h3>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">{selectedJob.site_id}</p>
          </div>
        </section>

        {!isCheckedIn && !isFinished ? (
          <div className="p-6 rounded-xl bg-warning/10 border border-warning/20 text-center animate-pulse">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="font-bold text-white/90">Check-in Required</p>
            <p className="text-xs mt-2 text-white/50">Operational state must be 'performed' to enable attestation.</p>
          </div>
        ) : isFinished ? (
          <div className="p-6 rounded-xl bg-positive/10 border border-positive/20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/mesh.svg')] opacity-20"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-positive/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <svg className="w-8 h-8 text-positive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-wider text-white">Provenance Secured</h3>
              <p className="mt-2 text-xs font-bold text-white/60">This job has been formally certified and recorded in the immutable ledger.</p>
            </div>
          </div>
        ) : (
          <section className="space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white/80 mb-4 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                </span>
                Compliance Checklist
              </h3>
              <p className="text-xs text-white/40 font-medium leading-relaxed mb-6">Verify that all SANS-integrated engineering standards have been met.</p>
            </div>
            
            <div className="space-y-3">
              {[
                { id: 'A', label: 'Task Completion', desc: 'All engineering targets achieved per brief.', state: completed, setter: setCompleted },
                { id: 'B', label: 'System Restoration', desc: 'Safety systems reinstated and verified.', state: safety, setter: setSafety },
                { id: 'C', label: 'Site Integrity', desc: 'Site hazards cleared and debris removed.', state: cleared, setter: setCleared }
              ].map((item) => (
                <label key={item.id} className={`flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer border group ${
                  item.state ? 'bg-primary/10 border-primary/30 shadow-glow-sm' : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                    item.state ? 'bg-primary text-black' : 'bg-white/10 text-white/40 group-hover:text-white/60'
                  }`}>
                    {item.id}
                  </div>
                  <div className="flex-1 mt-0.5">
                    <p className={`font-bold text-sm tracking-wide transition-colors ${item.state ? 'text-white' : 'text-white/80'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-wider mt-1">{item.desc}</p>
                  </div>
                  <div className="relative flex items-center h-8">
                    <input 
                      type="checkbox" 
                      checked={item.state} 
                      onChange={(e) => item.setter(e.target.checked)}
                      className="peer appearance-none w-5 h-5 rounded border-2 border-white/20 bg-transparent checked:bg-primary checked:border-primary transition-all cursor-pointer"
                    />
                    <svg className="absolute inset-0 w-5 h-5 text-black opacity-0 peer-checked:opacity-100 transition-opacity p-0.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5">
              <button 
                className={`button w-full py-4 text-sm font-black uppercase tracking-widest transition-all ${
                  canCertify 
                    ? 'button--primary shadow-glow hover:scale-105 active:scale-95' 
                    : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                }`}
                disabled={!canCertify || isFinishing}
                onClick={() => {
                  setIsFinishing(true);
                  setTimeout(() => onUpdateStatus("certified"), 800);
                }}
              >
                {isFinishing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin"></div>
                    Processing Attestation...
                  </span>
                ) : (
                  "Sign Out & Formally Certify"
                )}
              </button>
              <p className="text-center text-[10px] font-bold text-white/20 uppercase mt-4 tracking-widest">
                * All checkpoints must be satisfied to secure the audit trail.
              </p>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}