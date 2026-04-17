export interface ServiceProfile {
  slug: string;
  navLabel: string;
  title: string;
  summary: string;
  standards: string[];
  environments: string[];
  scope: string[];
  deliverables: string[];
  ctaLabel: string;
}

export interface SectorProfile {
  slug: string;
  title: string;
  summary: string;
  focus: string[];
  commonScope: string[];
}

export interface CaseStudy {
  slug: string;
  title: string;
  environment: string;
  problem: string;
  scope: string[];
  outcome: string;
  complianceDelivered: string[];
}

export const companyProfile = {
  legalName: "Kharon Fire and Security Solutions",
  established: "2016",
  registration: "2016/313076/07",
  address: "Unit 58, M5 Freeway Park, Cnr Uppercamp and Berkley Rd, Ndabeni, Maitland, 7405",
  phone: "061 545 8830",
  email: "admin@kharon.co.za",
  officeHours: "08:00 to 17:00 (Mon to Fri)",
  serviceFootprint: ["Cape Town", "Botswana", "Malawi"]
} as const;

export const trustSignals = [
  "Engineering-led fire and security execution",
  "Inspection-ready documentation and closeout packs",
  "Planned maintenance and urgent callout response model"
];

export const standards = [
  "SANS 10139",
  "SANS 14520",
  "SANS 10400",
  "SANS 322",
  "SANS 24714",
  "SANS 10142-1"
];

export const partnerLogos = [
  "Apollo",
  "Ziton",
  "Impro",
  "Hikvision",
  "Dahua",
  "Paxton"
];

