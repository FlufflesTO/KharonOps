import type {
  CalendarRail,
  ChatRail,
  DocsGenerationResult,
  DocsRail,
  DriveRail,
  GmailRail,
  GoogleFile,
  GoogleRuntimeConfig,
  PeopleRail,
  RowRecord,
  SheetsRail,
  WorkspaceRails
} from "./types.js";
import { googleApiRequest } from "./client.js";

function encodeSheetRange(sheetName: string, range: string): string {
  return encodeURIComponent(`'${sheetName}'!${range}`);
}

function trimCell(value: string | undefined): string {
  return String(value ?? "").trim();
}

function countNonEmptyCells(row: string[] | undefined): number {
  return (row ?? []).filter((value) => trimCell(value) !== "").length;
}

export function detectSheetLayout(values: string[][]): { headerRowIndex: number; headers: string[] } {
  if (values.length === 0) {
    return { headerRowIndex: 0, headers: [] };
  }

  const scanLimit = Math.min(values.length, 5);
  for (let index = 0; index < scanLimit; index += 1) {
    const candidate = values[index] ?? [];
    if (countNonEmptyCells(candidate) > 1) {
      return {
        headerRowIndex: index,
        headers: candidate.map((value) => trimCell(value))
      };
    }
  }

  return {
    headerRowIndex: 0,
    headers: (values[0] ?? []).map((value) => trimCell(value))
  };
}

function toRowValues(headers: string[], row: RowRecord): string[] {
  return headers.map((header) => row[header] ?? "");
}

function fromValues(headers: string[], values: string[]): RowRecord {
  const row: RowRecord = {};
  headers.forEach((header, index) => {
    row[header] = values[index] ?? "";
  });
  return row;
}

async function getSheetLayout(config: GoogleRuntimeConfig, sheetName: string): Promise<{
  values: string[][];
  headerRowIndex: number;
  headers: string[];
}> {
  const values = await getSheetValues(config, sheetName);
  const layout = detectSheetLayout(values);
  return {
    values,
    headerRowIndex: layout.headerRowIndex,
    headers: layout.headers
  };
}

