/**
 * KharonOps - Technician My Day (Field Command)
 * Purpose: Level 4 Operational Schedule and Conduct Intelligence
 * Dependencies: tech-hardened.css, JobListView.tsx
 * Structural Role: Primary workflow hub for technician field operations.
 */

import React from "react";
import { type JobRecord } from "./JobListView";

interface TechMyDayCardProps {
  jobs: JobRecord[];
  onSelectJob: (jobId: string) => void;
  onEnterTool: (tool: string) => void;
}

export function TechMyDayCard({ jobs, onSelectJob, onEnterTool }: TechMyDayCardProps): React.JSX.Element {
  const activeJobs = jobs.filter(j => 
    j.status === "performed" || 
    j.status === "approved" || 
    j.status === "draft"
  );
  
  const nextJob = activeJobs.find(j => j.status === "approved") || activeJobs[0];

  return (
    <article className="premium-card glass-dark overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-6 border-b border-white/10">
        <div className="flex justify-between items-center w-full">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-light/60 mb-1">Operational Command</p>
            <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Your Field Schedule</h2>
          </div>
          <div className="text-right hidden md:block">
            <span className="status-chip status-chip--active shadow-glow-sm">Active Deployment</span>
          </div>
        </div>
      </div>

      {!nextJob ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
            <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold opacity-60">No active deployments.</h3>
          <p className="text-sm opacity-40 mt-2">Stand by for dispatch instructions.</p>
        </div>
      ) : (
        <div className="p-0">
          {/* Primary Directive (Next Job) */}
          <section className="relative p-8 bg-gradient-to-br from-primary/20 to-transparent border-b border-white/10 group overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-white/10 rounded font-mono text-xs font-bold tracking-widest text-primary-light border border-white/10">
                  {nextJob.job_id}
                </span>
                <span className={`status-chip status-chip--${nextJob.status === "performed" ? "warning" : "active"}`}>
                  {nextJob.status === "performed" ? "IN_PROGRESS" : "AWAITING_ARRIVAL"}
                </span>
              </div>
              
              <h3 className="text-3xl font-black text-white mb-1 uppercase italic tracking-tighter">{nextJob.client_name}</h3>
              <p className="text-lg text-white/70 font-medium mb-8">{nextJob.title}</p>
              
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                </div>
                <div>
                  <p className="text-sm font-bold text-white/90 uppercase tracking-wider">{nextJob.site_id}</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase">Spatial Context: Verification Pending</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  className="button button--primary px-8 py-4 text-sm font-black uppercase tracking-widest shadow-glow hover:scale-105 active:scale-95 transition-all"
                  onClick={() => {
                    onSelectJob(nextJob.job_id);
                    onEnterTool("tech_start");
                  }}
                >
                  {nextJob.status === "performed" ? "Continue Operations" : "Begin Site Arrival"}
                </button>
                <button 
                  className="button button--secondary-glass px-8 py-4 text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  onClick={() => {
                    onSelectJob(nextJob.job_id);
                    onEnterTool("jobs");
                  }}
                >
                  Intelligence Brief
                </button>
              </div>
            </div>
          </section>

          {/* Conduct Pipeline (Schedule) */}
          <section className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-4 bg-primary rounded-full"></div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white/80">Conduct Pipeline</h3>
            </div>
            
            <div className="grid gap-3">
              {activeJobs.map((job, index) => {
                const isActive = job.job_id === nextJob.job_id;
                const isDone = job.status === "certified" || job.status === "cancelled";
                
                return (
                  <button 
                    key={job.job_id} 
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all border group ${
                      isActive 
                        ? 'bg-primary/10 border-primary/30 shadow-glow-sm' 
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                    onClick={() => {
                      onSelectJob(job.job_id);
                      onEnterTool("jobs");
                    }}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm ${
                      isActive ? 'bg-primary text-black' : 'bg-white/10 text-white/40'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-sm tracking-wide text-white">{job.job_id}</p>
                      <p className="text-[10px] font-bold opacity-40 uppercase truncate">{job.client_name} • {job.site_id}</p>
                    </div>
                    <div className="text-right">
                      <span className={`status-chip status-chip--compact status-chip--${isActive ? 'active' : 'neutral'}`}>
                        {job.status.toUpperCase()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </article>
  );
}
