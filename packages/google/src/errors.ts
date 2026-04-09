export class GoogleAdapterError extends Error {
  public readonly code: string;
  public readonly service: string;
  public readonly status: number;
  public readonly transient: boolean;
  public readonly details: Record<string, unknown>;

  constructor(args: {
    message: string;
    code: string;
    service: string;
    status?: number;
    transient?: boolean;
    details?: Record<string, unknown>;
  }) {
    super(args.message);
    this.name = "GoogleAdapterError";
    this.code = args.code;
    this.service = args.service;
    this.status = args.status ?? 500;
    this.transient = args.transient ?? false;
    this.details = args.details ?? {};
  }
}

export function mapGoogleHttpError(service: string, status: number, body: unknown): GoogleAdapterError {
  const transient = status === 429 || status >= 500;
  const code =
    status === 401
      ? "google_auth_error"
      : status === 403
        ? "google_forbidden"
        : status === 404
          ? "google_not_found"
          : transient
            ? "google_transient_error"
            : "google_request_error";

  return new GoogleAdapterError({
    message: `Google ${service} request failed with ${status}`,
    code,
    service,
    status,
    transient,
    details: {
      response: body
    }
  });
}

export function isTransientGoogleError(error: unknown): boolean {
  return error instanceof GoogleAdapterError && error.transient;
}
