import { describe, expect, it, vi, beforeEach } from "vitest";
import * as React from "react";
import { usePortalActionControllers } from "../src/appShell/usePortalActionControllers";
import { apiClient } from "../src/apiClient/client";

// Mock React hooks
vi.mock("react", () => ({
  useCallback: (fn: any) => fn,
  startTransition: (fn: any) => fn(),
  useState: (initial: any) => [initial, vi.fn()],
  useEffect: vi.fn(),
  useMemo: (fn: any) => fn(),
  useRef: (initial: any) => ({ current: initial }),
}));

// Mock the apiClient
vi.mock("../src/apiClient/client", () => ({
  apiClient: {
    login: vi.fn(),
    logout: vi.fn(),
    adminHealth: vi.fn(),
    adminAudits: vi.fn(),
    adminAutomationJobs: vi.fn(),
    retryAutomation: vi.fn(),
    syncPerson: vi.fn(),
    updateStatus: vi.fn(),
    addNote: vi.fn(),
    dispatchContext: vi.fn(),
    publishDocument: vi.fn(),
  },
}));

describe("Portal Action Controllers (Logic Layer)", () => {
  const mockSetLoading = vi.fn();
  const mockSetSession = vi.fn();
  const mockRefreshSession = vi.fn();
  const mockRefreshJobs = vi.fn();
  const mockSetActiveWorkspaceTool = vi.fn();
  const mockSetPortalView = vi.fn();
  const mockSetFeedback = vi.fn();

  const defaultArgs: any = {
    session: null,
    authConfig: { google_client_id: "test-id" },
    productionAuth: true,
    loginToken: "test-token",
    setLoading: mockSetLoading,
    setSession: mockSetSession,
    refreshSession: mockRefreshSession,
    refreshJobs: mockRefreshJobs,
    setActiveWorkspaceTool: mockSetActiveWorkspaceTool,
    setPortalView: mockSetPortalView,
    setFeedback: mockSetFeedback,
    setEmulatedRole: vi.fn(),
    selectedJob: null,
    selectableStatuses: [],
    statusTarget: "draft",
    offlineEnabled: false,
    networkOnline: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication Handshake", () => {
    it("successfully logs in and initializes workspace", async () => {
      const controllers = usePortalActionControllers(defaultArgs);
      
      (apiClient.login as any).mockResolvedValue({ success: true });
      mockRefreshSession.mockResolvedValue({ user: { role: "admin" } });

      await controllers.handleLogin("test-token");

      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(apiClient.login).toHaveBeenCalledWith("test-token", { gsiClientId: "test-id" });
      expect(mockRefreshSession).toHaveBeenCalled();
      expect(mockRefreshJobs).toHaveBeenCalled();
      expect(mockSetActiveWorkspaceTool).toHaveBeenCalledWith("jobs");
      expect(mockSetPortalView).toHaveBeenCalledWith("dashboard");
      expect(mockSetFeedback).toHaveBeenCalledWith("Signed in.");
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it("handles login failure with formatted API feedback", async () => {
      const controllers = usePortalActionControllers(defaultArgs);
      
      // Mock a canonical API error response
      (apiClient.login as any).mockRejectedValue({
        error: {
          code: "invalid_token",
          message: "The provided token is invalid"
        },
        correlation_id: "corr-123"
      });

      await controllers.handleLogin("bad-token");

      expect(mockSetFeedback).toHaveBeenCalledWith("The provided token is invalid [invalid_token] (corr: corr-123)");
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });

  describe("Job Status Governance", () => {
    it("prevents status update when no job is selected", async () => {
      const controllers = usePortalActionControllers(defaultArgs);
      await controllers.handleStatusUpdate();
      expect(apiClient.updateStatus).not.toHaveBeenCalled();
    });

    it("executes status update and refreshes jobs on success", async () => {
      const argsWithJob = {
        ...defaultArgs,
        selectedJob: { job_id: "JOB-1", row_version: 1, status: "draft" },
        selectableStatuses: ["performed"],
        statusTarget: "performed"
      };
      const controllers = usePortalActionControllers(argsWithJob);
      
      (apiClient.updateStatus as any).mockResolvedValue({ success: true });

      await controllers.handleStatusUpdate();

      expect(apiClient.updateStatus).toHaveBeenCalledWith("JOB-1", "performed", 1);
      expect(mockRefreshJobs).toHaveBeenCalled();
      expect(mockSetFeedback).toHaveBeenCalledWith("Status updated.");
    });
  });
});
