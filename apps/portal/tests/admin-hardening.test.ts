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
  createElement: vi.fn(),
  JSX: { Element: vi.fn() }
}));

// Mock the apiClient
vi.mock("../src/apiClient/client", () => ({
  apiClient: {
    adminHealth: vi.fn(),
    adminAudits: vi.fn(),
    adminAutomationJobs: vi.fn(),
    retryAutomation: vi.fn(),
  },
}));

describe("Admin Hardening (Component-Controller Integration)", () => {
  const mockSetFeedback = vi.fn();
  const mockSetAdminHealth = vi.fn();
  const mockSetAdminHealthState = vi.fn();
  const mockSetAdminHealthMessage = vi.fn();

  const defaultArgs: any = {
    setLoading: vi.fn(),
    setFeedback: mockSetFeedback,
    setAdminHealth: mockSetAdminHealth,
    setAdminHealthState: mockSetAdminHealthState,
    setAdminHealthMessage: mockSetAdminHealthMessage,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Telemetry Handshake logic", () => {
    it("updates state to ready on successful health check", async () => {
      const controllers = usePortalActionControllers(defaultArgs);
      
      const mockHealth = { database: "ok", memory: "low" };
      (apiClient.adminHealth as any).mockResolvedValue({ data: mockHealth });

      await controllers.loadAdminHealth();

      expect(mockSetAdminHealthState).toHaveBeenCalledWith("loading");
      expect(mockSetAdminHealth).toHaveBeenCalledWith(mockHealth);
      expect(mockSetAdminHealthState).toHaveBeenCalledWith("ready");
      expect(mockSetFeedback).toHaveBeenCalledWith("System summary refreshed.");
    });

    it("handles unauthorized response with specific feedback", async () => {
      const controllers = usePortalActionControllers(defaultArgs);
      
      (apiClient.adminHealth as any).mockRejectedValue({
        error: { code: "unauthorized", message: "Forbidden" }
      });

      await controllers.loadAdminHealth();

      expect(mockSetAdminHealthState).toHaveBeenCalledWith("unauthorized");
      expect(mockSetAdminHealthMessage).toHaveBeenCalledWith("This account cannot view platform health.");
      expect(mockSetFeedback).toHaveBeenCalledWith("Platform health is unavailable for this account.");
    });

    it("handles generic error in health check", async () => {
      const controllers = usePortalActionControllers(defaultArgs);
      
      (apiClient.adminHealth as any).mockRejectedValue(new Error("Timeout"));

      await controllers.loadAdminHealth();

      // First call is to clear the message, second is the actual error
      expect(mockSetAdminHealthMessage).toHaveBeenCalledWith("");
      expect(mockSetAdminHealthState).toHaveBeenCalledWith("error");
      expect(mockSetAdminHealthMessage).toHaveBeenCalledWith("Error: Timeout");
      expect(mockSetFeedback).toHaveBeenCalledWith("Platform health failed: Error: Timeout");
    });
  });
});
