# Plano de implementação — Workspace administrativo

## Objetivo

Centralizar as operações exclusivas de administradores em um workspace próprio,
separado das configurações pessoais e do catálogo comercial.

O fluxo principal deve permitir localizar um produto, abrir um modal de edição,
alterar sua descrição manual e continuar trabalhando sem perder filtros,
paginação ou posição na lista.

## Decisões de produto

- Somente `admin` pode acessar ou executar operações administrativas.
- Os papéis continuarão sendo apenas `admin` e `user`.
- A descrição é o único campo de produto editável no primeiro momento.
- Novos campos devem poder ser adicionados como seções independentes do editor.
- Dados importados do fornecedor nunca são sobrescritos: o sistema mantém
  `original`, `override` e o valor efetivamente exibido.
- Alterações entram no ar imediatamente depois de uma ação explícita de salvar.
- Não haverá autosave, edição em massa, histórico, autoria, rascunho ou aprovação.
- A experiência é desktop-first, mas continua funcional em telas menores.
- A solução deve suportar crescimento por paginação, filtros e busca no servidor.

## Arquitetura de informação

```text
Administração
├── Produtos
├── Categorias
│   ├── Gerenciar categorias
│   └── Revisões pendentes
└── Usuários
```

`/admin` redireciona para `/admin/products`. Não haverá dashboard com métricas
decorativas enquanto não existirem indicadores acionáveis.

Configurações passa a conter somente perfil, senha e preferências pessoais.

### Rotas

```text
/admin
/admin/products
/admin/categories
/admin/categories/reviews
/admin/users
```

Estrutura Remix prevista:

```text
app/routes/admin.tsx
app/routes/admin._index.tsx
app/routes/admin.products.tsx
app/routes/admin.categories.tsx
app/routes/admin.categories_.reviews.tsx
app/routes/admin.users.tsx
```

O layout pai valida `role === "admin"` no servidor. Esconder links no frontend
não é considerado proteção.

## Direção visual

- Usar os tokens existentes da Santo Mimo.
- Grafite e neutros estruturam o ambiente operacional.
- Amarelo da marca indica seleção, foco e orientação.
- Montserrat permanece nos títulos; Poppins, na interface e nos formulários.
- A navegação é compacta e densa, sem transformar cada informação em card.
- Movimento restrito a transições funcionais de 150–200 ms.
- Respeitar `prefers-reduced-motion`, contraste WCAG AA e navegação por teclado.

A assinatura visual do editor será o indicador de procedência do dado:

```text
Fornecedor ─────────────── Substituição manual
     ○                              ●
```

Ele informa de forma funcional se o catálogo exibe o valor importado ou o
override manual.

## Shell administrativo

O admin possui layout próprio, sem busca comercial, sacola de produtos
selecionados e rodapé do catálogo.

```text
┌─────────────────────────────────────────────────────────────────┐
│ Santo Mimo · Administração                  Ver catálogo   VM    │
├────────────────┬────────────────────────────────────────────────┤
│ Produtos       │                                                │
│ Categorias  12 │  Conteúdo da seção                             │
│  Gerenciar     │                                                │
│  Revisões   12 │                                                │
│ Usuários       │                                                │
│ ─────────────  │                                                │
│ Ver catálogo   │                                                │
└────────────────┴────────────────────────────────────────────────┘
```

- Sidebar persistente em desktop.
- Navegação em Sheet em telas menores.
- Item ativo possui ícone, texto e indicador visual.
- “Categorias” funciona como grupo expansível.
- O badge aparece em “Categorias” quando recolhido e em “Revisões pendentes”
  quando expandido.
- “Ver catálogo” mantém uma saída previsível para o fluxo comercial.

## Produtos

Produtos usa uma tabela operacional, não uma cópia do grid comercial.

### Colunas do MVP

- Imagem pequena.
- Nome e código.
- Fornecedor.
- Estado da descrição: `Original`, `Personalizada` ou `Sem descrição`.
- Ação `Editar`.

Preço, estoque, peso, variações e dados fiscais ficam fora da listagem porque
não participam da tarefa administrativa inicial.

### Filtros

- Busca por nome ou código.
- Fornecedor.
- Origem da descrição.
- Ordenação por nome ou atualização.
- Paginação no servidor.

Todos os estados relevantes ficam na URL:

```text
/admin/products?q=caneca&supplier_id=3&description=override&page=2
```

Não haverá checkboxes ou affordance de seleção em massa no MVP.

## Modal de edição do produto

Abrir uma linha adiciona `product=<id>` à URL e apresenta um modal
administrativo amplo, inspirado na leitura dos detalhes do produto do catálogo.

O editor mostra:

- Carrossel com imagens do produto, galeria e todas as variações.
- Contexto compacto com nome, código, fornecedor, preço, especificações e
  variações.
- Texto efetivamente exibido no catálogo em modo leitura.
- Descrição original do fornecedor em uma área expansível somente leitura.
- Indicador textual da origem efetiva.
- Ação explícita `Editar` apenas nos campos configuráveis.
- Durante a edição, ações `Restaurar original`, `Cancelar` e
  `Salvar alteração`.

Regras:

- Salvar publica imediatamente.
- O botão fica desabilitado sem alterações.
- A submissão em andamento não pode ser duplicada.
- Erros preservam o texto digitado e explicam como tentar novamente.
- Fechar ou navegar com mudanças pendentes exige confirmação.
- Sucesso atualiza o item da lista sem recarregar a página.
- O foco entra no título do modal e retorna à linha ao fechar.

## Extensibilidade do editor

Evitar um form engine genérico. Usar seções React tipadas e independentes:

