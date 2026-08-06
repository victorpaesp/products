import { type LoaderFunctionArgs } from "@remix-run/node";
import { getSessionToken } from "~/lib/auth.server";

const IMAGE_FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
};

const BROWSER_CACHE_CONTROL = "public, max-age=604800, immutable";
const CDN_CACHE_CONTROL =
  "public, max-age=604800, stale-while-revalidate=86400";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const MAX_CONCURRENT_ORIGIN_FETCHES = 4;

const DEFAULT_ALLOWED_HOSTS = [
  "wooch.com",
  "tcdn.com.br",
  "xbzbrindes.com.br",
  "spotgifts.com.br",
  "asiaimport.com.br",
];

const allowedHosts = new Set(
  [
    ...DEFAULT_ALLOWED_HOSTS,
    ...(process.env.IMAGE_PROXY_ALLOWED_HOSTS ?? "").split(","),
  ]
    .map((host) => host.trim().toLowerCase().replace(/^\.+/, ""))
    .filter(Boolean),
);

type ProxiedImage = {
  body: ArrayBuffer;
  contentType: string;
};

const inflightFetches = new Map<string, Promise<ProxiedImage>>();

let activeOriginFetches = 0;
const originFetchWaitQueue: Array<() => void> = [];

function acquireOriginFetchSlot(): Promise<void> {
  if (activeOriginFetches < MAX_CONCURRENT_ORIGIN_FETCHES) {
    activeOriginFetches += 1;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    originFetchWaitQueue.push(() => {
      activeOriginFetches += 1;
      resolve();
    });
  });
}

function releaseOriginFetchSlot() {
  activeOriginFetches -= 1;
  const next = originFetchWaitQueue.shift();
  if (next) next();
}

function proxyErrorResponse(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isAllowedImageUrl(url: URL): boolean {
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  ) {
    return false;
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  return Array.from(allowedHosts).some(
    (allowedHost) =>
      hostname === allowedHost || hostname.endsWith(`.${allowedHost}`),
  );
}

function parseAllowedImageUrl(value: string, base?: URL): URL | null {
  try {
    const url = base ? new URL(value, base) : new URL(value);
    url.hash = "";
    return isAllowedImageUrl(url) ? url : null;
  } catch {
    return null;
  }
}

function isSupportedImageContentType(contentType: string): boolean {
  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();
  return Boolean(
    mediaType?.startsWith("image/") && mediaType !== "image/svg+xml",
  );
}

async function readBodyWithLimit(response: Response): Promise<ArrayBuffer> {
  const declaredLength = Number(response.headers.get("Content-Length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
    throw new Error("Imagem excede o limite permitido");
  }

  if (!response.body) {
    throw new Error("Origem retornou uma imagem vazia");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      receivedBytes += value.byteLength;
      if (receivedBytes > MAX_IMAGE_BYTES) {
        await reader.cancel();
        throw new Error("Imagem excede o limite permitido");
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body.buffer;
}

async function fetchAllowedResponse(initialUrl: URL): Promise<Response> {
  let currentUrl = initialUrl;

  for (
    let redirectCount = 0;
    redirectCount <= MAX_REDIRECTS;
    redirectCount += 1
  ) {
    const response = await fetch(currentUrl, {
      headers: IMAGE_FETCH_HEADERS,
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status < 300 || response.status >= 400) return response;

    const location = response.headers.get("Location");
    const nextUrl = location
      ? parseAllowedImageUrl(location, currentUrl)
      : null;

    if (!nextUrl) {
      throw new Error("Redirecionamento para origem não permitida");
    }

    await response.body?.cancel();
    currentUrl = nextUrl;
  }

  throw new Error("Número máximo de redirecionamentos excedido");
}

async function fetchFromOrigin(url: URL): Promise<ProxiedImage> {
  await acquireOriginFetchSlot();

  try {
    const imageResponse = await fetchAllowedResponse(url);

    if (!imageResponse.ok) {
      throw new Error(`Origem retornou HTTP ${imageResponse.status}`);
    }

    const contentType = imageResponse.headers.get("Content-Type")?.trim() || "";
    if (!isSupportedImageContentType(contentType)) {
      throw new Error("Origem não retornou um tipo de imagem permitido");
    }

    return {
      body: await readBodyWithLimit(imageResponse),
      contentType,
    };
  } finally {
    releaseOriginFetchSlot();
  }
}

async function fetchProxiedImage(url: URL): Promise<ProxiedImage> {
  const cacheKey = url.toString();
  const inflight = inflightFetches.get(cacheKey);
  if (inflight) return inflight;

  const promise = fetchFromOrigin(url).finally(() => {
    inflightFetches.delete(cacheKey);
  });

  inflightFetches.set(cacheKey, promise);
  return promise;
}

function imageResponse(image: ProxiedImage): Response {
  return new Response(image.body.slice(0), {
    status: 200,
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": BROWSER_CACHE_CONTROL,
      "Vercel-CDN-Cache-Control": CDN_CACHE_CONTROL,
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!(await getSessionToken(request))) {
    return proxyErrorResponse(401, "Autenticação obrigatória");
  }

  const requestUrl = new URL(request.url);
  const imageUrlParam = requestUrl.searchParams.get("url");

  if (!imageUrlParam) {
    return proxyErrorResponse(400, "URL da imagem é obrigatória");
  }

  const imageUrl = parseAllowedImageUrl(imageUrlParam);
  if (!imageUrl) {
    return proxyErrorResponse(403, "Origem da imagem não permitida");
  }

  try {
    return imageResponse(await fetchProxiedImage(imageUrl));
  } catch (error) {
    console.error("Erro no proxy de imagem:", error);
    return proxyErrorResponse(502, "Erro ao carregar imagem");
  }
}
