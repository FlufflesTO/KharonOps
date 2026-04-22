import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { companyProfile, standards } from "../constants/siteData";

export function Layout(): React.JSX.Element {
  const [navHidden, setNavHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false); // Close menu on route change
  }, [location.pathname]);

  useEffect(() => {
    function onScroll(): void {
      const currentY = window.scrollY;
      if (menuOpen) return; // Don't hide nav if menu is open
      if (currentY < 60) {
        setNavHidden(false);
      } else if (currentY > lastScrollY.current + 4) {
        setNavHidden(true);
      } else if (currentY < lastScrollY.current - 4) {
        setNavHidden(false);
      }
      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    setNavHidden(false);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: companyProfile.legalName,
    telephone: companyProfile.phone,
    email: companyProfile.email,
    foundingDate: companyProfile.established,
    address: {
      "@type": "PostalAddress",
      streetAddress: companyProfile.address
    },
    areaServed: companyProfile.serviceFootprint
  };

  return (
    <div className={`site-shell ${menuOpen ? "menu-active" : ""}`}>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(localBusinessSchema)}</script>
      </Helmet>

      <a className="skip-link" href="#site-main">
        Skip to main content
      </a>

      <header className={`site-nav${navHidden ? " site-nav--hidden" : ""}${menuOpen ? " site-nav--open" : ""}`}>

        <div className="site-nav__utility">
          <Link to="/contact?intent=urgent_callout">Emergency callout</Link>
          <Link to="/contact?intent=maintenance">Maintenance</Link>
          <Link to="/contact">Contact</Link>
          <a href="/portal/">Portal</a>
        </div>
        <div className="site-nav__main">
          <Link className="site-brand" to="/">
            <div className="site-brand__mark">
              <svg viewBox="0 0 100 100" width="32" height="32" aria-hidden="true">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-primary)" strokeWidth="8" />
                <circle cx="50" cy="50" r="25" fill="var(--color-primary)" opacity="0.3" />
                <circle cx="50" cy="50" r="12" fill="var(--color-primary)" />
              </svg>
            </div>
            <span className="site-brand__copy">
              <strong>KHARON</strong>
              <small>Fire and Security Solutions</small>
            </span>
          </Link>
          <button
            className={`nav-toggle ${menuOpen ? "nav-toggle--active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`site-links ${menuOpen ? "site-links--active" : ""}`} aria-label="Primary Navigation">
            <NavLink to="/services" className={({ isActive }) => (isActive ? "active" : "")}>
              Services
            </NavLink>
            <NavLink to="/sectors" className={({ isActive }) => (isActive ? "active" : "")}>
              Sectors
            </NavLink>
            <NavLink to="/compliance" className={({ isActive }) => (isActive ? "active" : "")}>
              Compliance
            </NavLink>
            <NavLink to="/projects" className={({ isActive }) => (isActive ? "active" : "")}>
              Projects
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
              About
            </NavLink>
            <NavLink to="/resources" className={({ isActive }) => (isActive ? "active" : "")}>
              Resources
            </NavLink>
            <a href="/portal/" className="nav-portal-button">Portal Login</a>

          </nav>

          <div className="site-nav__actions">
            <span className="nav-status-dot nav-status-dot--live" aria-label="Operational status live" />
          </div>
        </div>
      </header>

      <main id="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <strong>{companyProfile.legalName.toUpperCase()}</strong>
            <span>{companyProfile.address}</span>
            <small>
              Reg: {companyProfile.registration} | T: {companyProfile.phone} | E: {companyProfile.email}
            </small>
            <small>
              {companyProfile.officeHours} | Service footprint: {companyProfile.serviceFootprint.join(", ")}
            </small>
          </div>
          <div className="site-footer__standards">
            <span>Standards:</span>
            <small>{standards.join(" | ")}</small>
          </div>
          <nav className="site-footer__links" aria-label="Footer links">
            <NavLink to="/privacy" className={({ isActive }) => (isActive ? "active" : "")}>Privacy</NavLink>
            <NavLink to="/terms" className={({ isActive }) => (isActive ? "active" : "")}>Terms</NavLink>
            <a href="/portal/">Portal</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
