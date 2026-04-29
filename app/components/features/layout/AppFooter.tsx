export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-2 px-4 py-4 text-sm text-gray-500 sm:flex-row">
        <span>© {currentYear} Santo Mimo. Todos os direitos reservados.</span>
        <span className="text-xs text-gray-400">
          Desenvolvido por Santo Mimo
        </span>
      </div>
    </footer>
  );
}
