import { useState, useCallback } from "react";
import { Product } from "~/types";
import {
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { loadImageWithCORS } from "~/lib/document-utils";
import { formatPrice, parsePrice, formatTotalPrice } from "~/lib/utils";

interface ExportToastState {
  isVisible: boolean;
  status: "processing" | "success" | "error";
  message?: string;
}

export function useProductExport() {
  const [exportToast, setExportToast] = useState<ExportToastState>({
    isVisible: false,
    status: "processing",
  });

  const generateProductParagraphs = useCallback(
    async (products: Product[], productQuantities: Record<string, number>) => {
      const paragraphs = await Promise.all(
        products.map(async (product, index) => {
          // Usa a função exportada para carregar a imagem com tratamento de CORS via proxy
          const imageUrl =
            product.Image ||
            "https://via.placeholder.com/300x200/cccccc/000000?text=Produto";
          let imageArrayBuffer = await loadImageWithCORS(imageUrl);

          // Se falhou ao carregar a imagem, tenta carregar uma imagem placeholder
          if (!imageArrayBuffer && product.Image) {
            console.warn(
              `Falha ao carregar imagem para ${product.Name}, usando placeholder`
            );
            imageArrayBuffer = await loadImageWithCORS(
              "https://via.placeholder.com/300x200/cccccc/000000?text=Sem+Imagem"
            );
          }

          const paragraphs: Paragraph[] = [];

          // Adiciona a imagem apenas se conseguiu carregar
          if (imageArrayBuffer) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageArrayBuffer,
                    transformation: {
                      width: 200,
                      height: 150,
                    },
                    type: "png",
                  }),
                ],
                alignment: "center",
                spacing: { after: 200 },
              })
            );
          }

          paragraphs.push(
            // Cabeçalho para cada produto
            new Paragraph({
              text: `Produto ${index + 1}: ${product.Name}`,
              heading: "Heading1",
              spacing: { after: 200 },
            })
          );

          paragraphs.push(
            // Descrição do produto
            new Paragraph({
              text: `Descrição: ${product.Description || "N/A"}`,
              spacing: { after: 100 },
            }),
            // Linha de preços detalhada (unitário, quantidade, total)
            new Paragraph({
              text: `Preço Unitário: ${formatPrice(
                product.Price
              )} | Quantidade: ${
                productQuantities?.[product.ProductCod] ?? 1
              } | Total: ${formatTotalPrice(
                product.Price,
                productQuantities?.[product.ProductCod] ?? 1
              )}`,
              spacing: { after: 300 },
            }),
            // Linha separadora
            new Paragraph({
              text: "----------------------------------------",
              alignment: "center",
              spacing: { after: 300 },
            })
          );

          return paragraphs;
        })
      );
      return paragraphs.flat();
    },
    []
  );

  const exportProducts = useCallback(
    async (
      products: Product[],
      setSelectedProducts?: (products: Product[]) => void,
      productQuantities?: Record<string, number>
    ) => {
      if (!products || products.length === 0) return;

      try {
        // Mostra o toast de processamento
        setExportToast({
          isVisible: true,
          status: "processing",
        });

        // Obtém a data atual formatada
        const currentDate = new Date().toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        const response = await fetch("/logo.jpeg");
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        // Gera os parágrafos dos produtos (agora assíncrono)
        const productParagraphs = await generateProductParagraphs(
          products,
          productQuantities ?? {}
        );

        const totalBudgetAmount = products
          .reduce((acc, p) => {
            const key = p.ProductCod;
            const quantity = (productQuantities ?? {})[key] ?? 1;
            const unit = parsePrice(p.Price);
            return acc + unit * quantity;
          }, 0)
          .toString();

        // Cria o conteúdo do documento Word com cabeçalho e rodapé
        const doc = new Document({
          sections: [
            {
              headers: {
                default: new Header({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Santo Mimo",
                          bold: true,
                          size: 32,
                        }),
                        new TextRun({
                          text: " ",
                        }),
                        new ImageRun({
                          data: arrayBuffer,
                          transformation: {
                            width: 100,
                            height: 100,
                          },
                          type: "jpg",
                        }),
                      ],
                      alignment: "center",
                      spacing: { after: 400 },
                    }),
                  ],
                }),
              },
              footers: {
                default: new Footer({
                  children: [
                    new Paragraph({
                      text: `Documento gerado em: ${currentDate}`,
                      alignment: "center",
                      spacing: { after: 200 },
                    }),
                  ],
                }),
              },
              children: [
                // Título do documento
                new Paragraph({
                  text: "Lista de Produtos Selecionados",
                  heading: "Title",
                  alignment: "center",
                  spacing: { after: 400 },
                }),
                // Adiciona os produtos com formatação
                ...productParagraphs,
                // Parágrafo final com o total geral do orçamento
                new Paragraph({
                  text: `Total Geral do Orçamento: ${formatPrice(
                    totalBudgetAmount
                  )}`,
                  heading: "Heading2",
                  alignment: "center",
                  spacing: { before: 400 },
                }),
              ],
            },
          ],
        });

        // Gera o arquivo Word e inicia o download
        Packer.toBlob(doc)
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "produtos_selecionados.docx";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("Arquivo Word gerado e download iniciado.");

            // Mostra toast de sucesso
            setExportToast({
              isVisible: true,
              status: "success",
            });

            // Limpa a seleção após exportar
            if (setSelectedProducts) setSelectedProducts([]);

            // Esconde o toast de sucesso após 3 segundos
            setTimeout(() => {
              setExportToast((prev) => ({ ...prev, isVisible: false }));
            }, 3000);
          })
          .catch((error) => {
            console.error("Erro ao gerar arquivo Word:", error);
            setExportToast({
              isVisible: true,
              status: "error",
              message: "Erro ao gerar o arquivo Word",
            });

            // Esconde o toast de erro após 5 segundos
            setTimeout(() => {
              setExportToast((prev) => ({ ...prev, isVisible: false }));
            }, 5000);
          });
      } catch (error) {
        console.error("Erro durante a exportação:", error);
        setExportToast({
          isVisible: true,
          status: "error",
          message: "Erro ao processar as imagens",
        });

        // Esconde o toast de erro após 5 segundos
        setTimeout(() => {
          setExportToast((prev) => ({ ...prev, isVisible: false }));
        }, 5000);
      }
    },
    [generateProductParagraphs]
  );

  const resetExportState = () => {
    setExportToast((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };

  return {
    exportToast,
    exportProducts,
    resetExportState,
  };
}
