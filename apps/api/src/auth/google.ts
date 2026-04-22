import { verifyGoogleIdToken } from "@kharon/google";

export interface VerifiedIdentity {
  email: string;
  displayName: string;
  localUserid?: string;
}

/**
 * Dev token map for local development only.
 *
 * A-008 FIX: Real production emails have been replaced with RFC-2606-reserved
 * `.invalid` domain addresses. This prevents accidental authentication as a
 * real user if KHARON_MODE is misconfigured in a staging or production environment.
 * The `.invalid` TLD cannot resolve and will never match a live user record.
 */
const localTokenMap: Record<string, VerifiedIdentity> = {
  "dev-client": { localUserid: "USR-CLIENT-1", email: "dev.client@kharon.invalid", displayName: "Client Operator" },
  "dev-technician": { localUserid: "USR-TECH-1", email: "dev.technician@kharon.invalid", displayName: "Field Technician" },
  "dev-dispatcher": { localUserid: "USR-DISP-1", email: "dev.dispatcher@kharon.invalid", displayName: "Dispatch Controller" },
  "dev-finance": { localUserid: "USR-FIN-1", email: "dev.finance@kharon.invalid", displayName: "Finance Controller" },
  "dev-admin": { localUserid: "USR-ADMIN-1", email: "dev.admin@kharon.invalid", displayName: "Security Admin" }
};

export async function verifyIdentity(args: {
  mode: "local" | "production";
  idToken: string;
  googleClientId: string;
}): Promise<VerifiedIdentity> {
  if (args.mode === "local") {
    const mapped = localTokenMap[args.idToken];
    if (!mapped) {
      throw new Error("Unknown local development token");
    }
    return mapped;
  }

  console.log(`[verifyIdentity] Attempting production verification for client: ${args.googleClientId}`);
  try {
    const verified = await verifyGoogleIdToken({
      idToken: args.idToken,
      expectedAudience: args.googleClientId
    });

    console.log(`[verifyIdentity] Verification successful for: ${verified.email}`);
    return {
      email: verified.email,
      displayName: verified.name || verified.email
    };
  } catch (error) {
    console.error(`[verifyIdentity] Verification failed:`, error);
    throw error;
  }
}
