import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

function formatZodErrors(err: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  const issues = (err as any).issues ?? (err as any).errors ?? [];
  issues.forEach((e: any) => {
    fields[e.path.join(".") || "root"] = e.message;
  });
  return fields;
}

/**
 * Validates req.json() against a Zod schema.
 * Returns { data } on success or { error: NextResponse } on failure.
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      error: NextResponse.json(
        { error: "Validation failed", fields: { body: "Invalid JSON" } },
        { status: 400 }
      ),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: NextResponse.json(
        { error: "Validation failed", fields: formatZodErrors(parsed.error) },
        { status: 400 }
      ),
    };
  }

  return { data: parsed.data };
}

/**
 * Validates URL search params against a Zod schema.
 * Returns { data } on success or { error: NextResponse } on failure.
 */
export function validateParams<T>(
  params: Record<string, string | undefined>,
  schema: ZodSchema<T>
): { data: T } | { error: NextResponse } {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return {
      error: NextResponse.json(
        {
          error: "Invalid parameter",
          fields: formatZodErrors(parsed.error),
        },
        { status: 400 }
      ),
    };
  }
  return { data: parsed.data };
}
