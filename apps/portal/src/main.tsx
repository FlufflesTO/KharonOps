import React from "react";
import { createRoot } from "react-dom/client";
import "../../../packages/ui/src/tokens.css";
import "./styles/portal-shell.css";
import "./styles.css";
import "./styles/portal-workspace.css";
import "./styles/admin-hardened.css";
import "./styles/tech-hardened.css";
import "./styles/dispatch-hardened.css";
import "./styles/finance-hardened.css";
import "./styles/client-hardened.css";
import "./styles/auth-hardened.css";
import "./styles/dashboard-hardened.css";
import "./styles/summary-hardened.css";
import "./styles/chrome-hardened.css";
import { PortalApp } from "./App";
import { registerPortalServiceWorker } from "./pwa/register";

registerPortalServiceWorker();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PortalApp />
  </React.StrictMode>
);

