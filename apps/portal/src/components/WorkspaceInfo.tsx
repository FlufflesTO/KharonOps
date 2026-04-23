import React from "react";
import type { Role, JobStatus } from "@kharon/domain";

type WorkspaceBrief = {
  title: string;
  body: string;
  supportTitle: string;
  supportIntro: string;
  supportItems: string[];
  selectedJobTitle: string;
  documentsTitle: string;
  jobsTitle: string;
};

type WorkspaceRailItem = {
  label: string;
  detail: string;
};

interface WorkspaceInfoProps {
  role: Role;
  selectedJob: { job_id: string; status: JobStatus } | null;
  queueCount: number;
  generatedDocumentCount: number;
  networkOnline: boolean;
}

export function WorkspaceInfo({
  role,
  selectedJob,
  queueCount,
  generatedDocumentCount,
  networkOnline
}: WorkspaceInfoProps): React.JSX.Element {
  const brief = React.useMemo<WorkspaceBrief>(() => {
    switch (role) {
      case "client":
        return {
          title: "Client workspace",
          body: "See active work, approve what needs approval, and review published records without internal operations noise.",
          supportTitle: "What this view is for",
          supportIntro: "This space is for visibility and follow-up, not internal dispatch detail.",
          supportItems: [
            "Track planned work and the latest status from one place.",
            "Send preferred windows from the active service record.",
            "Review published jobcards, reports, and evidence after closeout."
          ],
          selectedJobTitle: "Service record",
          documentsTitle: "Reports and evidence",
          jobsTitle: "Open work"
        };
      case "technician":
        return {
          title: "Technician workspace",
          body: "Focus on the current job, capture notes and readings, and finish the work cleanly.",
          supportTitle: "Field checklist",
          supportIntro: "Keep status, notes, and closeout controls close to the current work order.",
          supportItems: [
            "Move the job forward as the visit progresses.",
            "Capture notes and readings against the active work order.",
            "Generate the jobcard or report before you close out."
          ],
          selectedJobTitle: "Active work order",
          documentsTitle: "Document history",
          jobsTitle: "Assigned work"
        };
      case "dispatcher":
        return {
          title: "Dispatch workspace",
          body: "Plan visits, assign people, and keep communication tied to the job record.",
          supportTitle: "Dispatch checklist",
          supportIntro: "Use this view to confirm timing, move resources, and keep updates aligned.",
          supportItems: [
            "Confirm requests with the right technician and time window.",
            "Reschedule work from the record instead of side-channel changes.",
            "Send updates linked to the selected service record."
          ],
          selectedJobTitle: "Operational job context",
          documentsTitle: "Document history",
          jobsTitle: "Assigned work"
        };
      case "admin":
        return {
          title: "Admin workspace",
          body: "See platform state, manage settings, and review audit and recovery actions in one place.",
          supportTitle: "Admin checklist",
          supportIntro: "Keep oversight, audit access, and recovery actions visible without extra noise.",
          supportItems: [
            "Check health and audit surfaces from the same workspace.",
            "Review dispatch and output controls from one place.",
            "Keep recovery actions separate from daily work."
          ],
          selectedJobTitle: "Operational job context",
          documentsTitle: "Document history",
          jobsTitle: "Assigned work"
        };
      default:
        return {
          title: "Workspace",
          body: "",
          supportTitle: "Workspace guidance",
          supportIntro: "",
          supportItems: [],
          selectedJobTitle: "Selected job",
          documentsTitle: "Document history",
          jobsTitle: "Jobs"
        };
    }
  }, [role]);

  const priorities = React.useMemo<WorkspaceRailItem[]>(() => {
    switch (role) {
      case "client":
        return [
          {
            label: "Current work",
            detail: selectedJob ? `${selectedJob.job_id} is ${selectedJob.status}` : "Select a record to view live status."
          },
          {
            label: "Scheduling",
            detail: networkOnline ? "Preferred windows can be submitted now." : "Offline now; scheduling resumes when connectivity returns."
          },
          {
            label: "Published outputs",
            detail: generatedDocumentCount > 0 ? `${generatedDocumentCount} report or evidence rows loaded.` : "Published outputs appear after closeout."
          }
        ];
      case "technician":
        return [
          {
            label: "Field state",
            detail: selectedJob ? `Use ${selectedJob.job_id} as the active work order.` : "Select a work order before posting updates."
          },
          {
            label: "Queue",
            detail: queueCount > 0 ? `${queueCount} offline-safe changes are waiting.` : "No queued changes are waiting."
          },
          {
            label: "Closeout",
            detail: generatedDocumentCount > 0 ? `${generatedDocumentCount} outputs are visible in history.` : "Generate the current jobcard or report when the visit is ready."
          }
        ];
      case "dispatcher":
        return [
          {
            label: "Control window",
            detail: selectedJob ? `Dispatch is centred on ${selectedJob.job_id}.` : "Select a job to show schedule and outbound controls."
          },
          {
            label: "Queue",
            detail: queueCount > 0 ? `${queueCount} changes remain queued.` : "No queued changes are waiting."
          },
          {
            label: "Outbound",
            detail: networkOnline ? "Messaging rails are available from this session." : "Connectivity is offline; outbound messages may be delayed."
          }
        ];
      case "admin":
        return [
          {
            label: "Control window",
            detail: selectedJob ? `Administrative context is anchored on ${selectedJob.job_id}.` : "Select a job to align review and governance."
          },
          {
            label: "Audit surface",
            detail: generatedDocumentCount > 0 ? `${generatedDocumentCount} document records are loaded.` : "Load document history to verify closeout."
          },
          {
            label: "Platform posture",
            detail: networkOnline ? "Session is online and privileged actions are available." : "Connectivity is offline; avoid assuming privileged actions have landed."
          }
        ];
      default:
        return [];
    }
  }, [role, selectedJob, queueCount, generatedDocumentCount, networkOnline]);

  return (
    <section className="portal-header glass-panel flex flex-col lg:flex-row gap-6 p-6 lg:p-8 mb-8 overflow-hidden relative">
      <div className="relative z-10 flex-1">
        <h1 className="text-2xl font-bold text-white mb-2">{brief.title}</h1>
        <p className="opacity-75 mb-6 max-w-3xl leading-relaxed">{brief.body}</p>
        
        <div className="portal-header__priorities">
          {priorities.map((item) => (
            <div key={item.label} className="priority-item glass-panel-inner p-4 hover:border-primary/50 transition-colors">
              <strong className="block text-white text-sm uppercase tracking-wider mb-1 opacity-90">{item.label}</strong>
              <span className="text-sm opacity-75">{item.detail}</span>
            </div>
          ))}
        </div>
      </div>
      
      <aside className="portal-header__support glass-panel-inner lg:w-80 shrink-0 p-5 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-primary font-semibold mb-2">{brief.supportTitle}</h3>
          <p className="text-sm opacity-75 mb-4 leading-relaxed">{brief.supportIntro}</p>
          <ul className="list-disc pl-5 text-sm opacity-75 space-y-2">
            {brief.supportItems.map((item, idx) => (
              <li key={idx} className="leading-snug">{item}</li>
            ))}
          </ul>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
      </aside>

      <style>{`
        /* Flexbox and layout utilities for WorkspaceInfo */
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .flex-1 { flex: 1; }
        .gap-6 { gap: 1.5rem; }
        .p-4 { padding: 1rem; }
        .p-5 { padding: 1.25rem; }
        .p-6 { padding: 1.5rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .pl-5 { padding-left: 1.25rem; }
        .w-32 { width: 8rem; }
        .h-32 { height: 8rem; }
        .max-w-3xl { max-width: 48rem; }
        .shrink-0 { flex-shrink: 0; }
        
        .text-2xl { font-size: 1.5rem; line-height: 2rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .text-white { color: #fff; }
        .text-primary { color: var(--color-primary); }
        .uppercase { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.05em; }
        .leading-relaxed { line-height: 1.625; }
        .leading-snug { line-height: 1.375; }
        
        .opacity-75 { opacity: 0.75; }
        .opacity-90 { opacity: 0.9; }
        .block { display: block; }
        .list-disc { list-style-type: disc; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        
        .relative { position: relative; }
        .absolute { position: absolute; }
        .overflow-hidden { overflow: hidden; }
        .z-10 { z-index: 10; }
        .top-0 { top: 0; }
        .right-0 { right: 0; }
        
        .bg-primary\\/10 { background-color: rgba(var(--color-primary-rgb), 0.1); }
        .rounded-full { border-radius: 9999px; }
        .blur-2xl { filter: blur(40px); }
        .transform { transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0)); }
        .translate-x-1\\/2 { --tw-translate-x: 50%; }
        .-translate-y-1\\/2 { --tw-translate-y: -50%; }
        
        .transition-colors { transition-property: color, background-color, border-color, fill, stroke; transition-duration: 0.2s; }
        .hover\\:border-primary\\/50:hover { border-color: rgba(var(--color-primary-rgb), 0.5); }

        /* Glassmorphism */
        .glass-panel {
          background: rgba(20, 20, 25, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        
        .glass-panel-inner {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .portal-header__priorities {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .portal-header__priorities {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .lg\\:flex-row { flex-direction: row; }
          .lg\\:p-8 { padding: 2rem; }
          .lg\\:w-80 { width: 20rem; }
        }
      `}</style>
    </section>
  );
}
