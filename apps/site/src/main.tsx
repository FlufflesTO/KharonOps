import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "../../../packages/ui/src/tokens.css";
import "./styles.css";
import { SiteApp } from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SiteApp />
    </BrowserRouter>
  </React.StrictMode>
);
