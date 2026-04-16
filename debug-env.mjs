import { buildGoogleRuntimeConfig } from "./packages/google/dist/index.js";

const config = buildGoogleRuntimeConfig(process.env);

function mask(s) {
  if (!s) return "null/empty";
  if (s.length < 20) return s;
  return s.substring(0, 10) + "..." + s.substring(s.length - 10);
}

console.log("Mode:", config.mode);
console.log("Email:", config.serviceAccountEmail);
console.log("Key Length:", config.serviceAccountPrivateKey?.length);
console.log("Key Start:", mask(config.serviceAccountPrivateKey));
console.log("Key contains literal \\n:", config.serviceAccountPrivateKey?.includes("\\n"));
console.log("Key contains actual newline:", config.serviceAccountPrivateKey?.includes("\n"));
console.log("Spreadsheet ID:", config.workbookSpreadsheetId);
