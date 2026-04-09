import type {
  CalendarRail,
  ChatRail,
  DocsGenerationResult,
  DocsRail,
  DriveRail,
  GmailRail,
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
      const values = await getSheetValues(config, sheetName);
      if (values.length === 0) {
        return [];
      }
      const headers = values[0] ?? [];
      const rows = values.slice(1);
      return rows.map((row) => fromValues(headers, row));
    },
    async appendRow(sheetName, row) {
      const values = await getSheetValues(config, sheetName);
      const headers = values[0] ?? Object.keys(row);
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
          values: [toRowValues(headers, row)]
        })
      });
    },
    async upsertRow(sheetName, keyField, row) {
      const values = await getSheetValues(config, sheetName);
      if (values.length === 0) {
        await this.appendRow(sheetName, row);
        return;
      }
      const headers = values[0] ?? [];
      const keyIndex = headers.indexOf(keyField);
      if (keyIndex < 0) {
        throw new Error(`Missing key field ${keyField} on sheet ${sheetName}`);
      }
      const rowIndex = values.slice(1).findIndex((candidate) => (candidate[keyIndex] ?? "") === row[keyField]);
      if (rowIndex < 0) {
        await this.appendRow(sheetName, row);
        return;
      }

      const spreadsheetRowNumber = rowIndex + 2;
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
      const templateId = args.documentType === "jobcard" ? config.jobcardTemplateId : config.serviceReportTemplateId;
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
      const requests = Object.entries(args.tokens).map(([token, value]) => ({
        replaceAllText: {
          containsText: {
            text: `{{${token}}}`,
            matchCase: true
          },
          replaceText: value
        }
      }));

      if (requests.length > 0) {
        await googleApiRequest({
          config,
          service: "docs",
          url: `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
          method: "POST",
          scopes: [
            "https://www.googleapis.com/auth/documents",
            "https://www.googleapis.com/auth/drive"
          ],
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ requests })
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
          config,
          service: "calendar",
          url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events/${args.existingEventId}`,
          method: "PUT",
          scopes: ["https://www.googleapis.com/auth/calendar"],
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
        config,
        service: "calendar",
        url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events`,
        method: "POST",
        scopes: ["https://www.googleapis.com/auth/calendar"],
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
        config,
        service: "gmail",
        url: "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        method: "POST",
        scopes: ["https://www.googleapis.com/auth/gmail.send"],
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
        config,
        service: "people",
        url: "https://people.googleapis.com/v1/people:createContact",
        method: "POST",
        scopes: ["https://www.googleapis.com/auth/contacts"],
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
    sheets,
    docs,
    drive,
    calendar,
    gmail,
    chat,
    people
  };
}
