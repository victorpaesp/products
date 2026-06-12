import { type LoaderFunctionArgs } from "@remix-run/node";

const IMAGE_FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
};

const CACHE_CONTROL = "public, max-age=604800, stale-while-revalidate=86400";
const SERVER_CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_SERVER_CACHE_ENTRIES = 300;
const MAX_CONCURRENT_ORIGIN_FETCHES = 4;

type CachedImage = {
  body: ArrayBuffer;
  contentType: string;
  expires: number;
};

const responseCache = new Map<string, CachedImage>();
const inflightFetches = new Map<string, Promise<Response>>();

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

function getCachedResponse(url: string): Response | null {
  const cached = responseCache.get(url);
  if (!cached) return null;

  if (Date.now() > cached.expires) {
    responseCache.delete(url);
    return null;
  }

  return new Response(cached.body.slice(0), {
    status: 200,
    headers: {
      "Content-Type": cached.contentType,
      "Cache-Control": CACHE_CONTROL,
      "X-Image-Cache": "HIT",
    },
  });
}

function storeCachedResponse(
  url: string,
  body: ArrayBuffer,
  contentType: string,
) {
  if (responseCache.size >= MAX_SERVER_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }

  responseCache.set(url, {
    body,
    contentType,
    expires: Date.now() + SERVER_CACHE_TTL_MS,
  });
}

function proxyErrorResponse(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

async function fetchFromOrigin(url: string): Promise<Response> {
  await acquireOriginFetchSlot();

  try {
    const imageResponse = await fetch(url, {
      headers: IMAGE_FETCH_HEADERS,
      signal: AbortSignal.timeout(10_000),
    });

    if (!imageResponse.ok) {
      return proxyErrorResponse(
        imageResponse.status === 429 ? 429 : 502,
        "Erro ao carregar imagem",
      );
    }

    const body = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get("Content-Type") || "image/jpeg";

    storeCachedResponse(url, body, contentType);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": CACHE_CONTROL,
        "X-Image-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Erro ao buscar imagem:", error);
    return proxyErrorResponse(502, "Erro ao carregar imagem");
  } finally {
    releaseOriginFetchSlot();
  }
}

async function fetchProxiedImage(url: string): Promise<Response> {
  const cached = getCachedResponse(url);
  if (cached) return cached;

  const inflight = inflightFetches.get(url);
  if (inflight) return inflight;

  const promise = fetchFromOrigin(url).finally(() => {
    inflightFetches.delete(url);
  });

  inflightFetches.set(url, promise);
  return promise;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const requestUrl = new URL(request.url);
  const imageUrlParam = requestUrl.searchParams.get("url");

  if (!imageUrlParam) {
    return proxyErrorResponse(400, "URL da imagem é obrigatória");
  }

  try {
    const parsedImageUrl = new URL(imageUrlParam);
    if (
      parsedImageUrl.protocol !== "http:" &&
      parsedImageUrl.protocol !== "https:"
    ) {
      return proxyErrorResponse(400, "URL da imagem inválida");
    }

    return await fetchProxiedImage(parsedImageUrl.toString());
  } catch (error) {
    console.error("Erro no proxy de imagem:", error);
    return proxyErrorResponse(502, "Erro ao carregar imagem");
  }
}
