import { Download, Search } from "lucide-react";
import { useNavigate, useSearchParams } from "@remix-run/react";
import { Input } from "~/components/ui/input";
import { api } from "~/lib/axios";
import { Product } from "~/types";
import { Document, Footer, Header, ImageRun, Packer, Paragraph, TextRun } from "docx"; // Biblioteca para gerar arquivos Word
import { formatPrice } from "~/lib/utils";

interface SearchBarProps {
  onSearch: (data: any) => void;
  onLoading: (loading: boolean) => void;
  selectedProducts?: Product[];
}

export function SearchBar({
  onSearch,
  onLoading,
  selectedProducts,
}: SearchBarProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") || "";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = formData.get("search") as string;
    const page = searchParams.get("page") || "1";
    const perPage = searchParams.get("per_page") || "12";

    onLoading(true);
    api
      .get("/dados", {
        params: {
          productName: search,
          page,
          per_page: perPage,
        },
      })
      .then((response) => {
        onSearch(response.data);
        navigate(`/products?q=${encodeURIComponent(search)}`);
      })
      .finally(() => onLoading(false));
  };

  const handleExport = async () => {
    if (!selectedProducts || selectedProducts.length === 0) return;

    // Obtém a data atual formatada
    const currentDate = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const response = await fetch("/logo.jpeg");
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

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
                      size: 32, // Tamanho do texto
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
            ...selectedProducts
              .map((product, index) => [
                // Cabeçalho para cada produto
                new Paragraph({
                  text: `Produto ${index + 1}: ${product.Name}`,
                  heading: "Heading1",
                  spacing: { after: 200 },
                }),
                // Descrição do produto
                new Paragraph({
                  text: `Descrição: ${product.Description || "N/A"}`,
                  spacing: { after: 100 },
                }),
                // Preço do produto
                new Paragraph({
                  text: `Preço: ${formatPrice(product.Price)}`,
                  spacing: { after: 300 },
                }),
                // Linha separadora
                new Paragraph({
                  text: "----------------------------------------",
                  alignment: "center",
                  spacing: { after: 300 },
                }),
              ])
              .flat(),
          ],
        },
      ],
    });

    // Gera o arquivo Word e inicia o download
    Packer.toBlob(doc).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "produtos_selecionados.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log("Arquivo Word gerado e download iniciado.");
    });
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-800 shadow-md z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <img src="/logo.jpeg" alt="logo" className="w-[50px]" />
        <form onSubmit={handleSubmit} className="max-w-2xl w-full mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              name="search"
              type="search"
              placeholder="Buscar produtos..."
              defaultValue={searchTerm}
              className="h-12 text-lg pl-10 w-full bg-black text-white placeholder:text-gray-400"
            />
          </div>
        </form>
        {selectedProducts && selectedProducts.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-black hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded shadow-md transition-all duration-200"
          >
            <Download className="h-5 w-5" />
            Exportar
          </button>
        )}
      </div>
    </div>
  );
}