export const services: ServiceProfile[] = [
  {
    slug: "fire-detection-alarm",
    navLabel: "Fire Detection and Alarm",
    title: "Fire Detection and Alarm Systems",
    summary:
      "SANS 10139-aligned design, installation, maintenance, and rectification for life-safety and property-protection environments.",
    standards: ["SANS 10139", "SANS 10400"],
    environments: ["Commercial buildings", "Industrial facilities", "Healthcare", "Education campuses"],
    scope: [
      "Design and device schedules",
      "New installation and expansion projects",
      "Panel programming and cause-and-effect logic",
      "Quarterly and annual maintenance",
      "Fault finding and corrective works"
    ],
    deliverables: [
      "Inspection-ready service report",
      "Defect list with rectification priorities",
      "Updated as-built markups and asset register",
      "Client sign-off and next service date"
    ],
    ctaLabel: "Book detection assessment"
  },
  {
    slug: "gaseous-suppression",
    navLabel: "Gaseous Suppression",
    title: "Gaseous Suppression Systems",
    summary:
      "Special-risk suppression delivery for data rooms, archives, and high-value technical spaces where water suppression is not viable.",
    standards: ["SANS 14520", "SANS 10400"],
    environments: ["Server rooms", "Data centers", "Archive rooms", "Control rooms"],
    scope: [
      "Suppression design review and calculations",
      "Cylinder, manifold, and nozzle installation",
      "Pre-discharge logic verification",
      "Door-fan room-integrity testing",
      "Annual system health and recharge planning"
    ],
    deliverables: [
      "Integrity test result pack",
      "Commissioning certificate set",
      "Pre-discharge sequence report",
      "Maintenance action register"
    ],
    ctaLabel: "Request suppression survey"
  },
  {
    slug: "access-control",
    navLabel: "Access Control",
    title: "Access Control and Biometric Governance",
    summary:
      "Role-aware access control, visitor flow control, and life-safety fail-safe integration for high-accountability sites.",
    standards: ["SANS 24714", "SANS 10142-1"],
    environments: ["Corporate sites", "Industrial zones", "Residential estates", "Education campuses"],
    scope: [
      "Controller and reader architecture",
      "Biometric and card-based enrolment flows",
      "Turnstile and boom integration",
      "Fire alarm fail-safe linkage",
      "Operational policy tuning and reporting"
    ],
    deliverables: [
      "Access matrix configuration record",
      "Event log and exception summary",
      "Emergency egress integration checklist",
      "Handover and operator training notes"
    ],
    ctaLabel: "Plan access upgrade"
  },
  {
    slug: "cctv-surveillance",
    navLabel: "CCTV and Surveillance",
    title: "CCTV and Surveillance Systems",
    summary:
      "Forensic-ready video coverage with resilient recording, health monitoring, and clear evidence retrieval workflows.",
    standards: ["SANS 10142-1", "Site security policy alignment"],
    environments: ["Retail and commercial", "Industrial yards", "Critical perimeter zones", "Multi-site portfolios"],
    scope: [
      "Coverage design and lens strategy",
      "Camera and network installation",
      "NVR and retention policy setup",
      "Remote monitoring and health checks",
      "Incident extraction and chain-of-custody process"
    ],
    deliverables: [
      "Camera placement and coverage diagram",
      "Retention and export policy sheet",
      "Health-check service report",
      "Incident retrieval SOP guidance"
    ],
    ctaLabel: "Design CCTV scope"
  },
  {
    slug: "integrated-security",
    navLabel: "Integrated Security Systems",
    title: "Integrated Security Systems",
    summary:
      "Unified engineering delivery across detection, access, intrusion, and surveillance for single-site and portfolio operations.",
    standards: ["SANS 10139", "SANS 24714", "SANS 10142-1"],
    environments: ["Multi-site operations", "Mixed-use facilities", "High-risk infrastructure"],
    scope: [
      "System architecture and integration planning",
      "Cross-platform event and alarm workflows",
      "Operator workflow design",
      "Lifecycle maintenance program",
      "Documentation and service governance"
    ],
    deliverables: [
      "Integrated design baseline",
      "Commissioning and integration test pack",
      "Operational runbook",
      "Governance dashboard recommendations"
    ],
    ctaLabel: "Scope integrated program"
  },
  {
    slug: "planned-maintenance",
    navLabel: "Planned Maintenance",
    title: "Planned Preventative Maintenance",
    summary:
      "Programmatic PH30 and PH120 maintenance services that keep fire and security estates compliant, readable, and reliable.",
    standards: ["SANS 10139", "SANS 14520", "Client compliance policies"],
    environments: ["Commercial portfolios", "Industrial plants", "Hospitality", "Healthcare"],
    scope: [
      "Asset register alignment and scheduling",
      "Routine inspections and testing",
      "Defect detection and severity grading",
      "Rectification planning and verification",
      "Audit trail continuity management"
    ],
    deliverables: [
      "Planned maintenance report",
      "Fault and risk register",
      "Rectification quotation support",
      "Management summary for stakeholders"
    ],
    ctaLabel: "Start maintenance plan"
  },
  {
    slug: "callouts-break-fix",
    navLabel: "Callouts and Break-Fix",
    title: "Adhoc Maintenance and Break-Fix",
    summary:
      "Rapid response engineering for faults and outages with controlled diagnosis, restoration, and documented closeout.",
    standards: ["Site emergency protocols", "Applicable SANS controls"],
    environments: ["Live operational facilities", "24/7 sites", "Critical rooms"],
    scope: [
      "Emergency triage and dispatch",
      "On-site fault diagnosis",
      "Temporary and permanent restoration",
      "Post-incident root-cause summary",
      "Follow-up maintenance recommendations"
    ],
    deliverables: [
      "Callout report and incident timeline",
      "Parts and labour summary",
      "Root-cause and recurrence notes",
      "Recommended next-step actions"
    ],
    ctaLabel: "Request urgent callout"
  },
  {
    slug: "compliance-reporting",
    navLabel: "Compliance Documentation",
    title: "Compliance Documentation and Reporting",
    summary:
      "Inspection-ready records, certificates, and service evidence packs designed for auditors, insurers, and operational leadership.",
    standards: ["SANS 10139", "SANS 10400", "Client governance requirements"],
    environments: ["Audit cycles", "Insurance reviews", "Regulatory inspections"],
    scope: [
      "Service certificate preparation",
      "Maintenance logs and test result packs",
      "As-built and O and M handover organization",
      "Compliance gap analysis and remediation roadmap",
      "Portfolio reporting for leadership reviews"
    ],
    deliverables: [
      "Inspection-ready document pack",
      "Compliance status summary",
      "Remediation action tracker",
      "Signed closeout package"
    ],
    ctaLabel: "Prepare documentation pack"
  }
];

