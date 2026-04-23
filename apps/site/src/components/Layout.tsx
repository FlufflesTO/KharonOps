import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { companyProfile, standards } from "../constants/siteData";

const primaryNav = [
  { to: "/services", label: "Services" },
  { to: "/industries", label: "Industries" },
  { to: "/case-studies", label: "Case Studies" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" }
] as const;

const footerLinks = {
  services: [
    { to: "/services", label: "Services" },
    { to: "/industries", label: "Industries" },
    { to: "/case-studies", label: "Case Studies" }
  ],
  company: [
    { to: "/about", label: "About" },
    { to: "/compliance", label: "Documentation" },
    { to: "/resources", label: "Guides" }
  ],
  support: [
    { to: "/contact", label: "Contact" },
    { to: "/privacy", label: "Privacy" },
    { to: "/terms", label: "Terms" }
  ]
} as const;

export function Layout(): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
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

      <header className={`site-nav${menuOpen ? " site-nav--open" : ""}`}>
        <div className="site-nav__utility">
          <Link to="/contact?intent=urgent_callout">Emergency callout: {companyProfile.phone}</Link>
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
            onClick={() => setMenuOpen((current) => !current)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`site-links ${menuOpen ? "site-links--active" : ""}`} aria-label="Primary Navigation">
            {primaryNav.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
                {item.label}
              </NavLink>
            ))}
          </nav>
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

          <div className="site-footer__group">
            <span>Services</span>
            <nav aria-label="Footer services links">
              {footerLinks.services.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="site-footer__group">
            <span>Company</span>
            <nav aria-label="Footer company links">
              {footerLinks.company.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="site-footer__group">
            <span>Support</span>
            <nav aria-label="Footer support links">
              {footerLinks.support.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
                  {item.label}
                </NavLink>
              ))}
              <a href="/portal/">Portal</a>
            </nav>
          </div>

          <div className="site-footer__standards">
            <span>Standards</span>
            <small>{standards.join(" | ")}</small>
          </div>
        </div>
      </footer>
    </div>
  );
}
