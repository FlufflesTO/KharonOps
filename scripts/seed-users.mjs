/**
 * Project KharonOps - User Seeding script
 * Purpose: Population of Users_Master sheet from the canonical Kharon Employee List.
 * Dependencies: @kharon/domain, @kharon/google
 * Structural Role: Maintenance Script
 */

import { createWorkspaceRails } from "../packages/google/dist/index.js";

const KHARON_EMPLOYEES = [
  { uid: "VEN004", name: "Gert Venter", role: "admin", email: "gert@kharon.co.za" },
  { uid: "VEN003", name: "Connor Venter", role: "admin", email: "connor@kharon.co.za" },
  { uid: "MAH001", name: "Anthony Mahogany", role: "dispatcher", email: "technical@kharon.co.za" },
  { uid: "HAZ001", name: "Kim Hazekamp", role: "admin", email: "kim@kharon.co.za" },
  { uid: "ROY001", name: "Lorenzo Van Rooyen", role: "technician", email: "service@kharon.co.za" },
  { uid: "MAG001", name: "Lee Maggot", role: "technician", email: "access@kharon.co.za" },
  { uid: "SPI001", name: "Georgiy Spires", role: "technician", email: "zhora.kharon@gmail.com" },
  { uid: "FOR001", name: "Wesley Fortune", role: "technician", email: "wesleyfortune04@gmail.com" },
  { uid: "DYO001", name: "Thobeka Dyonase", role: "technician", email: "cleaner@kharon.co.za" }
];

async function main() {
  const rails = createWorkspaceRails(process.env);
  const correlationId = `seed-${Date.now()}`;
  const timestamp = new Date().toISOString();

  console.log(`Seeding ${KHARON_EMPLOYEES.length} users into Users_Master...`);

  for (const emp of KHARON_EMPLOYEES) {
    const userRow = {
      user_uid: emp.uid,
      email: emp.email,
      display_name: emp.name,
      role: emp.role,
      client_uid: "",
      technician_uid: emp.role === "technician" ? emp.uid : "",
      active: "true",
      row_version: "1",
      updated_at: timestamp,
      updated_by: "system:seeder",
      correlation_id: correlationId
    };

    console.log(`Upserting: ${emp.name} (${emp.uid}) as ${emp.role}`);
    await rails.sheets.upsertRow("Users_Master", "user_uid", userRow);
  }

  console.log("User seeding complete.");
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
