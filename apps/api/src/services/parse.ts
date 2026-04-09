import type { ZodSchema } from "zod";

export async function parseJsonBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  const payload = await request.json();
  return schema.parse(payload);
}
