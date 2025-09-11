import { useEffect } from "react";

export function useBodyOverflow(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;

      document.body.classList.add("overflow-hidden");

      return () => {
        document.body.classList.remove("overflow-hidden");
        if (originalOverflow) {
          document.body.style.overflow = originalOverflow;
        }
      };
    }
  }, [isOpen]);
}
