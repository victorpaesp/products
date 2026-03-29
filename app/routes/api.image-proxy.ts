import { type LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const requestUrl = new URL(request.url);
  const imageUrlParam = requestUrl.searchParams.get("url");

  if (!imageUrlParam) {
    return new Response("URL da imagem é obrigatória", { status: 400 });
  }

  try {
    const parsedImageUrl = new URL(imageUrlParam);
    if (
      parsedImageUrl.protocol !== "http:" &&
      parsedImageUrl.protocol !== "https:"
    ) {
      return new Response("URL da imagem inválida", { status: 400 });
    }

    const imageResponse = await fetch(parsedImageUrl.toString(), {
      signal: AbortSignal.timeout(8000),
    });

    if (!imageResponse.ok) {
      throw new Error(`Erro ao buscar imagem: ${imageResponse.status}`);
    }

    return new Response(imageResponse.body, {
      status: 200,
      headers: {
        "Content-Type":
          imageResponse.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Erro no proxy de imagem:", error);
    return new Response("Erro ao carregar imagem", { status: 502 });
  }
}
