import React from "react";
import { Link, useLocation } from "react-router-dom";

const labelMap: Record<string, string> = {
  industries: "Industries",
  sectors: "Industries",
  "case-studies": "Case Studies",
  projects: "Case Studies",
  compliance: "Documentation",
  resources: "Guides",
  about: "About",
  services: "Services",
  contact: "Contact"
};

export function Breadcrumbs(): React.JSX.Element {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0) return <></>;

  return (
    <nav className="site-breadcrumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;

        const label =
          labelMap[value] ??
          value
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

        return last ? (
          <span key={to} className="breadcrumb-current" aria-current="page">
            {label}
          </span>
        ) : (
          <Link key={to} to={to}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
