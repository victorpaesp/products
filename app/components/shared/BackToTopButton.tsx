import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { ArrowUp } from "lucide-react";

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <>
      {isVisible && (
        <Button
          onClick={scrollToTop}
          className="fixed right-8 bottom-8 rounded-full p-3 shadow-lg hover:shadow-xl"
          title="Voltar para o topo"
          aria-label="Voltar para o topo"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </>
  );
}
