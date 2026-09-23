import { type ActionFunctionArgs } from "@remix-run/node";

const MAX_BODY_BYTES = 8_000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Método não permitido", { status: 405 });
  }

  const contentLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  try {
    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) {
      return new Response(null, { status: 413 });
    }

    const payload: unknown = JSON.parse(body);
    if (!isPlainObject(payload)) {
      return new Response(null, { status: 400 });
    }

    console.error("[EXPORT-DIAGNOSTIC]", {
      ...payload,
      userAgent: request.headers.get("User-Agent")?.slice(0, 200),
      timestamp: new Date().toISOString(),
    });

    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
