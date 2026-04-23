import { startTransition, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { JobEventRow } from "@kharon/domain";
import { apiClient } from "../apiClient";
import { asJob, errorCode, normalizeJobEvent } from "./helpers";
import type { JobRecord } from "../components/JobListView";

export function useLiveSyncController(args: {
  sessionActive: boolean;
  networkOnline: boolean;
  lastSyncPullAt: string;
  setLastSyncPullAt: (value: string) => void;
  setSyncPulse: (value: { at: string; jobsChanged: number; queueChanged: number }) => void;
  setJobs: Dispatch<SetStateAction<JobRecord[]>>;
  setJobEvents: Dispatch<SetStateAction<JobEventRow[]>>;
}): void {
  const {
    sessionActive,
    networkOnline,
    lastSyncPullAt,
    setLastSyncPullAt,
    setSyncPulse,
    setJobs,
    setJobEvents
  } = args;

  const lastPullRef = useRef(lastSyncPullAt);
  useEffect(() => {
    lastPullRef.current = lastSyncPullAt;
  }, [lastSyncPullAt]);

  useEffect(() => {
    if (!sessionActive || !networkOnline) {
      return;
    }

    const poll = async () => {
      try {
        const since = lastPullRef.current || new Date(0).toISOString();
        const response = await apiClient.syncPull(since);
        const jobsChanged = response.jobs?.length ?? 0;
        const queueChanged = response.queue?.length ?? 0;
        const eventsChanged = response.events?.length ?? 0;

        if (jobsChanged > 0 || eventsChanged > 0) {
          startTransition(() => {
            if (jobsChanged > 0) {
              const incoming = (response.jobs ?? []).map(asJob);
              setJobs((prev) => {
                const next = [...prev];
                for (const job of incoming) {
                  const idx = next.findIndex((j) => j.job_id === job.job_id);
                  if (idx >= 0) {
                    if (Date.parse(job.updated_at || "") >= Date.parse(next[idx]?.updated_at || "")) {
                      next[idx] = job;
                    }
                  } else {
                    next.push(job);
                  }
                }
                return next;
              });
            }

            if (eventsChanged > 0) {
              const incomingEvents = (response.events ?? []).map((e) => normalizeJobEvent(e as unknown as Record<string, unknown>));
              setJobEvents((prev) => {
                const next = [...prev];
                for (const ev of incomingEvents) {
                  if (!next.some((existing) => existing.event_id === ev.event_id)) {
                    next.push(ev);
                  }
                }
                return next;
              });
            }
          });
        }

        const at = new Date().toISOString();
        setLastSyncPullAt(at);
        setSyncPulse({ at, jobsChanged, queueChanged });
      } catch (error) {
        if (errorCode(error) === "google_transient_error") {
          console.warn("Sync pull deferred due to 429 quota limit.");
          return;
        }
        console.error("Sync pull failed", error);
      }
    };

    void poll();
    const intervalId = window.setInterval(poll, 60000);
    return () => window.clearInterval(intervalId);
  }, [networkOnline, sessionActive, setJobEvents, setJobs, setLastSyncPullAt, setSyncPulse]);
}
