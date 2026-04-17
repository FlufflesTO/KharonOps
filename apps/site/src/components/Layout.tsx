import React, { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export function Layout() {
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);
  const location = useLocation();

  // Scroll to top when path changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    function onScroll(): void {
      const currentY = window.scrollY;
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
  }, []);

  return (
    <div className="site-shell">
      <header className={`site-nav${navHidden ? " site-nav--hidden" : ""}`}>
        <div className="site-nav__utility">
          <a href="mailto:admin@kharon.co.za?subject=Service%20Inquiry">Callout & Service</a>
          <Link to="/contact">Contact</Link>
          <a href="/portal/">Portal Access</a>
        </div>
        <div className="site-nav__main">
          <Link className="site-brand" to="/">
            <div className="site-brand__mark">
              <svg viewBox="0 0 100 100" width="32" height="32">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-primary)" strokeWidth="8" />
                <circle cx="50" cy="50" r="25" fill="var(--color-primary)" opacity="0.3" />
                <circle cx="50" cy="50" r="12" fill="var(--color-primary)" />
              </svg>
            </div>
            <span className="site-brand__copy">
              <strong>KHARON</strong>
              <small>Fire &amp; Security Solutions</small>
            </span>
          </Link>
          <nav className="site-links" aria-label="Primary Navigation">
            <Link to="/services">Services</Link>
            <Link to="/sectors">Sectors</Link>
            <Link to="/compliance">Compliance</Link>
            <Link to="/projects">Projects</Link>
            <Link to="/about">About</Link>
            <Link to="/resources">Resources</Link>
          </nav>
          <div className="site-nav__actions">
            <span className="nav-status-dot nav-status-dot--live" aria-label="Operational" />
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <strong>KHARON FIRE &amp; Security SOLUTIONS</strong>
            <span>Unit 58, M5 Freeway Park, Cnr Uppercamp &amp; Berkley Rd, Ndabeni, Maitland, 7405</span>
            <small>Reg: 2016/313076/07 • T: 061 545 8830 • E: admin@kharon.co.za</small>
          </div>
          <nav className="site-footer__links" aria-label="Compliance">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <a href="/portal/">Portal Access</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
