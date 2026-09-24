import { Menu, X } from "lucide-react";
import "../styles/MobilePageLayout.css";

/* same mobile header and expandable navigation menu as in the old version of the app, but now it is a separate component that can be used in any page */
export default function MobilePageHeading({ title, menuOpen, setMenuOpen, sidebarId, menuButtonRef }) {
  return (
    <div className="mobile-page-heading">
      <button
        ref={menuButtonRef}
        type="button"
        className="mobile-page-menu-toggle"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        aria-controls={sidebarId}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <h1>{title}</h1>
    </div>
  );
}
