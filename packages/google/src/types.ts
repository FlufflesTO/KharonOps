import type { DocumentType } from "@kharon/domain";

export type RowRecord = Record<string, string>;

export type StructuralToken =
  | { type: "text"; value: string }
  | { type: "matrix"; rows: Array<Record<string, string>> }
  | { type: "image"; dataUri: string; width?: number; height?: number };

export interface GoogleRuntimeConfig {
  mode: "local" | "production";
  googleClientId: string;
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
  delegatedServiceAccountEmail: string;
  delegatedServiceAccountPrivateKey: string;
  impersonatedUser: string;
  workbookSpreadsheetId: string;
  driveRootFolderId: string;
  jobcardTemplateId: string;
  serviceReportTemplateId: string;
  gasServiceReportTemplateId: string;
  fireCertificateTemplateId: string;
  gasCertificateTemplateId: string;
  calendarId: string;
  gmailSenderAddress: string;
  chatWebhookUrl: string;
}

export interface SheetsRail {
  ensureWorkbookSchema: (headersBySheet: Record<string, string[]>) => Promise<void>;
  getRows: (sheetName: string) => Promise<RowRecord[]>;
  appendRow: (sheetName: string, row: RowRecord) => Promise<void>;
  upsertRow: (sheetName: string, keyField: string, row: RowRecord) => Promise<void>;
}

export interface DocsGenerationResult {
  drive_file_id: string;
  pdf_file_id: string;
}

export interface DocsRail {
  generateDocument: (args: {
    jobUid: string;
    documentType: DocumentType;
    subType?: "fire" | "gas";
    tokens: Record<string, StructuralToken>;
  }) => Promise<DocsGenerationResult>;
  listFiles: (args: { folderId: string; query?: string }) => Promise<GoogleFile[]>;
}



export interface GoogleFile {
  id: string;
  name: string;
  webViewLink?: string;
  createdTime?: string;
  mimeType?: string;
}

export interface DriveRail {
  publishFile: (args: { fileId: string; clientVisible: boolean }) => Promise<{ publishedUrl: string }>;
}

export interface CalendarRail {
  confirmEvent: (args: {
    jobUid: string;
    scheduleUid: string;
    startAt: string;
    endAt: string;
    technicianUid: string;
    existingEventId?: string;
  }) => Promise<{ eventId: string }>;
}

export interface GmailRail {
  sendNotification: (args: {
    to: string;
    subject: string;
    body: string;
  }) => Promise<{ messageId: string }>;
}

export interface ChatRail {
  sendAlert: (args: { severity: "info" | "warning" | "critical"; message: string }) => Promise<void>;
}

export interface PeopleRail {
  syncContact: (args: {
    name: string;
    email: string;
    phone: string;
    roleHint?: string;
  }) => Promise<{ resourceName: string }>;
}

export interface WorkspaceRails {
  mode: "local" | "production";
  driveRootFolderId: string;
  sheets: SheetsRail;
  docs: DocsRail;
  drive: DriveRail;
  calendar: CalendarRail;
  gmail: GmailRail;
  chat: ChatRail;
  people: PeopleRail;
}
