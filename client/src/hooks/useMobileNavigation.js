import { useEffect, useId, useRef, useState } from "react";

export default function useMobileNavigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarId = useId();
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    if (menuOpen) {
      sidebarRef.current?.querySelector("nav button")?.focus();
    }
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  return {
    layoutClassName: `mobile-page-layout${menuOpen ? " mobile-menu-open" : ""}`,
    onKeyDown: (event) => {
      if (event.key === "Escape" && menuOpen) closeMenu();
    },
    sidebarProps: {
      id: sidebarId,
      ref: sidebarRef,
      onClick: (event) => {
        if (menuOpen && event.target.closest("button")) closeMenu();
      },
    },
    headingProps: { menuOpen, setMenuOpen, sidebarId, menuButtonRef },
  };
}
