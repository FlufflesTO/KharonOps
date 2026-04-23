import React from "react";
import { createRoot } from "react-dom/client";
import "../../../packages/ui/src/tokens.css";
import "./styles/portal-shell.css";
import "./styles.css";
import { PortalApp } from "./App";
import { registerPortalServiceWorker } from "./pwa/register";

registerPortalServiceWorker();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PortalApp />
  </React.StrictMode>
);
