import fs from "node:fs";
import { getServiceAccessToken } from "../packages/google/dist/client.js";
import { detectSheetLayout } from "../packages/google/dist/production.js";
import { REQUIRED_WORKBOOK_SHEETS, WORKBOOK_HEADERS } from "../packages/domain/dist/workbook.js";

function parseEnvFile(path) {
  const raw = fs.readFileSync(path, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) continue;
    const idx = line.indexOf("=");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key.includes("PRIVATE_KEY")) {
      value = value.replace(/\\n/g, "\n");
    }
    env[key] = value;
  }
  return env;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeName(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function boolValue(value) {
  const normalized = normalizeText(value).toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "y";
}

function columnToA1(index) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function parseJobStatus(row) {
  const raw = normalizeText(row.status || row.job_status || row.status_raw || row.billing_status);
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized === "certified" || normalized === "approved") return normalized;
  if (normalized === "rejected") return "rejected";
  if (
    normalized === "completed" ||
    normalized === "complete" ||
    normalized === "closed" ||
    normalized === "done" ||
    normalized === "resolved" ||
    normalized === "paid" ||
    normalized === "invoiced" ||
    normalized === "performed"
  ) {
    return "performed";
  }
  if (normalizeText(row.date_completed) !== "") return "performed";
  return "draft";
}

