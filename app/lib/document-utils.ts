/**
 * Carrega uma imagem com tratamento de CORS
 * @param imageUrl URL da imagem para carregar
 * @returns Promise com ArrayBuffer da imagem ou null se falhar
 */
export async function loadImageWithCORS(imageUrl: string): Promise<ArrayBuffer | null> {
  try {
    // Se for uma URL externa, usa um proxy ou fallback
    const proxyUrl = imageUrl.startsWith('http') && !imageUrl.includes('localhost') && !imageUrl.includes('placeholder')
      ? `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`
      : imageUrl;
      
    const response = await fetch(proxyUrl);
    
    if (response.ok) {
      const imgBlob = await response.blob();
      return await imgBlob.arrayBuffer();
    }
  } catch (error) {
    console.warn(`Erro ao carregar imagem ${imageUrl}:`, error);
    // Usa imagem placeholder como fallback
    try {
      const fallbackResponse = await fetch("https://via.placeholder.com/300x200/cccccc/000000?text=Sem+Imagem");
      const fallbackBlob = await fallbackResponse.blob();
      return await fallbackBlob.arrayBuffer();
    } catch (fallbackError) {
      console.warn("Erro ao carregar imagem de fallback:", fallbackError);
    }
  }
  
  return null;
}