```text
app/components/features/admin/products/editor/
├── AdminProductEditor.tsx
├── ProductEditorHeader.tsx
├── ProductEditorNavigation.tsx
└── sections/
    └── description/
        ├── ProductDescriptionSection.tsx
        ├── description-schema.ts
        └── useProductDescriptionEditor.ts
```

Registro central:

```ts
const productEditorSections = [
  {
    id: "description",
    label: "Descrição",
    component: ProductDescriptionSection,
  },
];
```

Navegação interna só aparece quando houver duas ou mais seções.

Contrato conceitual recomendado:

```ts
type EditableSourceField<T> = {
  original: T;
  override: T | null;
  effective: T;
  source: "supplier" | "manual";
};
```

## Categorias

O gerenciamento atual será movido de Configurações para
`/admin/categories`, preservando:

- Busca.
- Hierarquia principal e subcategoria.
- Criar, editar, ativar, desativar e remover.
- Gerenciamento de palavras-chave.

Um produto pode pertencer a várias categorias. Quando a associação manual for
adicionada ao editor, ela será autoritativa sobre classificações automáticas.

## Revisões de classificação

O fluxo atual pertence ao domínio de categorias e fica em
`/admin/categories/reviews`:

- Filtros e paginação na URL.
- Produto e categoria sugerida.
- Score.
- Categorias atuais.
- Aprovar ou rejeitar.
- Link para abrir o produto no editor administrativo.
- Badge futuro com total pendente na navegação.

Uma aprovação não pode remover escolhas manuais existentes.

## Usuários

O gerenciamento atual será movido para `/admin/users`. Toda operação permanece
protegida no loader/action Remix e no backend.

## Escalabilidade

A listagem administrativa deve receber um DTO enxuto:

```ts
type AdminProductListItem = {
  id: number;
  product_cod: string;
  name: string;
  thumbnail: string | null;
  supplier: {
    id: number;
    name: string;
  };
  description_source: "supplier" | "manual";
  has_description: boolean;
  updated_at: string;
};
```

Não carregar galerias, todas as variações, estoque detalhado ou dados fiscais
na listagem.

No estágio atual, o Remix converte a resposta completa nesse DTO antes de
serializá-la para o navegador. Isso reduz o payload e o acoplamento do frontend,
mas o backend ainda deve ganhar um endpoint administrativo dedicado para evitar
que os dados excedentes trafeguem entre backend e servidor Remix.

Frontend:

- Cache por combinação de filtros.
- Dados anteriores durante a troca de página.
- Prefetch da próxima página.
- Busca com debounce de 250–350 ms.
- Invalidação seletiva após mutation.
- Skeletons com dimensões estáveis.
- Sem virtualização prematura enquanto houver paginação.

## Responsividade

- Desktop: sidebar persistente, tabela completa e modal amplo em duas colunas.
- Tablet: sidebar recolhível, menos colunas e modal adaptado à largura útil.
- Celular: navegação em Sheet, editor em modal de tela cheia e ações acessíveis.

## Acessibilidade

- Funcionalidade completa por teclado.
- Item ativo da navegação anunciado semanticamente.
- `aria-sort` em colunas ordenáveis.
- Labels visíveis e erros próximos aos campos.
- Estados nunca comunicados apenas por cor.
- Alvos interativos de pelo menos 44 px em telas de toque.
- Gerenciamento e restauração de foco em overlays.
- Sem scroll horizontal obrigatório no celular.

## Fases

### Fase 1 — Fundação administrativa

- [x] Criar e proteger o layout `/admin`.
- [x] Implementar sidebar, header e navegação móvel.
- [x] Adicionar “Administração” ao menu do admin.
- [x] Fazer `/admin` redirecionar para produtos.
- [x] Separar o shell administrativo do layout comercial.
- [x] Deixar Configurações somente com perfil.

### Fase 2 — Workbench de produtos

- [x] Definir DTO administrativo enxuto na fronteira Remix.
- [ ] Mover o DTO enxuto para um endpoint dedicado no backend.
- [x] Implementar busca, filtro por fornecedor, ordenação e paginação no servidor.
- [ ] Adicionar filtro por origem da descrição ao contrato do backend.
- [x] Criar tabela operacional.
- [x] Persistir estado na URL.
- [x] Abrir produto por `product=<id>`.
- [x] Implementar loading, erro e estado vazio.

### Fase 3 — Editor de descrição

- [x] Extrair a lógica administrativa de `ProductDetails`.
- [x] Criar `ProductDescriptionSection`.
- [x] Exibir original, override e origem efetiva.
- [x] Salvar e restaurar.
- [x] Proteger contra descarte acidental.
- [x] Atualizar cache e tabela após salvamento.

### Fase 4 — Migração das operações

- [x] Mover categorias para `/admin/categories`.
- [x] Mover revisões para `/admin/categories/reviews`.
- [x] Mover usuários para `/admin/users`.
- [x] Adicionar integração entre revisão e editor de produto.
- [x] Adicionar badge de pendências.

### Fase 5 — Qualidade e escala

- [ ] Testar proteção de rotas e actions.
- [ ] Testar mutations e rollback.
- [ ] Testar filtros e deep links.
- [ ] Validar teclado e leitores de tela.
- [ ] Validar 375, 768, 1024 e 1440 px.
- [ ] Simular listagens grandes.
- [ ] Medir antes de otimizar ou virtualizar.

## Fora do escopo atual

- Dashboard com gráficos.
- Edição em massa.
- Autosave.
- Histórico e autoria.
- Rascunhos e aprovação.
- Novos papéis.
- Form engine genérico.
- Virtualização prematura.