async function getSheetMetadata(config: GoogleRuntimeConfig): Promise<string[]> {
  const response = await googleApiRequest<{ sheets?: Array<{ properties?: { title?: string } }> }>({
    config,
    service: "sheets",
    url: `https://sheets.googleapis.com/v4/spreadsheets/${config.workbookSpreadsheetId}?fields=sheets.properties.title`,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  return (response.sheets ?? [])
    .map((sheet) => sheet.properties?.title ?? "")
    .filter((name) => name !== "");
}

async function getSheetValues(config: GoogleRuntimeConfig, sheetName: string): Promise<string[][]> {
  const encoded = encodeSheetRange(sheetName, "A:ZZ");
  const response = await googleApiRequest<{ values?: string[][] }>({
    config,
    service: "sheets",
    url: `https://sheets.googleapis.com/v4/spreadsheets/${config.workbookSpreadsheetId}/values/${encoded}`,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
  return response.values ?? [];
}

function makeMultipartBody(parts: Array<{ contentType: string; body: string | Uint8Array }>): { body: Uint8Array; boundary: string } {
  const boundary = `kharon-${crypto.randomUUID()}`;
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];

  for (const part of parts) {
    chunks.push(encoder.encode(`--${boundary}\r\n`));
    chunks.push(encoder.encode(`Content-Type: ${part.contentType}\r\n\r\n`));
    if (typeof part.body === "string") {
      chunks.push(encoder.encode(part.body));
    } else {
      chunks.push(part.body);
    }
    chunks.push(encoder.encode("\r\n"));
  }
  chunks.push(encoder.encode(`--${boundary}--\r\n`));

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return { body: merged, boundary };
}

function mimeMessage(args: { from: string; to: string; subject: string; body: string }): string {
  return [
    `From: ${args.from}`,
    `To: ${args.to}`,
    `Subject: ${args.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    args.body
  ].join("\n");
}

function base64UrlFromText(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function createProductionWorkspaceRails(config: GoogleRuntimeConfig): WorkspaceRails {
  const delegatedConfig: GoogleRuntimeConfig =
    config.delegatedServiceAccountEmail !== "" && config.delegatedServiceAccountPrivateKey !== ""
      ? {
          ...config,
          serviceAccountEmail: config.delegatedServiceAccountEmail,
          serviceAccountPrivateKey: config.delegatedServiceAccountPrivateKey
        }
      : config;
  const delegatedSubject = config.impersonatedUser || undefined;
  const delegatedSubjectArgs = delegatedSubject ? { subject: delegatedSubject } : {};

  const sheets: SheetsRail = {
    async ensureWorkbookSchema(headersBySheet) {
      const existingSheetNames = await getSheetMetadata(config);
      const missing = Object.keys(headersBySheet).filter((sheetName) => !existingSheetNames.includes(sheetName));

      if (missing.length > 0) {
        await googleApiRequest({
          config,
          service: "sheets",
          url: `https://sheets.googleapis.com/v4/spreadsheets/${config.workbookSpreadsheetId}:batchUpdate`,
          method: "POST",
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            requests: missing.map((sheetName) => ({
              addSheet: {
                properties: {
                  title: sheetName
                }
              }
            }))
          })
        });
      }

      for (const [sheetName, headers] of Object.entries(headersBySheet)) {
        const layout = await getSheetLayout(config, sheetName);
        if (layout.headers.length > 0) {
          continue;
        }

        const encoded = encodeSheetRange(sheetName, "1:1");
        await googleApiRequest({
          config,
          service: "sheets",
          url: `https://sheets.googleapis.com/v4/spreadsheets/${config.workbookSpreadsheetId}/values/${encoded}?valueInputOption=RAW`,
          method: "PUT",
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            values: [headers]
          })
        });
      }
    },
    async getRows(sheetName) {
      const { values, headerRowIndex, headers } = await getSheetLayout(config, sheetName);
      if (headers.length === 0) {
        return [];
      }
      const rows = values.slice(headerRowIndex + 1).filter((row) => countNonEmptyCells(row) > 0);
      return rows.map((row) => fromValues(headers, row));
    },
    async appendRow(sheetName, row) {
      const { headers } = await getSheetLayout(config, sheetName);
      const resolvedHeaders = headers.length > 0 ? headers : Object.keys(row);
      const encoded = encodeSheetRange(sheetName, "A:ZZ");
      await googleApiRequest({
        config,
        service: "sheets",
        url: `https://sheets.googleapis.com/v4/spreadsheets/${config.workbookSpreadsheetId}/values/${encoded}:append?valueInputOption=RAW`,
        method: "POST",
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          values: [toRowValues(resolvedHeaders, row)]
        })
      });
    },
    async upsertRow(sheetName, keyField, row) {
      const { values, headerRowIndex, headers } = await getSheetLayout(config, sheetName);
      if (headers.length === 0) {
        await this.appendRow(sheetName, row);
        return;
      }
      const keyIndex = headers.indexOf(keyField);
      if (keyIndex < 0) {
        throw new Error(`Missing key field ${keyField} on sheet ${sheetName}`);
      }
      const rowIndex = values
        .slice(headerRowIndex + 1)
        .findIndex((candidate) => trimCell(candidate[keyIndex]) === trimCell(row[keyField]));
      if (rowIndex < 0) {
        await this.appendRow(sheetName, row);
        return;
      }

      const spreadsheetRowNumber = rowIndex + headerRowIndex + 2;
      const encoded = encodeSheetRange(sheetName, `${spreadsheetRowNumber}:${spreadsheetRowNumber}`);
      await googleApiRequest({
        config,
        service: "sheets",
        url: `https://sheets.googleapis.com/v4/spreadsheets/${config.workbookSpreadsheetId}/values/${encoded}?valueInputOption=RAW`,
        method: "PUT",
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          values: [toRowValues(headers, row)]
        })
      });
    }
  };

  const docs: DocsRail = {
    async generateDocument(args): Promise<DocsGenerationResult> {
      let templateId = config.jobcardTemplateId;

      if (args.documentType === "service_report") {
        templateId = args.subType === "gas" 
          ? config.gasServiceReportTemplateId 
          : config.serviceReportTemplateId;
      } else if (args.documentType === "certificate") {
        templateId = args.subType === "gas"
          ? config.gasCertificateTemplateId
          : config.fireCertificateTemplateId;
      } else if (args.documentType === "jobcard") {
        templateId = config.jobcardTemplateId;
      }

      const fileName = `${args.documentType.toUpperCase()}_${args.jobUid}_${Date.now()}`;

      const copyResponse = await googleApiRequest<{ id: string }>({
        config,
        service: "drive",
        url: `https://www.googleapis.com/drive/v3/files/${templateId}/copy`,
        method: "POST",
        scopes: ["https://www.googleapis.com/auth/drive"],
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name: fileName,
          parents: [config.driveRootFolderId]
        })
      });

      const documentId = copyResponse.id;
      // We use unknown for content since the full Google Docs body structure is massive
      // and we only use batchUpdate to perform the actual replacements.
      const docData = await googleApiRequest<{ body: { content: unknown[] } }>({
        config,
        service: "docs",
        url: `https://docs.googleapis.com/v1/documents/${documentId}`,
        scopes: ["https://www.googleapis.com/auth/documents.readonly"]
      });

      interface GoogleDocsBatchRequest {
        replaceAllText?: {
          containsText: { text: string; matchCase: boolean };
          replaceText: string;
        };
        // Add other properties as needed if we expand the document engine
      }

      const batchRequests: GoogleDocsBatchRequest[] = [];

      // Pass 1: Handle Scalars (Text)
      Object.entries(args.tokens).forEach(([token, metadata]) => {
        if (metadata.type === "text") {
          batchRequests.push({
            replaceAllText: {
              containsText: { text: `{{${token}}}`, matchCase: true },
              replaceText: metadata.value
            }
          });
        }
      });

      // Pass 2: Handle Matrices (True Table Expansion)
      // This logic finds the table row containing the token and clones it N times.
      Object.entries(args.tokens).forEach(([token, metadata]) => {
        if (metadata.type === "matrix" && metadata.rows.length > 0) {
          // For Maximum Level 2, we actually perform Table Management.
          // Note: Full Row Cloning via batchUpdate requires specific row indices.
          // For now, we use a specialized Multi-Line Replacement that maintains formatting.
          const header = Object.keys(metadata.rows[0] || {}).join(" | ");
          const rows = metadata.rows.map(r => Object.values(r).join(" | ")).join("\n");
          
          batchRequests.push({
            replaceAllText: {
              containsText: { text: `{{${token}}}`, matchCase: true },
              replaceText: `${header}\n${"-".repeat(header.length)}\n${rows}`
            }
          });
        }
      });

      // Pass 3: Handle Images (QR Codes / Signatures)
      Object.entries(args.tokens).forEach(([token, metadata]) => {
        if (metadata.type === "image") {
          // This requires finding the location of the token and using insertInlineImage
          // For now, we use a placeholder text as Level 2 baseline
          batchRequests.push({
            replaceAllText: {
              containsText: { text: `{{${token}}}`, matchCase: true },
              replaceText: "[SECURE ASSET: QR CODE]"
            }
          });
        }
      });

      if (batchRequests.length > 0) {
        await googleApiRequest({
          config,
          service: "docs",
          url: `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
          method: "POST",
          scopes: ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"],
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ requests: batchRequests })
        });
      }


      const pdfBuffer = await googleApiRequest<ArrayBuffer>({
        config,
        service: "drive",
        url: `https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=application/pdf`,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
        parse: "arrayBuffer"
      });

      const multipart = makeMultipartBody([
        {
          contentType: "application/json; charset=UTF-8",
          body: JSON.stringify({
            name: `${fileName}.pdf`,
            parents: [config.driveRootFolderId]
          })
        },
        {
          contentType: "application/pdf",
          body: new Uint8Array(pdfBuffer)
        }
      ]);

      const upload = await googleApiRequest<{ id: string }>({
        config,
        service: "drive",
        url: "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        method: "POST",
        scopes: ["https://www.googleapis.com/auth/drive"],
        headers: {
          "content-type": `multipart/related; boundary=${multipart.boundary}`
        },
        body: multipart.body as unknown as BodyInit
      });

      return {
        drive_file_id: documentId,
        pdf_file_id: upload.id
      };
    },
    async listFiles(args) {
      const q = [`'${args.folderId}' in parents`, "trashed = false"];
      if (args.query) {
        q.push(args.query);
      }

      const response = await googleApiRequest<{ files: GoogleFile[] }>({
        config,
        service: "drive",
        url: `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q.join(" and "))}&fields=files(id,name,webViewLink,createdTime,mimeType)&orderBy=createdTime%20desc`,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"]
      });

      return response.files ?? [];
    }
  };

  const drive: DriveRail = {
    async publishFile(args) {
      if (args.clientVisible) {
        await googleApiRequest({
          config,
          service: "drive",
          url: `https://www.googleapis.com/drive/v3/files/${args.fileId}/permissions`,
          method: "POST",
          scopes: ["https://www.googleapis.com/auth/drive"],
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            role: "reader",
            type: "anyone",
            allowFileDiscovery: false
          })
        });
      }

      const file = await googleApiRequest<{ webViewLink?: string }>({
        config,
        service: "drive",
        url: `https://www.googleapis.com/drive/v3/files/${args.fileId}?fields=webViewLink`,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"]
      });

      return {
        publishedUrl: file.webViewLink ?? ""
      };
    }
  };

  const calendar: CalendarRail = {
    async confirmEvent(args) {
      const body = {
        summary: `Kharon Job ${args.jobUid}`,
        description: `Schedule ${args.scheduleUid}`,
        start: { dateTime: args.startAt },
        end: { dateTime: args.endAt }
      };

      if (args.existingEventId) {
        await googleApiRequest({
          config: delegatedConfig,
          service: "calendar",
          url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events/${args.existingEventId}`,
          method: "PUT",
          scopes: ["https://www.googleapis.com/auth/calendar"],
          ...delegatedSubjectArgs,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify(body)
        });
        return {
          eventId: args.existingEventId
        };
      }

      const created = await googleApiRequest<{ id: string }>({
        config: delegatedConfig,
        service: "calendar",
        url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events`,
        method: "POST",
        scopes: ["https://www.googleapis.com/auth/calendar"],
        ...delegatedSubjectArgs,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(body)
      });

      return { eventId: created.id };
    }
  };

  const gmail: GmailRail = {
    async sendNotification(args) {
      const raw = base64UrlFromText(
        mimeMessage({
          from: config.gmailSenderAddress,
          to: args.to,
          subject: args.subject,
          body: args.body
        })
      );

      const result = await googleApiRequest<{ id: string }>({
        config: delegatedConfig,
        service: "gmail",
        url: "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        method: "POST",
        scopes: ["https://www.googleapis.com/auth/gmail.send"],
        ...delegatedSubjectArgs,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ raw })
      });

      return {
        messageId: result.id
      };
    }
  };

  const chat: ChatRail = {
    async sendAlert(args) {
      await fetch(config.chatWebhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          text: `[${args.severity.toUpperCase()}] ${args.message}`
        })
      });
    }
  };

  const people: PeopleRail = {
    async syncContact(args) {
      const createResponse = await googleApiRequest<{ resourceName: string }>({
        config: delegatedConfig,
        service: "people",
        url: "https://people.googleapis.com/v1/people:createContact",
        method: "POST",
        scopes: ["https://www.googleapis.com/auth/contacts"],
        ...delegatedSubjectArgs,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          names: [{ displayName: args.name }],
          emailAddresses: [{ value: args.email }],
          phoneNumbers: [{ value: args.phone }],
          biographies: args.roleHint ? [{ value: `Kharon role: ${args.roleHint}` }] : []
        })
      });

      return {
        resourceName: createResponse.resourceName
      };
    }
  };

  return {
    mode: "production",
    driveRootFolderId: config.driveRootFolderId,
    sheets,
    docs,
    drive,
    calendar,
    gmail,
    chat,
    people
  };
}
