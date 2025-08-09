import { type LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get("url");
  
  if (!imageUrl) {
    return new Response("URL da imagem é obrigatória", { status: 400 });
  }

  try {
    // Faz a requisição para a imagem externa
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Erro ao buscar imagem: ${imageResponse.status}`);
    }

    // Obtém o blob da imagem
    const imageBlob = await imageResponse.blob();
    
    // Retorna a imagem com os headers apropriados
    return new Response(imageBlob, {
      status: 200,
      headers: {
        "Content-Type": imageResponse.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=3600", // Cache por 1 hora
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Erro no proxy de imagem:", error);
    
    // Retorna uma imagem placeholder em caso de erro
    try {
      const placeholderResponse = await fetch("https://via.placeholder.com/300x200/cccccc/000000?text=Erro+ao+Carregar");
      const placeholderBlob = await placeholderResponse.blob();
      
      return new Response(placeholderBlob, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=300", // Cache menor para placeholders
        },
      });
    } catch (placeholderError) {
      return new Response("Erro ao carregar imagem", { status: 500 });
    }
  }
}
