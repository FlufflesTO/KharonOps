import React from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { NotFound } from "./components/NotFound";
import { HomePage } from "./pages/Home";
import { ServicesHub } from "./pages/ServicesHub";
import { SectorsHub } from "./pages/SectorsHub";
import { CompliancePage } from "./pages/Compliance";
import { OperationalTrailPage } from "./pages/OperationalTrail";
import { AboutPage } from "./pages/About";
import { ResourcesPage } from "./pages/Resources";
import { ContactPage } from "./pages/ContactPage";
import { PrivacyPage } from "./pages/Privacy";
import { TermsPage } from "./pages/Terms";

// Service Subpages
import { FireDetectionPage } from "./pages/services/FireDetection";
import { GaseousSuppressionPage } from "./pages/services/GaseousSuppression";

/**
 * Main router for the Kharon Site.
 * Transitioned to a comprehensive hub-and-spoke IA.
 */
export function SiteApp(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        
        {/* Hubs */}
        <Route path="services" element={<ServicesHub />} />
        <Route path="sectors" element={<SectorsHub />} />
        <Route path="compliance" element={<CompliancePage />} />
        <Route path="projects" element={<OperationalTrailPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="contact" element={<ContactPage />} />
        
        {/* Service Subpages */}
        <Route path="services/fire-detection" element={<FireDetectionPage />} />
        <Route path="services/gaseous-suppression" element={<GaseousSuppressionPage />} />
        {/* placeholder for other services - they will fall back to NotFound for now */}
        
        {/* Support */}
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
