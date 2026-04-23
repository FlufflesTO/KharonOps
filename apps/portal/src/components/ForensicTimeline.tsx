/**
 * Project KharonOps - Forensic Timeline
 * Purpose: Compact event history for the selected job.
 */

import React from 'react';
import type { JobEventRow } from "@kharon/domain";
import { useLiveSync } from '../hooks/useLiveSync';
import { PresenceIndicator } from './PresenceIndicator';

interface ForensicTimelineProps {
  events: JobEventRow[];
  jobId: string;
}

export const ForensicTimeline: React.FC<ForensicTimelineProps> = ({ events, jobId }) => {
  const liveEvents = useLiveSync(jobId);
  
  const jobEvents = React.useMemo(() => {
    const combined = [...liveEvents, ...events];
    // De-duplicate by event_id
    const seen = new Set();
    const unique = combined.filter(e => {
      if (seen.has(e.event_id)) return false;
      seen.add(e.event_id);
      return true;
    });

    return unique
      .filter((e) => e.job_id === jobId)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [events, liveEvents, jobId]);

  if (jobEvents.length === 0) {
    return (
    <div className="forensic-empty glass-panel">
        <div className="empty-pulse"></div>
        <p>No activity yet for this job.</p>
      </div>
    );
  }

  return (
    <div className="forensic-container">
      <div className="forensic-header">
        <div className="header-badge">
          <span className="pulse-dot"></span>
          LIVE AUDIT LOG
        </div>
        <div className="flex items-center gap-4">
           <PresenceIndicator userId="system-monitor" className="opacity-80" />
          <span className="event-count">{jobEvents.length} events</span>
        </div>
      </div>

      <div className="forensic-feed">
        {jobEvents.map((event, idx) => (
          <TimelineItem
            key={event.event_id}
            event={event}
            isLatest={idx === 0}
          />
        ))}
      </div>

      <style>{`
        .forensic-container {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .forensic-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 0.5rem;
        }
        .header-badge {
          background: rgba(var(--color-primary-rgb, 124, 58, 237), 0.1);
          color: var(--color-primary);
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid rgba(var(--color-primary-rgb), 0.2);
        }
        .pulse-dot {
          width: 6px;
          height: 6px;
          background: var(--color-primary);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--color-primary);
          animation: audit-pulse 2s infinite;
        }
        @keyframes audit-pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        .forensic-feed {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .forensic-feed::before {
          content: '';
          position: absolute;
          left: 1.25rem;
          top: 1rem;
          bottom: 1rem;
          width: 1px;
          background: linear-gradient(to bottom, var(--color-primary), transparent);
          opacity: 0.3;
        }
        .forensic-item {
          display: flex;
          gap: 1.25rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          transition: all 0.2s ease;
          position: relative;
        }
        .forensic-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateX(4px);
        }
        .forensic-item--latest {
          background: rgba(var(--color-primary-rgb), 0.05);
          border-color: rgba(var(--color-primary-rgb), 0.2);
          animation: slide-in 0.3s ease-out;
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .node-marker {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--color-bg);
          border: 2px solid rgba(255, 255, 255, 0.3);
          margin-top: 0.35rem;
          flex-shrink: 0;
          z-index: 2;
        }
        .forensic-item--latest .node-marker {
          background: var(--color-primary);
          border-color: var(--color-primary);
          box-shadow: 0 0 15px var(--color-primary);
        }
        .item-content {
          flex: 1;
          min-width: 0;
        }
        .item-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
        }
        .item-type {
          font-size: 0.65rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.05em;
        }
        .item-time {
          font-size: 0.65rem;
          opacity: 0.4;
        }
        .item-count {
           font-size: 0.7rem;
           font-weight: 600;
           opacity: 0.5;
           letter-spacing: 0.05em;
        }
        .item-body {
          font-size: 0.85rem;
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.9);
        }
        .item-footer {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px dashed rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.3);
        }
        .payload-highlight {
          color: var(--color-primary);
          font-weight: 600;
        }
        .note-bubble {
          background: rgba(0, 0, 0, 0.2);
          padding: 0.6rem 0.8rem;
          border-radius: 6px;
          margin-top: 0.4rem;
          font-style: italic;
          border-left: 2px solid var(--color-primary);
        }
        .forensic-empty {
          text-align: center;
          padding: 3rem;
          border: 1px dashed rgba(255, 255, 255, 0.1);
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
};

const TimelineItem: React.FC<{ event: JobEventRow; isLatest: boolean }> = ({ event, isLatest }) => {
  const payload = React.useMemo(() => {
    try {
      return typeof event.payload_json === 'string' ? JSON.parse(event.payload_json) : event.payload_json;
    } catch { return {}; }
  }, [event.payload_json]);

  const renderMessage = () => {
    switch (event.event_type) {
      case 'STATUS_CHANGE':
      case 'status_changed':
        return (
          <span>
            Status changed from <span className="payload-highlight">{payload.from}</span> to <span className="payload-highlight">{payload.to}</span>
          </span>
        );
      case 'NOTE_ADDED':
      case 'note_added':
        return (
          <div>
            Note added:
            <div className="note-bubble">"{payload.note}"</div>
          </div>
        );
      case 'DOCUMENT_PUBLISHED':
      case 'documents.publish':
        return (
          <span>
            Document <span className="payload-highlight">{payload.document_type || 'PDF'}</span> published.
          </span>
        );
      case 'SCHEDULE_CONFIRMED':
        return (
          <span>
            Service window confirmed: <span className="payload-highlight">{new Date(payload.start_at).toLocaleDateString()}</span>
          </span>
        );
      default:
        return <span>{event.event_type.replace(/_/g, ' ')} initialized.</span>;
    }
  };

  return (
    <div className={`forensic-item ${isLatest ? 'forensic-item--latest' : ''}`}>
      <div className="node-marker" />
      <div className="item-content">
        <div className="item-meta">
          <span className="item-type">{event.event_type.toUpperCase()}</span>
          <span className="item-time">{new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
        <div className="item-body">
          {renderMessage()}
        </div>
        <div className="item-footer">
          <span>ACTOR: {event.created_by || 'SYSTEM'}</span>
          <span>EID: {event.event_id.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  );
};
