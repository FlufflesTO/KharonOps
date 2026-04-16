import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.GOOGLE_WORKBOOK_ID;

async function checkAudit() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Ledger!A1:G20",
    });

    console.log("Ledger Samples:");
    console.table(response.data.values);
  } catch (error) {
    console.error("Error reading Ledger:", error.message);
  }
}

checkAudit();
