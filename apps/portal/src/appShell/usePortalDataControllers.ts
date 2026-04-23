import { startTransition, useCallback } from "react";
import type {
  AutomationJobEntry,
  OpsIntelligencePayload,
  PeopleDirectoryEntry,
  PortalAuthConfig,
  PortalSession,
  SchemaDriftPayload,
  UpgradeWorkspaceState
} from "../apiClient";
import { apiClient } from "../apiClient";
import { listQueuedMutations } from "../offline/queue";
import { asJob, errorMessage, isUnauthorizedError, normalizeDocument, normalizeSchedule, normalizeScheduleRequest, normalizeUser } from "./helpers";
import type { JobRecord } from "../components/JobListView";

export function usePortalDataControllers(args: {
  session: PortalSession | null;
  selectedJobid: string;
  canAccessPeopleDirectory: boolean;
  documentAccessDenied: boolean;
  setJobs: React.Dispatch<React.SetStateAction<JobRecord[]>>;
  setSession: React.Dispatch<React.SetStateAction<PortalSession | null>>;
  setSelectedJobid: (value: string) => void;
  setDocuments: React.Dispatch<React.SetStateAction<Array<Record<string, unknown>>>>;
  setPeopleDirectory: React.Dispatch<React.SetStateAction<PeopleDirectoryEntry[]>>;
  setAutomationJobs: React.Dispatch<React.SetStateAction<AutomationJobEntry[]>>;
  setUpgradeState: React.Dispatch<React.SetStateAction<UpgradeWorkspaceState>>;
  setDocumentAccessDenied: (value: boolean) => void;
  setSchemaDrift: React.Dispatch<React.SetStateAction<SchemaDriftPayload | null>>;
  setOpsIntelligence: React.Dispatch<React.SetStateAction<OpsIntelligencePayload | null>>;
  setFeedback: (value: string) => void;
  setQueueCount: (value: number) => void;
}): {
  refreshQueueCount: () => Promise<void>;
  refreshJobs: () => Promise<void>;
  refreshDocuments: (jobid?: string) => Promise<void>;
  refreshPeopleDirectory: () => Promise<void>;
  refreshUpgradeWorkspaceState: () => Promise<void>;
  refreshAutomationJobs: () => Promise<void>;
  loadSchemaDrift: () => Promise<void>;
  loadOpsIntelligence: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshAuthConfig: () => Promise<PortalAuthConfig | null>;
} {
  const {
    session,
    selectedJobid,
    canAccessPeopleDirectory,
    documentAccessDenied,
    setJobs,
    setSession,
    setSelectedJobid,
    setDocuments,
    setPeopleDirectory,
    setDocumentAccessDenied,
    setAutomationJobs,
    setUpgradeState,
    setSchemaDrift,
    setOpsIntelligence,
    setFeedback,
    setQueueCount,
  } = args;

  const refreshQueueCount = useCallback(async (): Promise<void> => {
    try {
      const queue = await listQueuedMutations();
      setQueueCount(queue.length);
    } catch (error) {
      setQueueCount(0);
      setFeedback(`Offline queue unavailable: ${errorMessage(error)}`);
    }
  }, [setFeedback, setQueueCount]);

  const refreshJobs = useCallback(async (): Promise<void> => {
    if (!session) return;
    try {
      const data = await apiClient.listJobs();
      const mapped = data.map(asJob).filter((job) => job.job_id !== "");
      startTransition(() => {
        setJobs(mapped);
        if (!mapped.some((job) => job.job_id === selectedJobid)) {
          setSelectedJobid(mapped[0]?.job_id ?? "");
        }
      });
    } catch (error) {
      setFeedback(`Jobs load failed: ${errorMessage(error)}`);
    }
  }, [session, selectedJobid, setFeedback, setJobs, setSelectedJobid]);

  const refreshDocuments = useCallback(async (jobid?: string): Promise<void> => {
    if (documentAccessDenied) return;
    try {
      const response = await apiClient.history(jobid);
      startTransition(() => {
        const normalized = (response.data ?? []).map((row) => normalizeDocument(row));
        setDocuments(normalized as unknown as Array<Record<string, unknown>>);
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setDocumentAccessDenied(true);
        setDocuments([]);
        setFeedback("Document access is unavailable for this account.");
        return;
      }
      setFeedback(`Document history load failed: ${errorMessage(error)}`);
    }
  }, [documentAccessDenied, setDocumentAccessDenied, setDocuments, setFeedback]);

  const refreshPeopleDirectory = useCallback(async (): Promise<void> => {
    if (!canAccessPeopleDirectory) return;
    try {
      const people = await apiClient.listPeople();
      startTransition(() => {
        setPeopleDirectory(people.map((row) => normalizeUser(row as unknown as Record<string, unknown>)));
      });
    } catch (error) {
      setFeedback(`People directory load failed: ${errorMessage(error)}`);
    }
  }, [canAccessPeopleDirectory, setFeedback, setPeopleDirectory]);

  const refreshUpgradeWorkspaceState = useCallback(async (): Promise<void> => {
    try {
      const data = await apiClient.getUpgradeWorkspaceState();
      startTransition(() => setUpgradeState(data));
    } catch (error) {
      setFeedback(`Upgrade workspace load failed: ${errorMessage(error)}`);
    }
  }, [setFeedback, setUpgradeState]);

  const refreshAutomationJobs = useCallback(async (): Promise<void> => {
    try {
      const jobs = await apiClient.listAutomationJobs();
      startTransition(() => setAutomationJobs(jobs));
    } catch (error) {
      setFeedback(`Automation queue load failed: ${errorMessage(error)}`);
    }
  }, [setAutomationJobs, setFeedback]);

  const loadSchemaDrift = useCallback(async (): Promise<void> => {
    try {
      const payload = await apiClient.schemaDrift();
      setSchemaDrift(payload);
      setFeedback(payload.healthy ? "Schema drift scan passed." : `Schema drift detected: ${payload.issue_count} issue(s).`);
    } catch (error) {
      setFeedback(`Schema drift scan failed: ${errorMessage(error)}`);
    }
  }, [setFeedback, setSchemaDrift]);

  const loadOpsIntelligence = useCallback(async (): Promise<void> => {
    try {
      const payload = await apiClient.opsIntelligence();
      setOpsIntelligence(payload);
      setFeedback("Operational intelligence refreshed.");
    } catch (error) {
      setFeedback(`Operational intelligence failed: ${errorMessage(error)}`);
    }
  }, [setFeedback, setOpsIntelligence]);

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const activeSession = await apiClient.session();
      startTransition(() => setSession(activeSession));
    } catch {
      startTransition(() => setSession(null));
    }
  }, [setSession]);

  const refreshAuthConfig = useCallback(async (): Promise<PortalAuthConfig | null> => {
    try {
      return await apiClient.authConfig();
    } catch (error) {
      setFeedback(`Auth config failed: ${errorMessage(error)}`);
      return null;
    }
  }, [setFeedback]);

  return {
    refreshQueueCount,
    refreshJobs,
    refreshDocuments,
    refreshPeopleDirectory,
    refreshUpgradeWorkspaceState,
    refreshAutomationJobs,
    loadSchemaDrift,
    loadOpsIntelligence,
    refreshSession,
    refreshAuthConfig
  };
}
