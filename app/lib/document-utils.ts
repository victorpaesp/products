/**
 * Carrega uma imagem usando o proxy backend para resolver problemas de CORS
 * @param imageUrl URL da imagem para carregar
 * @returns Promise com ArrayBuffer da imagem ou null se falhar
 */
export async function loadImageWithCORS(imageUrl: string): Promise<ArrayBuffer | null> {
  try {
    let finalUrl = imageUrl;
    
    // Se for uma URL externa (não localhost e não placeholder), usa o proxy
    if (imageUrl.startsWith('http') && 
        !imageUrl.includes('localhost') && 
        !imageUrl.includes('placeholder') &&
        !imageUrl.includes(window.location.origin)) {
      finalUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    }
    
    const response = await fetch(finalUrl);
    
    if (response.ok) {
      const imgBlob = await response.blob();
      return await imgBlob.arrayBuffer();
    }
  } catch (error) {
    console.warn(`Erro ao carregar imagem ${imageUrl}:`, error);
  }
  
  return null;
}
