import { describe, expect, it } from "vitest";
import { loginAs, makeTestApp } from "./helpers";

describe("contract: dispatch workspace flows", () => {
  it("covers request, confirm, reschedule, people, and publish against live records", async () => {
    const app = makeTestApp();

    const clientCookie = await loginAs(app, "dev-client");
    const requestResponse = await app.request("/api/v1/schedules/request-slot", {
      method: "POST",
      headers: {
        cookie: clientCookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        job_id: "JOB-1001",
        preferred_slots: [
          {
            start_at: "2026-04-17T08:00:00.000Z",
            end_at: "2026-04-17T09:00:00.000Z"
          }
        ],
        timezone: "Africa/Johannesburg",
        notes: "",
        row_version: 1
      })
    });

    expect(requestResponse.status).toBe(200);
    const requestBody = (await requestResponse.json()) as {
      data: { request_id: string; row_version: number };
    };

    const dispatcherCookie = await loginAs(app, "dev-dispatcher");

    const peopleResponse = await app.request("/api/v1/workspace/people", {
      method: "GET",
      headers: {
        cookie: dispatcherCookie
      }
    });
    expect(peopleResponse.status).toBe(200);
    const peopleBody = (await peopleResponse.json()) as {
      data: Array<{ role: string; technician_id: string }>;
    };
    expect(peopleBody.data.some((person) => person.role === "technician" && person.technician_id === "TECH-001")).toBe(true);

    const initialContextResponse = await app.request("/api/v1/workspace/dispatch-context?job_id=JOB-1001", {
      method: "GET",
      headers: {
        cookie: dispatcherCookie
      }
    });
    expect(initialContextResponse.status).toBe(200);
    const initialContextBody = (await initialContextResponse.json()) as {
      data: { requests: Array<{ request_id: string }>; technicians: Array<{ technician_id: string }> };
    };
    expect(initialContextBody.data.requests.some((request) => request.request_id === requestBody.data.request_id)).toBe(true);
    expect(initialContextBody.data.technicians.some((technician) => technician.technician_id === "TECH-001")).toBe(true);

    const confirmResponse = await app.request("/api/v1/schedules/confirm", {
      method: "POST",
      headers: {
        cookie: dispatcherCookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        request_id: requestBody.data.request_id,
        start_at: "2026-04-17T08:00:00.000Z",
        end_at: "2026-04-17T09:00:00.000Z",
        technician_id: "TECH-001",
        row_version: requestBody.data.row_version,
        job_id: "JOB-1001"
      })
    });

    expect(confirmResponse.status).toBe(200);
    const confirmBody = (await confirmResponse.json()) as {
      data: { schedule_id: string; row_version: number };
    };

    const rescheduleResponse = await app.request("/api/v1/schedules/reschedule", {
      method: "POST",
      headers: {
        cookie: dispatcherCookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        schedule_id: confirmBody.data.schedule_id,
        start_at: "2026-04-17T10:00:00.000Z",
        end_at: "2026-04-17T11:00:00.000Z",
        row_version: confirmBody.data.row_version,
        job_id: "JOB-1001",
        technician_id: "TECH-001",
        request_id: requestBody.data.request_id
      })
    });
    expect(rescheduleResponse.status).toBe(200);

    const generateResponse = await app.request("/api/v1/documents/generate", {
      method: "POST",
      headers: {
        cookie: dispatcherCookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        job_id: "JOB-1001",
        document_type: "jobcard",
        tokens: {}
      })
    });
    expect(generateResponse.status).toBe(200);
    const generateBody = (await generateResponse.json()) as {
      data: { document_id: string; row_version: number };
    };

    const publishResponse = await app.request("/api/v1/documents/publish", {
      method: "POST",
      headers: {
        cookie: dispatcherCookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        document_id: generateBody.data.document_id,
        row_version: generateBody.data.row_version,
        job_id: "JOB-1001",
        document_type: "jobcard"
      })
    });
    expect(publishResponse.status).toBe(200);
    const publishBody = (await publishResponse.json()) as {
      data: { status: string; published_url: string };
    };
    expect(publishBody.data.status).toBe("published");
    expect(typeof publishBody.data.published_url).toBe("string");

    const finalContextResponse = await app.request("/api/v1/workspace/dispatch-context?job_id=JOB-1001", {
      method: "GET",
      headers: {
        cookie: dispatcherCookie
      }
    });
    expect(finalContextResponse.status).toBe(200);
    const finalContextBody = (await finalContextResponse.json()) as {
      data: {
        schedules: Array<{ schedule_id: string; status: string }>;
        documents: Array<{ document_id: string; status: string; published_url: string }>;
      };
    };

    expect(finalContextBody.data.schedules.some((schedule) => schedule.schedule_id === confirmBody.data.schedule_id && schedule.status === "rescheduled")).toBe(true);
    expect(finalContextBody.data.documents.some((document) => document.document_id === generateBody.data.document_id && document.status === "published")).toBe(true);
  });
});
