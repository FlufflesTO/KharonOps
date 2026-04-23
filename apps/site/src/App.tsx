import React from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { NotFound } from "./components/NotFound";
import { AboutPage } from "./pages/About";
import { CompliancePage } from "./pages/Compliance";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/Home";
import { OperationalTrailPage } from "./pages/OperationalTrail";
import { PrivacyPage } from "./pages/Privacy";
import { ResourcesPage } from "./pages/Resources";
import { SectorDetailPage } from "./pages/SectorDetail";
import { SectorsHub } from "./pages/SectorsHub";
import { ServiceDetailPage } from "./pages/ServiceDetail";
import { ServicesHub } from "./pages/ServicesHub";
import { TermsPage } from "./pages/Terms";

export function SiteApp(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />

        <Route path="services" element={<ServicesHub />} />
        <Route path="services/:serviceSlug" element={<ServiceDetailPage />} />

        <Route path="industries" element={<SectorsHub />} />
        <Route path="industries/:sectorSlug" element={<SectorDetailPage />} />
        <Route path="sectors" element={<SectorsHub />} />
        <Route path="sectors/:sectorSlug" element={<SectorDetailPage />} />

        <Route path="compliance" element={<CompliancePage />} />
        <Route path="case-studies" element={<OperationalTrailPage />} />
        <Route path="projects" element={<OperationalTrailPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
