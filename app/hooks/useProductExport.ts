import { useCallback } from "react";
import toast from "react-hot-toast";
import {
  formatPrice,
  getProductImage,
  parseDimensions,
  PRODUCT_IMAGE_COMPACT_PLACEHOLDER,
  PRODUCT_IMAGE_PLACEHOLDER,
} from "~/lib/utils";

import { Product } from "~/types";
import type { ExportProduct } from "~/types/hooks";

type DocxModule = typeof import("docx");

const EXPORT_TOAST_ID = "product-export";

function buildImageFetchUrl(imageUrl: string): string {
  if (!imageUrl) return imageUrl;

  try {
    const parsed = new URL(imageUrl);
    const isRemoteHttp =
      parsed.protocol === "http:" || parsed.protocol === "https:";

    if (isRemoteHttp && parsed.origin !== window.location.origin) {
      return `/api/image-proxy?url=${encodeURIComponent(parsed.toString())}`;
    }

    return imageUrl;
  } catch {
    return imageUrl;
  }
}

async function loadImageArrayBuffer(
  imageUrl: string,
): Promise<ArrayBuffer | null> {
  if (!imageUrl?.trim()) return null;

  try {
    const response = await fetch(buildImageFetchUrl(imageUrl), {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;

    const imageBlob = await response.blob();
    return imageBlob.arrayBuffer();
  } catch {
    return null;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function hydrateProductDimensions(
  products: ExportProduct[],
): Promise<ExportProduct[]> {
  return mapWithConcurrency(products, 4, async (product) => {
    if (parseDimensions(product.product_mention).length > 0) {
      return product;
    }

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        credentials: "same-origin",
      });

      if (!response.ok) return product;

      const details = (await response.json()) as Partial<Product>;
      return {
        ...product,
        product_mention:
          typeof details.product_mention === "string"
            ? details.product_mention
            : product.product_mention,
      };
    } catch {
      return product;
    }
  });
}

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

function formatDateForFilename(date: Date) {
  const pad2 = (n: number) => n.toString().padStart(2, "0");
  return `${pad2(date.getDate())}-${pad2(
    date.getMonth() + 1,
  )}-${date.getFullYear()}`;
}

function formatCompanyForFilename(company?: string, maxLength = 20) {
  const cleaned = (company ?? "")
    .replace(INVALID_FILENAME_CHARS, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
    .trim();

  return cleaned ? `${cleaned} ` : "";
}

export function useProductExport() {
  const generateProductParagraphs = useCallback(
    async (products: ExportProduct[], docxModule: DocxModule) => {
      const {
        ImageRun,
        Paragraph,
        Table,
        TableCell,
        TableRow,
        TextRun,
        WidthType,
      } = docxModule;
      const paragraphs = await mapWithConcurrency(
        products,
        3,
        async (product, index) => {
          let imageUrl: string | undefined;
          const productWithImages = product;

          if (productWithImages.images) {
            if (Array.isArray(productWithImages.images[0])) {
              imageUrl = (
                productWithImages.images[0] as unknown as string[]
              )[0];
            } else {
              imageUrl = productWithImages.images[0];
            }
          }

          imageUrl = imageUrl || getProductImage(product);
          const isProductImagePlaceholder =
            !imageUrl ||
            imageUrl === PRODUCT_IMAGE_PLACEHOLDER ||
            imageUrl === PRODUCT_IMAGE_COMPACT_PLACEHOLDER;

          if (isProductImagePlaceholder) {
            imageUrl = PRODUCT_IMAGE_COMPACT_PLACEHOLDER;
          }
          let imageArrayBuffer = await loadImageArrayBuffer(imageUrl);

          if (!imageArrayBuffer && imageUrl) {
            console.warn(
              `Falha ao carregar imagem para ${product.name}, usando placeholder`,
            );
            imageArrayBuffer = await loadImageArrayBuffer(
              PRODUCT_IMAGE_COMPACT_PLACEHOLDER,
            );
          }

          const productDimensions = parseDimensions(product.product_mention);
          const descriptionBlock = [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${product.product_cod} - ${product.name}`,
                  bold: true,
                  color: "000000",
                  size: 23,
                }),
              ],
              spacing: { after: 120 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${(product.description || "N/A").replace(/\n/g, " ")}`,
                  color: "000000",
                  size: 22,
                }),
                ...(productDimensions.length > 0
                  ? [
                      new TextRun({
                        text: "",
                        break: 1,
                      }),
                      ...productDimensions.flatMap((dimension, index) => [
                        new TextRun({
                          text: `${index > 0 ? " | " : ""}${dimension.label}: `,
                          bold: true,
                          color: "000000",
                          size: 22,
                        }),
                        new TextRun({
                          text: dimension.value,
                          color: "000000",
                          size: 22,
                        }),
                      ]),
                    ]
                  : []),
              ],
              spacing: { after: 120 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Valor unitário: " + formatPrice(product.price),
                  size: 23,
                  bold: true,
                }),
              ],
              spacing: { after: 60 },
            }),
          ];

          const imageCell = new TableCell({
            children: imageArrayBuffer
              ? [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: imageArrayBuffer,
                        transformation: { width: 180, height: 180 },
                        type: "png",
                      }),
                    ],
                    alignment: "center",
                    spacing: { after: 100 },
                  }),
                ]
              : [
                  new Paragraph({
                    text: "Sem Imagem",
                    alignment: "center",
                    spacing: { after: 100 },
                  }),
                ],
            width: { size: 4250, type: WidthType.DXA },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            verticalAlign: "center",
          });

          const descCell = new TableCell({
            children: descriptionBlock,
            width: { size: 4250, type: WidthType.DXA },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            verticalAlign: "center",
          });

          const rowCells =
            index % 2 === 0 ? [imageCell, descCell] : [descCell, imageCell];

          const productTable = new Table({
            rows: [
              new TableRow({
                children: rowCells,
                cantSplit: true,
              }),
            ],
            width: { size: 8500, type: WidthType.DXA },
            alignment: "center",
            margins: { top: 200, bottom: 200 },
            columnWidths: [4250, 4250],
            borders: {
              top: { style: "none", size: 0, color: "FFFFFF" },
              bottom: { style: "none", size: 0, color: "FFFFFF" },
              left: { style: "none", size: 0, color: "FFFFFF" },
              right: { style: "none", size: 0, color: "FFFFFF" },
              insideHorizontal: { style: "none", size: 0, color: "FFFFFF" },
              insideVertical: { style: "none", size: 0, color: "FFFFFF" },
            },
          });
          return [
            productTable,
            new Paragraph({
              children: [new TextRun({ text: "", size: 23 })],
              spacing: { after: 60 },
            }),
          ];
        },
      );
      return paragraphs.flat();
    },
    [],
  );

  const exportProducts = useCallback(
    async (
      products: ExportProduct[],
      setSelectedProducts?: (products: Product[]) => void,
      contact?: string,
      company?: string,
      description?: string,
    ) => {
      if (!products || products.length === 0) return;

      try {
        const docxModule = await import("docx");
        const {
          Document,
          ExternalHyperlink,
          Footer,
          Header,
          ImageRun,
          Packer,
          Paragraph,
          Table,
          TableCell,
          TableLayoutType,
          TableRow,
          TextRun,
          WidthType,
        } = docxModule;

        toast.loading(
          "Gerando documento... Processando as imagens e criando o arquivo Word.",
          { id: EXPORT_TOAST_ID },
        );

        const response = await fetch("/logo-new.png");
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        const productsWithDimensions = await hydrateProductDimensions(products);
        const productParagraphs = await generateProductParagraphs(
          productsWithDimensions,
          docxModule,
        );

        const doc = new Document({
          styles: {
            default: {
              document: {
                run: {
                  font: "Poppins",
                },
              },
            },
          },
          sections: [
            {
              headers: {
                default: new Header({
                  children: [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: arrayBuffer,
                          transformation: {
                            width: 190,
                            height: 74,
                          },
                          type: "png",
                        }),
                      ],
                      alignment: "center",
                      spacing: { after: 400 },
                    }),
                  ],
                }),
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "PROPOSTA",
                      size: 32,
                      underline: {},
                      bold: true,
                    }),
                  ],
                  alignment: "center",
                  spacing: { after: 400 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: "", size: 24 })],
                }),
                ...(contact
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: contact,
                            size: 24,
                          }),
                        ],
                      }),
                    ]
                  : []),
                ...(company
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: company,
                            size: 24,
                          }),
                        ],
                      }),
                    ]
                  : []),
                ...(description
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: description,
                            size: 24,
                          }),
                        ],
                        spacing: { after: 400 },
                      }),
                    ]
                  : []),
                ...productParagraphs,

                new Paragraph({
                  children: [new TextRun({ text: "", size: 24 })],
                  spacing: { after: 100 },
                }),
                new Table({
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Frete não incluso",
                                  size: 24,
                                  color: "000000",
                                }),
                              ],
                            }),
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Prazo de entrega 20 dias após aprovação da arte",
                                  size: 24,
                                  color: "000000",
                                }),
                              ],
                            }),
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Forma de pagamento a combinar",
                                  size: 24,
                                  color: "000000",
                                }),
                              ],
                            }),
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Frete para SP: R$ 169,90",
                                  size: 24,
                                  color: "000000",
                                }),
                              ],
                            }),
                          ],
                          width: { size: 8500, type: WidthType.DXA },
                          columnSpan: 2,
                          borders: {
                            top: { style: "single", size: 2, color: "000000" },
                            bottom: {
                              style: "single",
                              size: 2,
                              color: "000000",
                            },
                            left: { style: "single", size: 2, color: "000000" },
                            right: {
                              style: "single",
                              size: 2,
                              color: "000000",
                            },
                          },
                        }),
                      ],
                      cantSplit: true,
                    }),
                  ],
                  width: { size: 8500, type: WidthType.DXA },
                  alignment: "center",
                  margins: { top: 200, bottom: 200, left: 200, right: 200 },
                  columnWidths: [4250, 4250],
                }),
                new Paragraph({
                  children: [new TextRun({ text: "", size: 24 })],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Grata e à sua inteira disposição para quaisquer esclarecimentos.",
                      size: 24,
                      color: "000000",
                    }),
                  ],
                  keepNext: true,
                }),
                new Paragraph({
                  children: [new TextRun({ text: "", size: 24 })],
                  keepNext: true,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `São Paulo, ${new Date().toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      )}.`,
                      size: 24,
                      color: "000000",
                    }),
                  ],
                  keepNext: true,
                }),
                new Paragraph({
                  children: [new TextRun({ text: "", size: 24 })],
                  keepNext: true,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Santo Mimo Brindes",
                      size: 24,
                      color: "000000",
                      noProof: true,
                    }),
                  ],
                  keepNext: true,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "SP 11 96641-9950",
                      size: 24,
                      color: "000000",
                    }),
                  ],
                  keepNext: true,
                }),
                new Paragraph({
                  children: [
                    new ExternalHyperlink({
                      children: [
                        new TextRun({
                          text: "www.santomimo.com",
                          size: 24,
                          style: "Hyperlink",
                        }),
                      ],
                      link: "https://www.santomimo.com",
                    }),
                  ],
                  keepNext: true,
                }),
                new Paragraph({
                  children: [
                    new ExternalHyperlink({
                      children: [
                        new TextRun({
                          text: "@santomimo.brindes",
                          size: 24,
                          style: "Hyperlink",
                          noProof: true,
                        }),
                      ],
                      link: "https://instagram.com/santomimo.brindes",
                    }),
                  ],
                }),
              ],
              footers: {
                default: new Footer({
                  children: [
                    new Table({
                      layout: TableLayoutType.FIXED,
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              children: [
                                new Paragraph({
                                  children: [
                                    new TextRun({
                                      text: "SP 11 96641-9950",
                                      size: 24,
                                      color: "000000",
                                    }),
                                  ],
                                  alignment: "left",
                                }),
                              ],
                              verticalAlign: "center",
                              borders: {
                                top: {
                                  style: "none",
                                  size: 0,
                                  color: "FFFFFF",
                                },
                                bottom: {
                                  style: "none",
                                  size: 0,
                                  color: "FFFFFF",
                                },
                                left: {
                                  style: "none",
                                  size: 0,
                                  color: "FFFFFF",
                                },
                                right: {
                                  style: "none",
                                  size: 0,
                                  color: "FFFFFF",
                                },
                              },
                              width: { size: 2833, type: WidthType.DXA },
                            }),
                            new TableCell({
                              children: [
                                new Paragraph({
                                  children: [
                                    new ExternalHyperlink({
                                      children: [
                                        new TextRun({
                                          text: "www.santomimo.com",
                                          size: 24,
                                          style: "Hyperlink",
                                        }),
                                      ],
                                      link: "https://www.santomimo.com",
                                    }),
                                  ],
                                  alignment: "left",
                                }),
                              ],
                              verticalAlign: "center",
                              borders: {
                                top: {
                                  style: "none",
                                  size: 0,
                                  color: "FFFFFF",
                                },
                                bottom: {
                                  style: "none",
                                  size: 0,
                                  color: "FFFFFF",
                                },
                                left: {
                                  style: "none",
                                  size: 0,
                                  color: "FFFFFF",
                                },
                                right: {
                                  style: "none",
                                  size: 0,
                                  color: "FFFFFF",
                                },
                              },
                              width: { size: 2833, type: WidthType.DXA },
                            }),
                            new TableCell({
                              children: [
                                new Paragraph({
                                  children: [
                                    new ExternalHyperlink({
                                      children: [
                                        new TextRun({
                                          text: "@santomimo.brindes",
                                          size: 24,
                                          style: "Hyperlink",
                                          noProof: true,
                                        }),
                                      ],
                                      link: "https://instagram.com/santomimo.brindes",
                                    }),
                                  ],
                                  alignment: "right",
                                }),
                              ],
                              verticalAlign: "center",
                              borders: {
                                top: {
                                  style: "none",
                                  size: 0,
                                  color: "FFFFFF",
                                },
                                bottom: {
                                  style: "none",
                                  size: 0,
                                  color: "FFFFFF",
                                },
                                left: {
                                  style: "none",
                                  size: 0,
                                  color: "FFFFFF",
                                },
                                right: {
                                  style: "none",
                                  size: 0,
                                  color: "FFFFFF",
                                },
                              },
                              width: { size: 2833, type: WidthType.DXA },
                            }),
                          ],
                        }),
                      ],
                      width: { size: 8500, type: WidthType.DXA },
                      alignment: "center",
                      columnWidths: [2833, 2833, 2833],
                      borders: {
                        top: { style: "none", size: 0, color: "FFFFFF" },
                        bottom: { style: "none", size: 0, color: "FFFFFF" },
                        left: { style: "none", size: 0, color: "FFFFFF" },
                        right: { style: "none", size: 0, color: "FFFFFF" },
                        insideHorizontal: {
                          style: "none",
                          size: 0,
                          color: "FFFFFF",
                        },
                        insideVertical: {
                          style: "none",
                          size: 0,
                          color: "FFFFFF",
                        },
                      },
                    }),
                  ],
                }),
              },
            },
          ],
        });

        Packer.toBlob(doc)
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const dateStr = formatDateForFilename(new Date());
            const companyPart = formatCompanyForFilename(company, 20);
            a.href = url;
            a.download = `Santo Mimo - ${companyPart}${dateStr}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("Arquivo Word gerado e download iniciado.");

            toast.success(
              "Documento criado! O arquivo foi baixado com sucesso.",
              {
                id: EXPORT_TOAST_ID,
                duration: 3000,
              },
            );

            if (setSelectedProducts) setSelectedProducts([]);
          })
          .catch((error) => {
            console.error("Erro ao gerar arquivo Word:", error);
            toast.error("Erro ao gerar o arquivo Word", {
              id: EXPORT_TOAST_ID,
              duration: 5000,
            });
          });
      } catch (error) {
        console.error("Erro durante a exportação:", error);
        toast.error("Erro ao processar as imagens", {
          id: EXPORT_TOAST_ID,
          duration: 5000,
        });
      }
    },
    [generateProductParagraphs],
  );

  return {
    exportProducts,
  };
}
