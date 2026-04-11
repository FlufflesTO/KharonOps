import { z } from "zod";

export const googleLoginSchema = z.object({
  id_token: z.string().min(5)
});

export const statusUpdateSchema = z.object({
  status: z.enum(["draft", "performed", "rejected", "approved", "certified", "cancelled"]),
  row_version: z.number().int().nonnegative()
});

export const noteSchema = z.object({
  note: z.string().trim().min(1).max(4000),
  row_version: z.number().int().nonnegative()
});

export const scheduleRequestSchema = z.object({
  job_uid: z.string().trim().min(1),
  preferred_slots: z.array(z.object({ start_at: z.string().datetime(), end_at: z.string().datetime() })).min(1),
  timezone: z.string().trim().min(1),
  notes: z.string().trim().max(1200).default(""),
  row_version: z.number().int().nonnegative()
});

export const scheduleConfirmSchema = z.object({
  request_uid: z.string().trim().min(1),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  technician_uid: z.string().trim().min(1),
  row_version: z.number().int().nonnegative(),
  job_uid: z.string().trim().min(1).optional()
});

export const scheduleRescheduleSchema = z.object({
  schedule_uid: z.string().trim().min(1),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  row_version: z.number().int().nonnegative(),
  job_uid: z.string().trim().min(1).optional(),
  technician_uid: z.string().trim().min(1).optional(),
  request_uid: z.string().trim().min(1).optional(),
  calendar_event_id: z.string().trim().optional()
});

export const documentGenerateSchema = z.object({
  job_uid: z.string().trim().min(1),
  document_type: z.enum(["jobcard", "service_report"]),
  tokens: z.record(z.string(), z.string()).default({})
});

export const documentPublishSchema = z.object({
  document_uid: z.string().trim().min(1),
  row_version: z.number().int().nonnegative(),
  client_visible: z.boolean().default(true),
  job_uid: z.string().trim().min(1).optional(),
  document_type: z.enum(["jobcard", "service_report"]).optional()
});

export const syncMutationSchema = z.discriminatedUnion("kind", [
  z.object({
    mutation_id: z.string().trim().min(1),
    kind: z.literal("job_status"),
    job_uid: z.string().trim().min(1),
    expected_row_version: z.number().int().nonnegative(),
    payload: z.object({
      status: z.enum(["draft", "performed", "rejected", "approved", "certified", "cancelled"])
    })
  }),
  z.object({
    mutation_id: z.string().trim().min(1),
    kind: z.literal("job_note"),
    job_uid: z.string().trim().min(1),
    expected_row_version: z.number().int().nonnegative(),
    payload: z.object({
      note: z.string().trim().min(1).max(4000)
    })
  })
]);

export const syncPushSchema = z.object({
  mutations: z.array(syncMutationSchema).max(100)
});

export const resolveConflictSchema = z.object({
  job_uid: z.string().trim().min(1),
  strategy: z.enum(["server", "client", "merge"]),
  server_row_version: z.number().int().nonnegative(),
  client_row_version: z.number().int().nonnegative(),
  merge_patch: z.record(z.string(), z.unknown()).optional()
});

export const gmailNotifySchema = z.object({
  to: z.string().email(),
  subject: z.string().trim().min(1),
  body: z.string().trim().min(1),
  job_uid: z.string().trim().min(1)
});

export const chatAlertSchema = z.object({
  severity: z.enum(["info", "warning", "critical"]),
  message: z.string().trim().min(1),
  job_uid: z.string().trim().optional()
});

export const peopleSyncSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  phone: z.string().trim().min(6),
  role_hint: z.enum(["client", "technician", "dispatcher", "admin"]).optional()
});
