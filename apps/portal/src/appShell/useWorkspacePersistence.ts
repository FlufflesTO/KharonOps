import { useEffect } from "react";
import type { JobStatus } from "@kharon/domain";

export function useWorkspacePersistence(args: {
  selectedJobid: string;
  statusTarget: JobStatus;
  activeWorkspaceTool: string;
  setSelectedJobid: (value: string) => void;
  setStatusTarget: (value: JobStatus) => void;
  setActiveWorkspaceTool: (value: string) => void;
}): void {
  const {
    selectedJobid,
    statusTarget,
    activeWorkspaceTool,
    setSelectedJobid,
    setStatusTarget,
    setActiveWorkspaceTool
  } = args;

  useEffect(() => {
    const saved = localStorage.getItem("kharon_workspace_state");
    if (!saved) {
      return;
    }
    try {
      const state = JSON.parse(saved) as {
        selectedJobid?: string;
        statusTarget?: JobStatus;
        activeWorkspaceTool?: string;
      };
      if (state.selectedJobid) setSelectedJobid(state.selectedJobid);
      if (state.statusTarget) setStatusTarget(state.statusTarget);
      if (state.activeWorkspaceTool) setActiveWorkspaceTool(state.activeWorkspaceTool);
    } catch (error) {
      console.warn("Restore failed", error);
    }
  }, [setActiveWorkspaceTool, setSelectedJobid, setStatusTarget]);

  useEffect(() => {
    localStorage.setItem(
      "kharon_workspace_state",
      JSON.stringify({
        selectedJobid,
        statusTarget,
        activeWorkspaceTool
      })
    );
  }, [activeWorkspaceTool, selectedJobid, statusTarget]);
}
