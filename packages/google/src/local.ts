import type {
  CalendarRail,
  ChatRail,
  DocsGenerationResult,
  DocsRail,
  DriveRail,
  GmailRail,
  PeopleRail,
  RowRecord,
  SheetsRail,
  WorkspaceRails
} from "./types.js";

const localSheets = new Map<string, RowRecord[]>();

function ensureSheet(sheetName: string): RowRecord[] {
  if (!localSheets.has(sheetName)) {
    localSheets.set(sheetName, []);
  }
  return localSheets.get(sheetName) ?? [];
}

function localId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

const sheets: SheetsRail = {
  async ensureWorkbookSchema(headersBySheet) {
    for (const sheetName of Object.keys(headersBySheet)) {
      ensureSheet(sheetName);
    }
  },
  async getRows(sheetName) {
    return ensureSheet(sheetName).map((row) => ({ ...row }));
  },
  async appendRow(sheetName, row) {
    ensureSheet(sheetName).push({ ...row });
  },
  async upsertRow(sheetName, keyField, row) {
    const rows = ensureSheet(sheetName);
    const target = row[keyField];
    const index = rows.findIndex((existing) => existing[keyField] === target);
    if (index >= 0) {
      rows[index] = { ...rows[index], ...row };
    } else {
      rows.push({ ...row });
    }
  }
};

const docs: DocsRail = {
  async generateDocument(): Promise<DocsGenerationResult> {
    return {
      drive_file_id: localId("doc"),
      pdf_file_id: localId("pdf")
    };
  }
};

const drive: DriveRail = {
  async publishFile(args) {
    return {
      publishedUrl: args.clientVisible ? `https://drive.local/${args.fileId}` : ""
    };
  }
};

const calendar: CalendarRail = {
  async confirmEvent(args) {
    return {
      eventId: args.existingEventId ?? localId("evt")
    };
  }
};

const gmail: GmailRail = {
  async sendNotification() {
    return {
      messageId: localId("msg")
    };
  }
};

const chat: ChatRail = {
  async sendAlert() {
    return;
  }
};

const people: PeopleRail = {
  async syncContact() {
    return {
      resourceName: localId("people")
    };
  }
};

export function createLocalWorkspaceRails(): WorkspaceRails {
  return {
    mode: "local",
    sheets,
    docs,
    drive,
    calendar,
    gmail,
    chat,
    people
  };
}