function nextTechId(existingIds) {
  let max = 0;
  for (const id of existingIds) {
    const match = /^TECH-(\d{3})$/.exec(id);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value > max) {
      max = value;
    }
  }
  const next = max + 1;
  return `TECH-${String(next).padStart(3, "0")}`;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const env = parseEnvFile(".env");
  const workbookId = env.WORKBOOK_SPREADSHEET_ID;

  if (!workbookId) {
    throw new Error("WORKBOOK_SPREADSHEET_ID is required in .env");
  }

  const token = await getServiceAccessToken(
    {
      mode: "production",
      googleClientId: env.GOOGLE_CLIENT_ID ?? "",
      serviceAccountEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "",
      serviceAccountPrivateKey: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "",
      delegatedServiceAccountEmail: "",
      delegatedServiceAccountPrivateKey: "",
      impersonatedUser: "",
      workbookSpreadsheetId: workbookId,
      driveRootFolderId: "",
      jobcardTemplateId: "",
      serviceReportTemplateId: "",
      gasServiceReportTemplateId: "",
      fireCertificateTemplateId: "",
      gasCertificateTemplateId: "",
      calendarId: "primary",
      gmailSenderAddress: "",
      chatWebhookUrl: ""
    },
    ["https://www.googleapis.com/auth/spreadsheets"]
  );

  async function api(url, init, attempt = 0) {
    const response = await fetch(url, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        ...(init?.headers ?? {})
      }
    });
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
    if (response.status === 429 && attempt < 6) {
      const delayMs = 500 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return api(url, init, attempt + 1);
    }
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText} ${JSON.stringify(payload)}`);
    }
    return payload;
  }

  async function getSheet(sheetName) {
    const range = encodeURIComponent(`'${sheetName}'!A:ZZ`);
    const body = await api(`https://sheets.googleapis.com/v4/spreadsheets/${workbookId}/values/${range}`);
    const values = body.values ?? [];
    const layout = detectSheetLayout(values);
    const headers = layout.headers.map((h) => normalizeText(h));
    const rows = values
      .slice(layout.headerRowIndex + 1)
      .map((cells, rowOffset) => ({
        rowNumber: layout.headerRowIndex + 2 + rowOffset,
        raw: cells,
        data: Object.fromEntries(headers.map((header, colIndex) => [header, normalizeText(cells[colIndex])]))
      }))
      .filter((row) => Object.values(row.data).some((value) => normalizeText(value) !== ""));
    const headerMap = new Map(headers.map((header, index) => [header, index]));
    return {
      sheetName,
      headerRowIndex: layout.headerRowIndex + 1,
      headers,
      headerMap,
      rows
    };
  }

  const meta = await api(`https://sheets.googleapis.com/v4/spreadsheets/${workbookId}?fields=sheets.properties.title`);
  const sheetNames = (meta.sheets ?? []).map((sheet) => sheet?.properties?.title).filter(Boolean);
  const requiredMissingSheets = REQUIRED_WORKBOOK_SHEETS.filter((name) => !sheetNames.includes(name));

  const sheets = new Map();
  for (const name of sheetNames) {
    sheets.set(name, await getSheet(name));
  }

  const usersSheet = sheets.get("Users_Master");
  const jobsSheet = sheets.get("Jobs_Master");
  const techSheet = sheets.get("Technicians_Master");
  const clientsSheet = sheets.get("Clients_Master");

  if (!usersSheet || !jobsSheet || !techSheet || !clientsSheet) {
    throw new Error("Workbook is missing one or more required master sheets.");
  }

  const techByName = new Map();
  const existingTechIds = new Set();
  for (const row of techSheet.rows) {
    const techId = normalizeText(row.data.technician_id || row.data.technician_id);
    const display = normalizeText(row.data.display_name || row.data.technician_name);
    if (techId && display) {
      techByName.set(normalizeName(display), techId);
      existingTechIds.add(techId);
    }
  }

  const updateCells = [];

  const usersByid = new Map();
  for (const row of usersSheet.rows) {
    const userid = normalizeText(row.data.user_id);
    if (!userid) continue;
    const list = usersByid.get(userid) ?? [];
    list.push(row);
    usersByid.set(userid, list);
  }

  const existingUserids = new Set(
    usersSheet.rows.map((row) => normalizeText(row.data.user_id)).filter((value) => value !== "")
  );

  const duplicateidChanges = [];
  for (const [userid, rows] of usersByid.entries()) {
    if (rows.length < 2) continue;
    const ordered = rows.slice().sort((a, b) => a.rowNumber - b.rowNumber);
    let counter = 2;
    for (const row of ordered.slice(1)) {
      let nextid = `${userid}-${counter}`;
      while (existingUserids.has(nextid)) {
        counter += 1;
        nextid = `${userid}-${counter}`;
      }
      existingUserids.add(nextid);
      duplicateidChanges.push({ row: row.rowNumber, from: userid, to: nextid });

      const col = usersSheet.headerMap.get("user_id");
      if (col !== undefined) {
        updateCells.push({
          range: `'Users_Master'!${columnToA1(col)}${row.rowNumber}`,
          value: nextid
        });
      }
    }
  }

  const techidChanges = [];
  for (const row of usersSheet.rows) {
    const role = normalizeText(row.data.role).toLowerCase();
    const active = boolValue(row.data.active || row.data.active_flag);
    if (role !== "technician" || !active) continue;
    const displayName = normalizeText(row.data.display_name);
    const mappedTechId = techByName.get(normalizeName(displayName));
    const current = normalizeText(row.data.technician_id || row.data.technician_id);
    if (!mappedTechId || mappedTechId === current) continue;
    const col = usersSheet.headerMap.get("technician_id");
    if (col === undefined) continue;
    techidChanges.push({
      row: row.rowNumber,
      user_id: normalizeText(row.data.user_id),
      email: normalizeText(row.data.email),
      display_name: displayName,
      from: current,
      to: mappedTechId
    });
    updateCells.push({
      range: `'Users_Master'!${columnToA1(col)}${row.rowNumber}`,
      value: mappedTechId
    });
  }

  const jobTechIdChanges = [];
  const primaryTechIdCol = jobsSheet.headerMap.get("primary_technician_id");

  for (const row of jobsSheet.rows) {
    const current = normalizeText(row.data.primary_technician_id || row.data.technician_id);
    if (current !== "") continue;
    const techName = normalizeText(row.data.primary_technician_name);
    const mappedTechId = techByName.get(normalizeName(techName));
    if (!mappedTechId || primaryTechIdCol === undefined) continue;
    jobTechIdChanges.push({
      row: row.rowNumber,
      job_id: normalizeText(row.data.job_id),
      from: current,
      to: mappedTechId,
      by_name: techName
    });
    updateCells.push({
      range: `'Jobs_Master'!${columnToA1(primaryTechIdCol)}${row.rowNumber}`,
      value: mappedTechId
    });
  }

  const jobStatusCol = jobsSheet.headerMap.get("job_status");
  const jobStatusChanges = [];
  for (const row of jobsSheet.rows) {
    if (normalizeText(row.data.job_status) !== "") continue;
    if (jobStatusCol === undefined) continue;
    const normalizedStatus = parseJobStatus(row.data);
    jobStatusChanges.push({
      row: row.rowNumber,
      job_id: normalizeText(row.data.job_id),
      to: normalizedStatus
    });
    updateCells.push({
      range: `'Jobs_Master'!${columnToA1(jobStatusCol)}${row.rowNumber}`,
      value: normalizedStatus
    });
  }

  const unresolvedTechUsers = usersSheet.rows
    .filter((row) => normalizeText(row.data.role).toLowerCase() === "technician" && boolValue(row.data.active || row.data.active_flag))
    .filter((row) => !techByName.has(normalizeName(row.data.display_name)))
    .map((row) => ({
      row: row.rowNumber,
      user_id: normalizeText(row.data.user_id),
      email: normalizeText(row.data.email),
      display_name: normalizeText(row.data.display_name),
      technician_id: normalizeText(row.data.technician_id)
    }));

  const existingClientIds = new Set(clientsSheet.rows.map((r) => normalizeText(r.data.client_id)).filter(Boolean));
  const existingSiteIds = new Set(sheets.get("Sites_Master").rows.map((r) => normalizeText(r.data.site_id)).filter(Boolean));

  const orphanedClients = [];
  const orphanedSites = [];

  for (const row of jobsSheet.rows) {
    const cid = normalizeText(row.data.client_id);
    if (cid && !existingClientIds.has(cid)) {
      orphanedClients.push({ row: row.rowNumber, job_id: row.data.job_id, client_id: cid });
    }
    const sid = normalizeText(row.data.site_id);
    if (sid && !existingSiteIds.has(sid)) {
      orphanedSites.push({ row: row.rowNumber, job_id: row.data.job_id, site_id: sid });
    }
  }

  const forensicGaps = [];
  const forensicChanges = [];
  for (const [name, sheet] of sheets.entries()) {
    if (!WORKBOOK_HEADERS[name]) continue;
    const versionCol = sheet.headerMap.get("row_version");
    const updatedCol = sheet.headerMap.get("updated_at");
    const updatedByCol = sheet.headerMap.get("updated_by");
    const correlationCol = sheet.headerMap.get("correlation_id");
    
    for (const row of sheet.rows) {
      const gaps = [];
      if (versionCol !== undefined && !row.data.row_version) {
        gaps.push("row_version");
        updateCells.push({
          range: `'${name}'!${columnToA1(versionCol)}${row.rowNumber}`,
          value: "1"
        });
      }
      if (updatedCol !== undefined && !row.data.updated_at) {
        gaps.push("updated_at");
        updateCells.push({
          range: `'${name}'!${columnToA1(updatedCol)}${row.rowNumber}`,
          value: new Date().toISOString()
        });
      }
      if (updatedByCol !== undefined && !row.data.updated_by) {
        updateCells.push({
          range: `'${name}'!${columnToA1(updatedByCol)}${row.rowNumber}`,
          value: "workbook-governance:backfill"
        });
      }
      if (correlationCol !== undefined && !row.data.correlation_id) {
        updateCells.push({
          range: `'${name}'!${columnToA1(correlationCol)}${row.rowNumber}`,
          value: `backfill:${Date.now()}`
        });
      }
      
      if (gaps.length > 0) {
        forensicGaps.push({ sheet: name, row: row.rowNumber, gaps });
        forensicChanges.push({ sheet: name, row: row.rowNumber, gaps });
      }
    }
  }

  const invoiceMasterSheet = sheets.get("Invoices_Master");
  const financeInvoicesSheet = sheets.get("Finance_Invoices");
  const financeInvoicesProposed = [];
  
  if (invoiceMasterSheet && financeInvoicesSheet) {
    const existingInvoices = new Map(financeInvoicesSheet.rows.map(r => [normalizeText(r.data.invoice_id), r]));
    const financeHeaders = financeInvoicesSheet.headers;
    const rowsToAppend = [];

    for (const master of invoiceMasterSheet.rows) {
      const invoiceId = normalizeText(master.data.invoice_id);
      if (!invoiceId || invoiceId === "") continue;
      
      if (!existingInvoices.has(invoiceId)) {
        financeInvoicesProposed.push({
          invoice_id: invoiceId,
          job_id: master.data.job_id,
          amount: master.data.invoice_amount,
          status: master.data.payment_status || "issued"
        });
        
        if (apply) {
          const rowData = financeHeaders.map(header => {
            if (header === "invoice_id") return invoiceId;
            if (header === "job_id") return master.data.job_id;
            if (header === "quote_id") return master.data.quotation_reference || "";
            if (header === "client_id") return master.data.client_id;
            if (header === "amount") return master.data.invoice_amount;
            if (header === "due_date") return master.data.payment_date || "";
            if (header === "status") return master.data.payment_status || "issued";
            if (header === "row_version") return "1";
            if (header === "updated_at") return new Date().toISOString();
            if (header === "updated_by") return "workbook-governance:sync";
            if (header === "correlation_id") return `sync:${Date.now()}`;
            return "";
          });
          rowsToAppend.push(rowData);
        }
      }
    }

    if (apply && rowsToAppend.length > 0) {
      const appendRange = encodeURIComponent("'Finance_Invoices'!A:ZZ");
      await api(`https://sheets.googleapis.com/v4/spreadsheets/${workbookId}/values/${appendRange}:append?valueInputOption=RAW`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ values: rowsToAppend })
      });
    }
  }

  const createdTechnicians = [];
  const techidCol = usersSheet.headerMap.get("technician_id");
  if (apply && unresolvedTechUsers.length > 0) {
    const techHeaders = techSheet.headers;
    const rowsToAppend = [];
    for (const unresolved of unresolvedTechUsers) {
      const generatedTechId = nextTechId(existingTechIds);
      existingTechIds.add(generatedTechId);
      techByName.set(normalizeName(unresolved.display_name), generatedTechId);
      createdTechnicians.push({
        user_id: unresolved.user_id,
        display_name: unresolved.display_name,
        created_technician_id: generatedTechId
      });

      const rowData = techHeaders.map((header) => {
        if (header === "technician_id" || header === "technician_id") return generatedTechId;
        if (header === "technician_name" || header === "display_name") return unresolved.display_name;
        if (header === "active_flag" || header === "active") return "TRUE";
        if (header === "row_version") return "1";
        if (header === "updated_at") return new Date().toISOString();
        if (header === "updated_by") return "workbook-governance";
        if (header === "correlation_id") return `workbook-governance:${Date.now()}`;
        return "";
      });
      rowsToAppend.push(rowData);

      if (techidCol !== undefined) {
        updateCells.push({
          range: `'Users_Master'!${columnToA1(techidCol)}${unresolved.row}`,
          value: generatedTechId
        });
      }
    }

    if (rowsToAppend.length > 0) {
      const appendRange = encodeURIComponent("'Technicians_Master'!A:ZZ");
      await api(`https://sheets.googleapis.com/v4/spreadsheets/${workbookId}/values/${appendRange}:append?valueInputOption=RAW`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          values: rowsToAppend
        })
      });
    }
  }

  const schemaSummary = [];
  for (const [name, sheet] of sheets.entries()) {
    const expected = WORKBOOK_HEADERS[name] ?? null;
    schemaSummary.push({
      sheet: name,
      known: Boolean(expected),
      headerRow: sheet.headerRowIndex,
      rows: sheet.rows.length,
      missingHeaders: expected ? expected.filter((header) => !sheet.headers.includes(header)) : [],
      extraHeaders: expected ? sheet.headers.filter((header) => !expected.includes(header)) : sheet.headers
    });
  }

  if (apply && updateCells.length > 0) {
    await api(`https://sheets.googleapis.com/v4/spreadsheets/${workbookId}/values:batchUpdate`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: updateCells.map((cell) => ({
          range: cell.range,
          values: [[cell.value]]
        }))
      })
    });
  }

  const report = {
    workbookId,
    applyMode: apply,
    requiredMissingSheets,
    pendingCellUpdates: updateCells.length,
    appliedCellUpdates: apply ? updateCells.length : 0,
    fixes: {
      usersTechnicianidMapped: techidChanges.length,
      duplicateUseridResolved: duplicateidChanges.length,
      jobsPrimaryTechnicianMappedFromName: jobTechIdChanges.length,
      jobsStatusBackfilled: jobStatusChanges.length
    },
    unresolved: {
      usersTechniciansWithoutTechMasterMatch: apply ? [] : unresolvedTechUsers,
      orphanedClients,
      orphanedSites,
      forensicGaps: forensicGaps.slice(0, 100)
    },
    changes: {
      usersTechnicianid: techidChanges,
      duplicateUserid: duplicateidChanges,
      jobsPrimaryTechnicianId: jobTechIdChanges.slice(0, 100),
      jobsStatus: jobStatusChanges.slice(0, 100),
      forensicBackfills: forensicChanges.slice(0, 100),
      financeInvoicesProposed: financeInvoicesProposed.slice(0, 100),
      techniciansCreatedFromUsers: createdTechnicians
    },
    schema: schemaSummary
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
