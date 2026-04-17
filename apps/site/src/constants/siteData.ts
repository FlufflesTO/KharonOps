export const heroSignals = [
  "South Africa service coverage",
  "SANS-aligned fire, suppression, and security delivery",
  "Jobcards, service reports, and site evidence under one trail"
];

export const marketMetrics = [
  { value: "SANS 10139", label: "Fire detection engineering baseline" },
  { value: "SANS 14520", label: "Gaseous suppression and integrity testing" },
  { value: "PSiRA / 24714", label: "Security and biometric governance layer" }
];

export const heroCards = [
  {
    title: "Fire detection systems",
    status: "Operational",
    metric: "L1 to P1 protection tiers",
    tone: "blue",
    items: ["Manual to automatic detection categories", "SAQCC-led design and maintenance", "Inspection-ready evidence packs"]
  },
  {
    title: "Special risk suppression",
    status: "Controlled",
    metric: "Server room and archive protection",
    tone: "amber",
    items: ["Door fan integrity testing", "Pre-discharge logic audits", "Inert gas and CO2 environments"]
  },
  {
    title: "Security and closeout",
    status: "Active",
    metric: "Access, CCTV, intrusion, reporting",
    tone: "green",
    items: ["Biometric movement control", "Forensic CCTV and secure audit trail", "Jobcards and service reports packaged cleanly"]
  }
];

export const servicePrograms = [
  {
    code: "FD",
    title: "Fire detection systems",
    status: "SANS 10139",
    meta: "Manual to L1 and P1 tiers",
    body: "Comprehensive detection solutions from manual coverage through maximum-protection life safety and property tiers, designed to stand up under inspection.",
    points: ["SAQCC-qualified design support", "Category L1-L5 and P1-P2 logic", "Rectification and evidence-led maintenance"]
  },
  {
    code: "GS",
    title: "Gaseous suppression",
    status: "SANS 14520",
    meta: "Special risk and server room protection",
    body: "Specialized suppression for server rooms, archives, and other high-value environments where pre-discharge logic and room integrity matter.",
    points: ["Door fan integrity tests", "Pre-discharge logic audits", "Inert gas and CO2 system readiness"]
  },
  {
    code: "AC",
    title: "Access control and forensic CCTV",
    status: "Integrated",
    meta: "PSiRA, SANS 24714, SANS 10142-1",
    body: "IP-based access, biometric governance, and forensic CCTV execution aligned with fail-safe life safety egress and reliable event logging.",
    points: ["Biometric movement management", "Forensic CCTV with immutable event trail", "Fail-safe fire integration and perimeter hardening"]
  },
  {
    code: "OP",
    title: "Field ops and compliance closeout",
    status: "Operational",
    meta: "PH30 and PH120 cadence, callouts, reporting",
    body: "Planned maintenance, corrective callouts, readings, photos, sign-offs, and consistent client handover assembled into one operational record.",
    points: ["Planned maintenance cadence", "Controlled jobcards and service reports", "Audit-ready evidence and next actions"]
  }
];

export const workflowSteps = [
  {
    step: "Survey and scope",
    body: "We map site type, access rules, known faults, inspection outcomes, and the reporting posture your stakeholders will expect."
  },
  {
    step: "Execute and rectify",
    body: "Install, maintenance, rectification, or callout work is carried out with safe access, disciplined technician handoff, and logged evidence."
  },
  {
    step: "Close and maintain",
    body: "Reports, notes, sign-off, and next actions are packaged cleanly so the service record remains usable months later."
  }
];

export const assurancePanels = [
  {
    label: "Inspection-ready records",
    detail: "Service reports, jobcards, site readings, and photo evidence are packaged into a calm client-facing closeout."
  },
  {
    label: "Planned maintenance discipline",
    detail: "PH30 and PH120 style cadence, controlled callouts, and traceable field execution keep service estates readable."
  },
  {
    label: "High-stakes site posture",
    detail: "The same delivery model is intended for commercial, industrial, healthcare, transport, server-room, and other mission-critical environments."
  }
];

export const caseStudies = [
  {
    tag: "Global compliance",
    title: "Nuclear facility fire audit",
    detail: "Rational design and SANS 10139 compliance checks for high-stakes GTI environments where the margin for vague documentation is zero.",
    stat: "Survey, audit, certify"
  },
  {
    tag: "Protection",
    title: "Server room gaseous suppression",
    detail: "Inert gas installation with mandatory room integrity testing, pre-discharge logic review, and clean closeout for specialized environments.",
    stat: "Design, test, maintain"
  },
  {
    tag: "Integration",
    title: "IP access control rollout",
    detail: "Multi-site biometric deployment with fail-safe life safety egress, controlled handover, and a security posture that remains serviceable.",
    stat: "Commission, govern, handover"
  }
];
