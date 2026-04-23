import { useEffect, useState, useRef } from 'react';
import { apiClient } from '../apiClient';
import type { JobEventRow } from '@kharon/domain';

export function useLiveSync(jobId: string | null) {
  const [liveEvents, setLiveEvents] = useState<JobEventRow[]>([]);
  const lastSyncRef = useRef<string>(new Date().toISOString());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId) {
      setLiveEvents([]);
      return;
    }

    const poll = async () => {
      try {
        const response = await apiClient.pullSyncData(lastSyncRef.current);
        if (response && response.events.length > 0) {
          const newEvents = response.events.filter((e: JobEventRow) => e.job_id === jobId);
          if (newEvents.length > 0) {
            setLiveEvents(prev => [...newEvents, ...prev].slice(0, 100));
            lastSyncRef.current = new Date().toISOString();
          }
        }
      } catch (err) {
        void err;
      }
      timerRef.current = setTimeout(poll, 5000); // 5s pseudo-live
    };

    poll();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [jobId]);

  return liveEvents;
}