export const sectors: SectorProfile[] = [
  {
    slug: "commercial-buildings",
    title: "Commercial Buildings",
    summary: "Protection and compliance execution for offices, mixed-use complexes, and managed commercial portfolios.",
    focus: ["High occupancy safety", "Tenant continuity", "Inspection readiness"],
    commonScope: ["Detection and evacuation systems", "Access and visitor controls", "Managed maintenance reporting"]
  },
  {
    slug: "industrial-facilities",
    title: "Industrial Facilities",
    summary: "Engineered fire and security controls for production sites, warehousing, and high-risk logistics operations.",
    focus: ["Production uptime", "Perimeter hardening", "Operational reliability"],
    commonScope: ["Hazard-zone detection", "Industrial CCTV and access", "Corrective response playbooks"]
  },
  {
    slug: "data-server-rooms",
    title: "Data and Server Rooms",
    summary: "Special-risk protection for digital infrastructure where suppression integrity and strict records are non-negotiable.",
    focus: ["Suppression integrity", "Downtime risk reduction", "Evidence-ready maintenance"],
    commonScope: ["Gaseous suppression", "Room integrity testing", "Alarm and access integration"]
  },
  {
    slug: "hospitality",
    title: "Hospitality",
    summary: "Discreet but robust life-safety and security operations for hotels, lodges, and tourism portfolios.",
    focus: ["Guest safety", "Brand continuity", "Rapid fault recovery"],
    commonScope: ["Public area detection", "Back-of-house controls", "Service response management"]
  },
  {
    slug: "healthcare",
    title: "Healthcare",
    summary: "Life-critical fire and security support for hospitals, clinics, and medical campuses with strict risk controls.",
    focus: ["Life-critical continuity", "Regulated governance", "Response assurance"],
    commonScope: ["Zoned detection strategies", "Access hierarchy management", "Auditable maintenance and incident reporting"]
  },
  {
    slug: "education",
    title: "Education",
    summary: "Scalable protection programs for schools and campuses balancing safety, accessibility, and operational practicality.",
    focus: ["Campus safety", "Distributed site management", "Stakeholder transparency"],
    commonScope: ["Multi-building fire systems", "Student-safe access policies", "Scheduled maintenance and reporting"]
  }
];

export const compliancePillars = [
  {
    title: "Standards Alignment",
    detail: "System design and service execution are mapped against relevant SANS standards and documented for review."
  },
  {
    title: "Inspection-Ready Reporting",
    detail: "Every maintenance cycle produces clear reports, certificates, readings, and action items for auditors and insurers."
  },
  {
    title: "Operational Audit Trail",
    detail: "Work orders, callout outcomes, and rectification records are structured into an accessible evidence trail."
  },
  {
    title: "Handover Documentation",
    detail: "As-builts, O and M notes, and closeout packs are organized so teams can operate confidently after project delivery."
  }
];

export const caseStudies: CaseStudy[] = [
  {
    slug: "nuclear-facility-audit",
    title: "Nuclear Facility Fire Audit Program",
    environment: "High-stakes industrial environment",
    problem: "Legacy detection records and test history were fragmented across teams and contractors.",
    scope: [
      "Conducted detailed compliance survey against SANS 10139 baseline",
      "Rebuilt documentation trail for detector assets and service history",
      "Prioritized remediation sequencing for audit-readiness"
    ],
    outcome:
      "Client moved from fragmented evidence to a unified, inspection-ready compliance set with clear remediation ownership.",
    complianceDelivered: ["Audit pack", "Defect register", "Management closeout summary"]
  },
  {
    slug: "server-room-suppression-upgrade",
    title: "Server Room Suppression Upgrade",
    environment: "Mission-critical data environment",
    problem: "Suppression discharge confidence was low due to uncertain room retention and undocumented logic behavior.",
    scope: [
      "Upgraded inert-gas suppression configuration",
      "Completed door-fan integrity testing and leakage remediation",
      "Verified pre-discharge sequences and alarm integration"
    ],
    outcome:
      "The facility received validated retention performance, improved suppression confidence, and a complete commissioning dossier.",
    complianceDelivered: ["Integrity test certificate", "Pre-discharge verification report", "Service handover pack"]
  },
  {
    slug: "multi-site-access-rollout",
    title: "Multi-Site Access and CCTV Rollout",
    environment: "Distributed commercial and industrial portfolio",
    problem: "Inconsistent site-level controls and weak event traceability slowed incident response and governance reviews.",
    scope: [
      "Standardized access and CCTV architecture across sites",
      "Integrated event logic and role-based access controls",
      "Introduced operational playbooks for incident retrieval"
    ],
    outcome:
      "Stakeholders gained consistent site posture, faster investigations, and stronger governance reporting across the portfolio.",
    complianceDelivered: ["Cross-site configuration baseline", "Event governance template", "Operational runbook"]
  }
];

export const resourceCards = [
  {
    title: "Maintenance Planning Checklist",
    description:
      "A practical checklist for preparing planned preventative maintenance programs that remain inspection-ready.",
    format: "Checklist"
  },
  {
    title: "Suppression Integrity Primer",
    description:
      "A concise guide to room integrity testing, retention time expectations, and pre-discharge verification.",
    format: "Technical note"
  },
  {
    title: "Compliance Pack Contents",
    description:
      "A model structure for service certificates, logs, as-builts, O and M notes, and corrective action records.",
    format: "Reference"
  }
];
