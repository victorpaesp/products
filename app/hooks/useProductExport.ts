import { useState, useCallback } from "react";
import { Product } from "~/types";
import {
  Document,
  Header,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ExternalHyperlink,
  Footer,
} from "docx";
import { loadImageWithCORS } from "~/lib/document-utils";
import { formatPrice, getProductImage } from "~/lib/utils";

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
          const imageUrl =
            getProductImage(product) ||
            "https://via.placeholder.com/300x200/cccccc/000000?text=Produto";
          let imageArrayBuffer = await loadImageWithCORS(imageUrl);

          if (!imageArrayBuffer && getProductImage(product)) {
            console.warn(
              `Falha ao carregar imagem para ${product.name}, usando placeholder`
            );
            imageArrayBuffer = await loadImageWithCORS(
              "https://via.placeholder.com/300x200/cccccc/000000?text=Sem+Imagem"
            );
          }

          const quantity = productQuantities?.[product.product_cod] ?? 1;
          const stock =
            product.variations && product.variations.length > 0
              ? product.variations[0].stock ?? 0
              : 9999;
          const isQuantityExceeded = quantity > stock;

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
            new Paragraph({
              children: [
                new TextRun({
                  text: "Quantidade: " + quantity,
                  size: 23,
                  bold: true,
                }),
              ],
              spacing: { after: 60 },
            }),
            ...(isQuantityExceeded
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Estoque do produto excedido",
                        size: 23,
                        bold: true,
                        color: "FF0000",
                      }),
                    ],
                    spacing: { after: 60 },
                  }),
                ]
              : []),
          ];

          const imageCell = new TableCell({
            children: imageArrayBuffer
              ? [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: imageArrayBuffer,
                        transformation: {
                          width: 180,
                          height: 180,
                        },
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
      productQuantities?: Record<string, number>,
      seller?: string,
      company?: string,
      contact?: string
    ) => {
      if (!products || products.length === 0) return;

      try {
        setExportToast({
          isVisible: true,
          status: "processing",
        });

        const response = await fetch("/santo-mimo-logo.jpg");
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        const productParagraphs = await generateProductParagraphs(
          products,
          productQuantities ?? {}
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
                            width: 172,
                            height: 140,
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
                ...(seller
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: seller,
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
                ...(contact
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: contact,
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
                      cantSplit: false,
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
                }),
                new Paragraph({
                  children: [new TextRun({ text: "", size: 24 })],
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
                        }
                      )}.`,
                      size: 24,
                      color: "000000",
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun({ text: "", size: 24 })],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Mariana Szabloczky",
                      size: 24,
                      color: "000000",
                      noProof: true,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Santo Mimo",
                      size: 24,
                      color: "000000",
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Fone 11 96641-9950",
                      size: 24,
                      color: "000000",
                    }),
                  ],
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
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              children: [
                                new Paragraph({
                                  children: [
                                    new TextRun({
                                      text: "Fone 11 96641-9950",
                                      size: 24,
                                      color: "000000",
                                    }),
                                  ],
                                  alignment: "left",
                                }),
                              ],
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
                                  alignment: "center",
                                }),
                              ],
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
            const dateStr = new Date()
              .toLocaleDateString("pt-BR")
              .replace(/\//g, "-");
            a.href = url;
            a.download = `proposta_${dateStr}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("Arquivo Word gerado e download iniciado.");

            setExportToast({
              isVisible: true,
              status: "success",
            });

            if (setSelectedProducts) setSelectedProducts([]);

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
