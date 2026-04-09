import React from "react";
import { createRoot } from "react-dom/client";
import "../../../packages/ui/src/tokens.css";
import "./styles.css";
import { SiteApp } from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SiteApp />
  </React.StrictMode>
);
