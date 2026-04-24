import type { ZodSchema } from "zod";
import { ZodError } from "zod";

/**
 * parseJsonBody — Safely parse and validate JSON body from Hono Context.
 * Uses Hono's internal body caching to prevent "body already consumed" errors.
 */
export async function parseJsonBody<T>(c: { req: { json(): Promise<unknown> } }, schema: ZodSchema<T>): Promise<T> {
  try {
    const json = await c.req.json();
    return schema.parse(json);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    // Re-throw as SyntaxError so Hono's onError can handle it as invalid JSON
    throw new SyntaxError(error instanceof Error ? error.message : "Invalid or missing JSON body");
  }
}
