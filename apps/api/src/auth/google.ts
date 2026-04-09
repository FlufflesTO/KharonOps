import { verifyGoogleIdToken } from "@kharon/google";

export interface VerifiedIdentity {
  email: string;
  displayName: string;
}

const localTokenMap: Record<string, VerifiedIdentity> = {
  "dev-client": { email: "client@example.com", displayName: "Client Operator" },
  "dev-technician": { email: "tech@example.com", displayName: "Field Technician" },
  "dev-dispatcher": { email: "dispatcher@example.com", displayName: "Dispatch Controller" },
  "dev-admin": { email: "admin@example.com", displayName: "Security Admin" }
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
