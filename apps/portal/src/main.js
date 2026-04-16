import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import "../../../packages/ui/src/tokens.css";
import "./styles.css";
import { PortalApp } from "./App";
import { registerPortalServiceWorker } from "./pwa/register";
registerPortalServiceWorker();
createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(PortalApp, {}) }));
