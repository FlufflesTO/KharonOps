import { verifyGoogleIdToken } from "@kharon/google";

export interface VerifiedIdentity {
  email: string;
  displayName: string;
  localUserUid?: string;
}

const localTokenMap: Record<string, VerifiedIdentity> = {
  "dev-client": { localUserUid: "USR-CLIENT-1", email: "connor@kharon.co.za", displayName: "Client Operator" },
  "dev-technician": { localUserUid: "USR-TECH-1", email: "connor@kharon.co.za", displayName: "Field Technician" },
  "dev-dispatcher": { localUserUid: "USR-DISP-1", email: "connor@kharon.co.za", displayName: "Dispatch Controller" },
  "dev-admin": { localUserUid: "USR-ADMIN-1", email: "connor@kharon.co.za", displayName: "Security Admin" }
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

  const verified = await verifyGoogleIdToken({
    idToken: args.idToken,
    expectedAudience: args.googleClientId
  });

  return {
    email: verified.email,
    displayName: verified.name || verified.email
  };
}
